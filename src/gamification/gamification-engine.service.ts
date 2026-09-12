import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, XpSource } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

/** Prisma's interactive-transaction client (what `prisma.$transaction(async (tx) => ...)` hands you). */
type TransactionClient = Prisma.TransactionClient;

export interface ProcessEventParams {
  userId: string;
  eventType: XpSource;
  /**
   * Optional payload for the event. For TEACHER_REWARD (and SYSTEM_BONUS, as an
   * extension of the spec) a numeric `metadata.customXp` overrides the default
   * XP amount. Any other keys are stored as-is on the XpLog row.
   */
  metadata?: Record<string, unknown>;
}

export interface ProcessEventResult {
  xpEarned: number;
  newTotalXp: number;
  currentLevel: number;
  didLevelUp: boolean;
  streakUpdated: boolean;
  currentStreak: number;
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

/** Base XP granted per event type. TEACHER_REWARD's default is used only when no customXp is supplied. */
const BASE_XP_REWARDS: Partial<Record<XpSource, number>> = {
  [XpSource.CLASS_ATTENDANCE]: 100,
  [XpSource.DAILY_VOICE_QUEST]: 30,
  [XpSource.AI_PRACTICE]: 15,
  [XpSource.MODULE_EVALUATION]: 200,
  [XpSource.TEACHER_REWARD]: 25,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================================================
// Service
// ============================================================================

/**
 * Processes gamification events for SpeakingLab: XP awards, level-up
 * evaluation, and daily streak maintenance. Every event is applied atomically
 * via a single Prisma interactive transaction.
 */
@Injectable()
export class GamificationEngineService {
  constructor(private readonly prisma: PrismaClient) {}

  // --------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------

  /**
   * Processes a single gamification event end-to-end:
   * 1. Logs the XP gain in `XpLog`.
   * 2. Updates the user's streak.
   * 3. Applies the XP to the user's total and evaluates level-up.
   *
   * All steps run inside one `prisma.$transaction` so a failure in any step
   * rolls back the whole event (no partial XP grants or orphaned logs).
   */
  async processEvent(params: ProcessEventParams): Promise<ProcessEventResult> {
    const { userId, eventType, metadata } = params;

    if (!userId || typeof userId !== 'string') {
      throw new InvalidEventParamsError('processEvent requires a valid userId.');
    }
    if (!eventType || !(eventType in XpSource)) {
      throw new InvalidEventParamsError(`processEvent requires a valid eventType, received: ${String(eventType)}`);
    }

    return this.prisma.$transaction(async (tx) => {
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
      const { newLevel, didLevelUp } = this.checkLevelUp(newTotalXp, user.level);

      await tx.user.update({
        where: { id: userId },
        data: {
          currentXp: newTotalXp,
          level: newLevel,
        },
      });

      return {
        xpEarned,
        newTotalXp,
        currentLevel: newLevel,
        didLevelUp,
        streakUpdated,
        currentStreak,
      };
    });
  }

  // --------------------------------------------------------------------
  // XP calculation
  // --------------------------------------------------------------------

  /**
   * Resolves how much XP an event is worth. TEACHER_REWARD reads
   * `metadata.customXp` (falling back to +25 XP). SYSTEM_BONUS follows the
   * same override pattern as an extension, defaulting to 0 XP when no
   * custom amount is given, since the spec does not define a base value.
   */
  private calculateXpForEvent(eventType: XpSource, metadata?: Record<string, unknown>): number {
    switch (eventType) {
      case XpSource.CLASS_ATTENDANCE:
      case XpSource.DAILY_VOICE_QUEST:
      case XpSource.AI_PRACTICE:
      case XpSource.MODULE_EVALUATION:
        return BASE_XP_REWARDS[eventType] as number;

      case XpSource.TEACHER_REWARD: {
        const custom = metadata?.customXp;
        if (this.isValidXpOverride(custom)) {
          return Math.floor(custom);
        }
        return BASE_XP_REWARDS[XpSource.TEACHER_REWARD] as number;
      }

      case XpSource.SYSTEM_BONUS: {
        const custom = metadata?.customXp;
        return this.isValidXpOverride(custom) ? Math.floor(custom) : 0;
      }

      default:
        throw new UnsupportedXpSourceError(eventType);
    }
  }

  private isValidXpOverride(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  // --------------------------------------------------------------------
  // Level-up logic
  // --------------------------------------------------------------------

  /** XP total required to *reach* level N: floor(100 * N^1.5). */
  private getXpRequiredForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Given a user's new cumulative XP and their current level, determines the
   * resulting level after applying the gain. Loops so a large XP grant
   * (e.g. a MODULE_EVALUATION bonus) can cause multiple level-ups at once.
   */
  private checkLevelUp(currentXp: number, currentLevel: number): { newLevel: number; didLevelUp: boolean } {
    let level = currentLevel;
    let didLevelUp = false;

    while (currentXp >= this.getXpRequiredForLevel(level + 1)) {
      level += 1;
      didLevelUp = true;
    }

    return { newLevel: level, didLevelUp };
  }

  // --------------------------------------------------------------------
  // Streak logic
  // --------------------------------------------------------------------

  /**
   * Applies the daily-streak rules for a practice event happening at `now`:
   * - Same calendar day as last activity → no change.
   * - Exactly one calendar day later → streak +1 (and maxStreak bumped).
   * - More than one day later:
   *     - with freeze credits available → spend one, streak is preserved.
   *     - with no freeze credits → streak resets to 1.
   *
   * Day boundaries are computed on the UTC calendar date, so the comparison
   * ignores time-of-day regardless of the timezone the timestamps were
   * originally recorded in.
   */
  private async updateStreak(tx: TransactionClient, userId: string, now: Date): Promise<StreakUpdateResult> {
    const streak = await tx.streak.findUnique({ where: { userId } });

    // Defensive fallback: a user should always have a Streak row (1:1), but
    // if one is missing (e.g. legacy data), create it and start at day 1.
    if (!streak) {
      const created = await tx.streak.create({
        data: {
          userId,
          currentStreak: 1,
          maxStreak: 1,
          lastActivityDate: now,
          freezeCredits: 0,
        },
      });
      return { streakUpdated: true, currentStreak: created.currentStreak };
    }

    const diffDays = this.diffInCalendarDays(streak.lastActivityDate, now);

    // Same day, or a clock/timezone anomaly producing a non-positive diff:
    // treat as "already active today" and leave the streak untouched.
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

    // diffDays > 1: a day (or more) was missed.
    if (streak.freezeCredits > 0) {
      const updated = await tx.streak.update({
        where: { userId },
        data: {
          freezeCredits: { decrement: 1 },
          lastActivityDate: now,
          // currentStreak/maxStreak intentionally unchanged: the freeze rescues the streak as-is.
        },
      });
      return { streakUpdated: true, currentStreak: updated.currentStreak };
    }

    const updated = await tx.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        maxStreak: Math.max(streak.maxStreak, 1),
        lastActivityDate: now,
      },
    });
    return { streakUpdated: true, currentStreak: updated.currentStreak };
  }

  /** Difference in whole UTC calendar days between two dates (ignores time-of-day). */
  private diffInCalendarDays(from: Date, to: Date): number {
    const utcFrom = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    const utcTo = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
    return Math.round((utcTo - utcFrom) / MS_PER_DAY);
  }
}
