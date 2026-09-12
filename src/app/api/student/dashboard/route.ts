import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUserId } from '../../../../lib/auth';
import { getXpRequiredForLevel } from '../../../../lib/gamification/xp-formula';
import { DashboardApiError, StudentNotFoundError, UnauthenticatedError, todayUtcMidnight } from '../../../../server/errors';
import type {
  DailyQuestDto,
  FeedbackRadarDto,
  SkillPathNodeDto,
  StudentDashboardResponse,
  WireNodeStatus,
} from '../../../../lib/types/dashboard';

export const dynamic = 'force-dynamic'; // always read fresh gamification state, never cache

/** DB's UNLOCKED reads as "CURRENT" on the wire — the node the student is actively working on. */
function toWireNodeStatus(status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED'): WireNodeStatus {
  return status === 'UNLOCKED' ? 'CURRENT' : status;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      throw new UnauthenticatedError();
    }

    const [user, streak, skillProgress, dailyQuests] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.userSkillProgress.findMany({
        where: { userId },
        include: { node: true },
        orderBy: { node: { levelRequired: 'asc' } },
      }),
      prisma.userDailyQuest.findMany({
        where: { userId, assignedDate: todayUtcMidnight() },
        include: { quest: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!user) {
      throw new StudentNotFoundError(userId);
    }

    const skillPath: SkillPathNodeDto[] = skillProgress.map((progress) => ({
      id: progress.node.id,
      title: progress.node.title,
      status: toWireNodeStatus(progress.status),
      xpReward: progress.node.xpReward,
      position: { x: progress.node.positionX, y: progress.node.positionY },
    }));

    const feedbackRadar: FeedbackRadarDto = {
      fluency: user.radarFluency,
      grammar: user.radarGrammar,
      pronunciation: user.radarPronunciation,
      vocabulary: user.radarVocabulary,
    };

    const quests: DailyQuestDto[] = dailyQuests.map((assignment) => ({
      id: assignment.id,
      title: assignment.quest.title,
      description: assignment.quest.description,
      xpReward: assignment.quest.xpReward,
      coinReward: assignment.quest.coinReward,
      status: assignment.status,
    }));

    const response: StudentDashboardResponse = {
      profile: {
        name: user.fullName,
        avatarUrl: user.avatarUrl,
        currentLevel: user.level,
        currentXP: user.currentXp,
        nextLevelXP: getXpRequiredForLevel(user.level + 1),
        streakDays: streak?.currentStreak ?? 0,
        speakingCoins: user.coins,
      },
      skillPath,
      feedbackRadar,
      dailyQuests: quests,
    };

    return NextResponse.json(response);
  } catch (err) {
    return handleApiError(err);
  }
}

function handleApiError(err: unknown): NextResponse {
  if (err instanceof DashboardApiError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  console.error('GET /api/student/dashboard failed:', err);
  return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
}
