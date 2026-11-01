import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamificationEngineService } from '../../src/server/gamification-engine.service';
import { XpSource } from '@prisma/client';

const fixedNow = new Date('2026-11-01T12:00:00.000Z');

describe('completed practice replay streak handling', () => {
  let streak: { id: string; userId: string; currentStreak: number; maxStreak: number; lastActivityDate: Date; freezeCredits: number };
  let user: { id: string; currentXp: number; level: number; coins: number };
  let streakUpdate: ReturnType<typeof vi.fn>;
  let transaction: {
    user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    xpLog: { create: ReturnType<typeof vi.fn> };
    streak: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  };
  let engine: GamificationEngineService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    streak = {
      id: 'streak-id',
      userId: 'student-id',
      currentStreak: 3,
      maxStreak: 5,
      lastActivityDate: new Date('2026-11-01T08:00:00.000Z'),
      freezeCredits: 0,
    };
    user = { id: 'student-id', currentXp: 0, level: 1, coins: 0 };
    streakUpdate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      Object.assign(streak, data);
      if (typeof data.currentStreak === 'object' && data.currentStreak !== null && 'increment' in data.currentStreak) {
        streak.currentStreak += Number(data.currentStreak.increment);
      }
      return { ...streak };
    });
    transaction = {
      user: {
        findUnique: vi.fn(async () => ({ ...user })),
        update: vi.fn(async ({ data }: { data: Partial<typeof user> }) => Object.assign(user, data)),
      },
      xpLog: { create: vi.fn(async () => ({ id: 'xp-log-id' })) },
      streak: {
        findUnique: vi.fn(async () => ({ ...streak })),
        create: vi.fn(),
        update: streakUpdate,
      },
    };
    engine = new GamificationEngineService({} as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds the event XP and coins to the student balance', async () => {
    const result = await engine.applyEventWithinTransaction(transaction as never, {
      userId: 'student-id',
      eventType: XpSource.DAILY_VOICE_QUEST,
      metadata: { customXp: 35 },
      coinsAwarded: 12,
    });

    expect(result).toMatchObject({ xpEarned: 35, newTotalXp: 35, coinsEarned: 12, newTotalCoins: 12, currentStreak: 3 });
    expect(user).toMatchObject({ currentXp: 35, coins: 12 });
    expect(transaction.xpLog.create).toHaveBeenCalledTimes(1);
  });

  it('does not increase the streak twice on the same UTC day', async () => {
    const result = await engine.updatePracticeStreakWithinTransaction(transaction as never, 'student-id');

    expect(result).toEqual({ streakUpdated: false, currentStreak: 3 });
    expect(streakUpdate).not.toHaveBeenCalled();
  });

  it('increments the streak on a replay the next UTC day', async () => {
    streak.lastActivityDate = new Date('2026-10-31T23:59:00.000Z');
    const result = await engine.updatePracticeStreakWithinTransaction(transaction as never, 'student-id');

    expect(result).toEqual({ streakUpdated: true, currentStreak: 4 });
    expect(streakUpdate).toHaveBeenCalledWith({
      where: { userId: 'student-id' },
      data: { currentStreak: 4, maxStreak: 5, lastActivityDate: fixedNow },
    });
  });
});
