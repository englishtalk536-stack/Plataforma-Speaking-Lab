import { NextRequest, NextResponse } from 'next/server';
import { XpSource } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUserId } from '../../../../../lib/auth';
import { GamificationEngineService } from '../../../../../server/gamification-engine.service';
import {
  DashboardApiError,
  InvalidRequestError,
  QuestNotAvailableError,
  UnauthenticatedError,
} from '../../../../../server/errors';
import type { CompleteQuestRequest, CompleteQuestResponse } from '../../../../../lib/types/dashboard';

const gamificationEngine = new GamificationEngineService(prisma);

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      throw new UnauthenticatedError();
    }

    const body = await parseBody(request);
    const { questId } = body;

    const result = await prisma.$transaction(async (tx) => {
      // `questId` here is the UserDailyQuest id (see DailyQuestDto.id) — it
      // uniquely identifies *this student's assignment* for today, which is
      // what must flip to COMPLETED and what must not be double-redeemed.
      const assignment = await tx.userDailyQuest.findUnique({
        where: { id: questId },
        include: { quest: true },
      });

      if (!assignment || assignment.userId !== userId || assignment.status !== 'PENDING') {
        throw new QuestNotAvailableError(questId);
      }

      const gamification = await gamificationEngine.applyEventWithinTransaction(tx, {
        userId,
        eventType: XpSource.DAILY_VOICE_QUEST,
        metadata: {
          questId: assignment.questId,
          userDailyQuestId: assignment.id,
          customXp: assignment.quest.xpReward,
        },
        coinsAwarded: assignment.quest.coinReward,
      });

      await tx.userDailyQuest.update({
        where: { id: assignment.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      return gamification;
    });

    const response: CompleteQuestResponse = {
      success: true,
      xpEarned: result.xpEarned,
      newTotalXp: result.newTotalXp,
      currentLevel: result.currentLevel,
      didLevelUp: result.didLevelUp,
      currentStreak: result.currentStreak,
      coinsEarned: result.coinsEarned,
      newTotalCoins: result.newTotalCoins,
    };

    return NextResponse.json(response);
  } catch (err) {
    return handleApiError(err);
  }
}

async function parseBody(request: NextRequest): Promise<CompleteQuestRequest> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new InvalidRequestError('Request body must be valid JSON.');
  }

  if (
    !raw ||
    typeof raw !== 'object' ||
    typeof (raw as Record<string, unknown>).questId !== 'string' ||
    (raw as Record<string, unknown>).questId === ''
  ) {
    throw new InvalidRequestError('Request body must include a non-empty string "questId".');
  }

  return raw as CompleteQuestRequest;
}

function handleApiError(err: unknown): NextResponse {
  if (err instanceof DashboardApiError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  console.error('POST /api/student/quest/complete failed:', err);
  return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
}
