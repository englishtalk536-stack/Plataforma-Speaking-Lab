import { Prisma, PrismaClient, XpSource } from '@prisma/client';
import { getXpRequiredForLevel } from '../lib/gamification/xp-formula';

// ============================================================================
// Types
// ============================================================================

type TransactionClient = Prisma.TransactionClient;

export interface ProcessEventParams {
  userId: string;
  eventType: XpSource;
  /**
   * Optional payload for the event. `customXp` overrides the default XP
   * amount for TEACHER_REWARD, DAILY_VOICE_QUEST, and SYSTEM_BONUS (all
   * event types whose reward can vary per instance rather than being a
   * fixed platform constant). Any other keys are stored as-is on the log.
   */
  metadata?: Record<string, unknown>;
  /** Speaking Coins to add to the user's balance for this event, if any. Defaults to 0. */
  coinsAwarded?: number;
}

export interface ProcessEventResult {
  xpEarned: number;
  newTotalXp: number;
  currentLevel: number;
  didLevelUp: boolean;
  streakUpdated: boolean;
  currentStreak: number;
  coinsEarned: number;
  newTotalCoins: number;
}

interface StreakUpdateResult {
  streakUpdated: boolean;
  currentStreak: number;
}

// ============================================================================
// Errors
// ============================================================================

export class GamificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GamificationError';
  }
}

export class UserNotFoundError extends GamificationError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class UnsupportedXpSourceError extends GamificationError {
  constructor(eventType: string) {
    super(`Unsupported XpSource: ${eventType}`);
    this.name = 'UnsupportedXpSourceError';
  }
}

export class InvalidEventParamsError extends GamificationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEventParamsError';
  }
}

// ============================================================================
// Constants
// ============================================================================

const BASE_XP_REWARDS: Partial<Record<XpSource, number>> = {
  [XpSource.CLASS_ATTENDANCE]: 100,
  [XpSource.DAILY_VOICE_QUEST]: 30,
  [XpSource.AI_PRACTICE]: 15,
  [XpSource.MODULE_EVALUATION]: 200,
  [XpSource.TEACHER_REWARD]: 25,
};

