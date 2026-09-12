import { NextRequest, NextResponse } from 'next/server';
import { XpSource } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUserId } from '../../../../../lib/auth';
import { GamificationEngineService } from '../../../../../server/gamification-engine.service';
import { blendRadarScore } from '../../../../../lib/gamification/radar-blend';
import {
  DashboardApiError,
  InvalidRequestError,
  LessonNotAvailableError,
  UnauthenticatedError,
} from '../../../../../server/errors';
import type { CompleteLessonRequest, CompleteLessonResponse, LessonSessionMetrics } from '../../../../../lib/types/practice';

const gamificationEngine = new GamificationEngineService(prisma);

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      throw new UnauthenticatedError();
    }

    const { nodeId, sessionMetrics } = await parseBody(request);

    const result = await prisma.$transaction(async (tx) => {
      const progress = await tx.userSkillProgress.findFirst({
        where: { userId, nodeId },
        include: { node: true },
      });

      if (!progress || progress.status === 'COMPLETED') {
        throw new LessonNotAvailableError(nodeId);
      }

      const userBefore = await tx.user.findUnique({ where: { id: userId } });
      if (!userBefore) {
        throw new LessonNotAvailableError(nodeId);
      }

      const gamification = await gamificationEngine.applyEventWithinTransaction(tx, {
        userId,
        eventType: XpSource.MODULE_EVALUATION,
        metadata: { nodeId, customXp: progress.node.xpReward },
        coinsAwarded: progress.node.coinReward,
      });

      await tx.userSkillProgress.update({
        where: { id: progress.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          radarFluency: blendRadarScore(userBefore.radarFluency, sessionMetrics.fluency),
          radarGrammar: blendRadarScore(userBefore.radarGrammar, sessionMetrics.grammar),
          radarPronunciation: blendRadarScore(userBefore.radarPronunciation, sessionMetrics.pronunciation),
          radarVocabulary: blendRadarScore(userBefore.radarVocabulary, sessionMetrics.vocabulary),
        },
      });

      // Unlock any direct child nodes the student now qualifies for (by
      // level), so the Skill Path reflects progress immediately instead of
      // requiring a separate "unlock" step or page reload logic.
      const childSkillNodes = await tx.skillNode.findMany({ where: { parentNodeId: nodeId } });
      for (const child of childSkillNodes) {
        const childProgress = await tx.userSkillProgress.findFirst({ where: { userId, nodeId: child.id } });
        const qualifies = updatedUser.level >= child.levelRequired;

        if (!childProgress) {
          await tx.userSkillProgress.create({
            data: { userId, nodeId: child.id, status: qualifies ? 'UNLOCKED' : 'LOCKED' },
          });
        } else if (qualifies && childProgress.status === 'LOCKED') {
          await tx.userSkillProgress.update({ where: { id: childProgress.id }, data: { status: 'UNLOCKED' } });
        }
      }

      return { gamification, updatedUser };
    });

    const response: CompleteLessonResponse = {
      success: true,
      xpEarned: result.gamification.xpEarned,
      newTotalXp: result.gamification.newTotalXp,
      currentLevel: result.gamification.currentLevel,
      didLevelUp: result.gamification.didLevelUp,
      currentStreak: result.gamification.currentStreak,
      coinsEarned: result.gamification.coinsEarned,
      newTotalCoins: result.gamification.newTotalCoins,
      updatedRadar: {
        fluency: result.updatedUser.radarFluency,
        grammar: result.updatedUser.radarGrammar,
        pronunciation: result.updatedUser.radarPronunciation,
        vocabulary: result.updatedUser.radarVocabulary,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    return handleApiError(err);
  }
}

async function parseBody(request: NextRequest): Promise<CompleteLessonRequest> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new InvalidRequestError('Request body must be valid JSON.');
  }

  if (!raw || typeof raw !== 'object') {
    throw new InvalidRequestError('Request body must be a JSON object.');
  }

  const body = raw as Record<string, unknown>;
  if (typeof body.nodeId !== 'string' || body.nodeId === '') {
    throw new InvalidRequestError('Request body must include a non-empty string "nodeId".');
  }

  const metrics = body.sessionMetrics as Partial<LessonSessionMetrics> | undefined;
  if (
    !metrics ||
    typeof metrics.grammar !== 'number' ||
    typeof metrics.pronunciation !== 'number' ||
    typeof metrics.fluency !== 'number' ||
    typeof metrics.vocabulary !== 'number'
  ) {
    throw new InvalidRequestError(
      'Request body must include "sessionMetrics" with numeric grammar, pronunciation, fluency, and vocabulary.',
    );
  }

  return { nodeId: body.nodeId, sessionMetrics: metrics as LessonSessionMetrics };
}

function handleApiError(err: unknown): NextResponse {
  if (err instanceof DashboardApiError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  console.error('POST /api/student/lesson/complete failed:', err);
  return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
}