/** Event types whose reward may be overridden per-instance via `metadata.customXp`. */
const OVERRIDABLE_XP_SOURCES = new Set<XpSource>([
  XpSource.TEACHER_REWARD,
  XpSource.DAILY_VOICE_QUEST,
  XpSource.SYSTEM_BONUS,
  // MODULE_EVALUATION's base (200) is a fallback only — real lesson
  // completions pass the specific SkillNode's `xpReward` as customXp, since
  // that varies per node (see /api/student/lesson/complete).
  XpSource.MODULE_EVALUATION,
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================================================
// Service
// ============================================================================

/**
 * Processes gamification events for SpeakingLab: XP awards, coin awards,
 * level-up evaluation, and daily streak maintenance.
 *
 * Adapted for direct use in Next.js Route Handlers: a plain class with no
 * framework DI, instantiated as `new GamificationEngineService(prisma)`.
 * The core logic (`applyEventWithinTransaction`) takes an existing
 * `Prisma.TransactionClient`, so a caller that already has other writes to
 * make atomically alongside the reward (e.g. marking a quest COMPLETED) can
 * run everything in a single `prisma.$transaction`. `processEvent` remains
 * the simple entry point for callers who just want the event applied on
 * its own.
 */
export class GamificationEngineService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Applies a single event in its own dedicated transaction. */
  async processEvent(params: ProcessEventParams): Promise<ProcessEventResult> {
    this.validateParams(params);
    return this.prisma.$transaction((tx) => this.applyEventWithinTransaction(tx, params));
  }

  /**
   * Core event logic, composable with a caller-owned transaction. Use this
   * directly (instead of `processEvent`) when the event must be atomic
   * with other writes — e.g. flipping a UserDailyQuest to COMPLETED only if
   * the reward was actually granted.
   */
  async applyEventWithinTransaction(
    tx: TransactionClient,
    params: ProcessEventParams,
  ): Promise<ProcessEventResult> {
    this.validateParams(params);
    const { userId, eventType, metadata, coinsAwarded = 0 } = params;

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const xpEarned = this.calculateXpForEvent(eventType, metadata);

    await tx.xpLog.create({
      data: {
        userId,
        xpAmount: xpEarned,
        sourceType: eventType,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    const now = new Date();
    const { streakUpdated, currentStreak } = await this.updateStreak(tx, userId, now);

    const newTotalXp = user.currentXp + xpEarned;
    const newTotalCoins = user.coins + coinsAwarded;
    const { newLevel, didLevelUp } = this.checkLevelUp(newTotalXp, user.level);

    await tx.user.update({
      where: { id: userId },
      data: {
        currentXp: newTotalXp,
        level: newLevel,
        coins: newTotalCoins,
      },
    });

    return {
      xpEarned,
      newTotalXp,
      currentLevel: newLevel,
      didLevelUp,
      streakUpdated,
      currentStreak,
      coinsEarned: coinsAwarded,
      newTotalCoins,
    };
  }

  private validateParams(params: ProcessEventParams): void {
    if (!params.userId || typeof params.userId !== 'string') {
      throw new InvalidEventParamsError('A valid userId is required.');
    }
    if (!params.eventType || !(params.eventType in XpSource)) {
      throw new InvalidEventParamsError(`Invalid eventType: ${String(params.eventType)}`);
    }
    if (params.coinsAwarded !== undefined && (!Number.isFinite(params.coinsAwarded) || params.coinsAwarded < 0)) {
      throw new InvalidEventParamsError('coinsAwarded must be a non-negative finite number.');
    }
  }

  // --------------------------------------------------------------------
  // XP calculation
  // --------------------------------------------------------------------

  private calculateXpForEvent(eventType: XpSource, metadata?: Record<string, unknown>): number {
    if (OVERRIDABLE_XP_SOURCES.has(eventType)) {
      const custom = metadata?.customXp;
      if (this.isValidXpOverride(custom)) {
        return Math.floor(custom);
      }
      return BASE_XP_REWARDS[eventType] ?? 0;
    }

    const base = BASE_XP_REWARDS[eventType];
    if (base === undefined) {
      throw new UnsupportedXpSourceError(eventType);
    }
    return base;
  }

  private isValidXpOverride(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  // --------------------------------------------------------------------
  // Level-up logic
  // --------------------------------------------------------------------

  private checkLevelUp(currentXp: number, currentLevel: number): { newLevel: number; didLevelUp: boolean } {
    let level = currentLevel;
    let didLevelUp = false;

    while (currentXp >= getXpRequiredForLevel(level + 1)) {
      level += 1;
      didLevelUp = true;
    }

    return { newLevel: level, didLevelUp };
  }

  // --------------------------------------------------------------------
  // Streak logic
  // --------------------------------------------------------------------

  private async updateStreak(tx: TransactionClient, userId: string, now: Date): Promise<StreakUpdateResult> {
    const streak = await tx.streak.findUnique({ where: { userId } });

    if (!streak) {
      const created = await tx.streak.create({
        data: { userId, currentStreak: 1, maxStreak: 1, lastActivityDate: now, freezeCredits: 0 },
      });
      return { streakUpdated: true, currentStreak: created.currentStreak };
    }

    const diffDays = this.diffInCalendarDays(streak.lastActivityDate, now);

    if (diffDays <= 0) {
      return { streakUpdated: false, currentStreak: streak.currentStreak };
    }

    if (diffDays === 1) {
      const newStreak = streak.currentStreak + 1;
      const updated = await tx.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          maxStreak: Math.max(streak.maxStreak, newStreak),
          lastActivityDate: now,
        },
      });
      return { streakUpdated: true, currentStreak: updated.currentStreak };
    }

    if (streak.freezeCredits > 0) {
      const updated = await tx.streak.update({
        where: { userId },
        data: { freezeCredits: { decrement: 1 }, lastActivityDate: now },
      });
      return { streakUpdated: true, currentStreak: updated.currentStreak };
    }

    const updated = await tx.streak.update({
      where: { userId },
      data: { currentStreak: 1, maxStreak: Math.max(streak.maxStreak, 1), lastActivityDate: now },
    });
    return { streakUpdated: true, currentStreak: updated.currentStreak };
  }

  private diffInCalendarDays(from: Date, to: Date): number {
    const utcFrom = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    const utcTo = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
    return Math.round((utcTo - utcFrom) / MS_PER_DAY);
  }
}
