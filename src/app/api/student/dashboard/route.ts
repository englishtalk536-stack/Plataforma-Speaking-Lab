import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUserId } from '../../../../lib/auth';
import { getXpRequiredForLevel } from '../../../../lib/gamification/xp-formula';
import { DashboardApiError, StudentNotFoundError, UnauthenticatedError, todayUtcMidnight } from '../../../../server/errors';
import type {
  ClassroomSummaryDto,
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

    const [user, streak, skillProgress, dailyQuests, classroomMemberships, notifications, classFollowUps, completedLessonProgress] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.userSkillProgress.findMany({
        where: { userId, status: 'UNLOCKED' },
        include: { node: true },
        orderBy: { node: { levelRequired: 'asc' } },
      }),
      prisma.userDailyQuest.findMany({
        where: { userId, assignedDate: todayUtcMidnight() },
        include: { quest: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.classroomMembership.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          classroom: { status: 'ACTIVE' },
        },
        include: {
          classroom: {
            include: {
              teacher: {
                select: { id: true, fullName: true },
              },
              virtualClasses: {
                where: { status: 'SCHEDULED' },
                select: { id: true, title: true, joinUrl: true, scheduledAt: true },
                orderBy: { scheduledAt: 'asc' },
              },
              writtenActivities: {
                select: {
                  id: true,
                  title: true,
                  prompt: true,
                  createdAt: true,
                  submissions: {
                    where: { studentId: userId },
                    select: { responseText: true },
                    take: 1,
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      }),
      prisma.notification.findMany({
        where: { userId, readAt: null },
        select: { id: true, title: true, message: true, href: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.classLesson.findMany({
        where: {
          recipients: { some: { studentId: userId } },
          classroom: {
            is: {
              status: 'ACTIVE',
              memberships: { some: { userId, status: 'ACTIVE' } },
            },
          },
        },
        select: {
          id: true,
          title: true,
          taughtAt: true,
          notes: true,
          improvementOpportunities: true,
          homework: true,
          practiceNode: {
            select: {
              id: true,
              title: true,
              userProgress: { where: { userId, status: 'COMPLETED' }, select: { id: true }, take: 1 },
              lessonProgress: { where: { userId, completedAt: { not: null } }, select: { id: true }, take: 1 },
            },
          },
          classroom: { select: { id: true, name: true } },
        },
        orderBy: { taughtAt: 'desc' },
      }),
      prisma.userLessonProgress.findMany({
        where: { userId, completedAt: { not: null } },
        select: { nodeId: true },
      }),
    ]);

    if (!user) {
      throw new StudentNotFoundError(userId);
    }
    if (user.role !== 'STUDENT' || user.accessStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Student access is paused or unavailable.' }, { status: 403 });
    }

    const completedVirtualClasses = classFollowUps.length
      ? await prisma.virtualClass.findMany({
          where: {
            status: 'COMPLETED',
            classroomId: { in: [...new Set(classFollowUps.map((followUp) => followUp.classroom.id))] },
            scheduledAt: { in: classFollowUps.map((followUp) => followUp.taughtAt) },
          },
          select: { classroomId: true, scheduledAt: true },
        })
      : [];
    const completedClassKeys = new Set(
      completedVirtualClasses.map(({ classroomId, scheduledAt }) => `${classroomId}:${scheduledAt.getTime()}`),
    );

    const completedLessonNodeIds = new Set(completedLessonProgress.map(({ nodeId }) => nodeId));
    const skillPath: SkillPathNodeDto[] = skillProgress
      .filter((progress) => !completedLessonNodeIds.has(progress.node.id))
      .map((progress) => ({
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
      activityType: assignment.quest.activityType,
      resourceUrl: assignment.quest.resourceUrl,
      status: assignment.status,
    }));

    const classrooms: ClassroomSummaryDto[] = classroomMemberships.map((membership) => ({
      id: membership.classroom.id,
      name: membership.classroom.name,
      description: membership.classroom.description,
      level: membership.classroom.level,
      englishLevel: membership.englishLevel,
      status: membership.classroom.status,
      teacher: {
        id: membership.classroom.teacher.id,
        name: membership.classroom.teacher.fullName,
      },
      membershipStatus: membership.status,
      joinedAt: membership.joinedAt.toISOString(),
    }));

    const upcomingVirtualClasses = classroomMemberships
      .flatMap(({ classroom }) =>
        classroom.virtualClasses.map((virtualClass) => ({
          ...virtualClass,
          scheduledAt: virtualClass.scheduledAt.toISOString(),
          classroomId: classroom.id,
          classroomName: classroom.name,
        })),
      )
      .sort((first, second) => first.scheduledAt.localeCompare(second.scheduledAt));

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
      dailyQuests: quests.filter((quest) => quest.status === 'PENDING'),
      classrooms,
      upcomingVirtualClasses,
      notifications: notifications.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })),
      classFollowUps: classFollowUps
        .filter((followUp) => !completedClassKeys.has(`${followUp.classroom.id}:${followUp.taughtAt.getTime()}`))
        .map((followUp) => ({
          id: followUp.id,
          title: followUp.title,
          taughtAt: followUp.taughtAt.toISOString(),
          notes: followUp.notes,
          improvementOpportunities: followUp.improvementOpportunities,
          homework: followUp.homework,
          practiceNodeId: followUp.practiceNode?.id ?? null,
          practiceTitle: followUp.practiceNode?.title ?? null,
          practiceCompleted: Boolean(followUp.practiceNode?.userProgress.length || followUp.practiceNode?.lessonProgress.length),
          classroomId: followUp.classroom.id,
          classroomName: followUp.classroom.name,
        })),
      homeworkTasks: classFollowUps
        .filter((followUp) => completedClassKeys.has(`${followUp.classroom.id}:${followUp.taughtAt.getTime()}`) && Boolean(followUp.homework?.trim()))
        .map((followUp) => ({
          id: followUp.id,
          title: followUp.title,
          homework: followUp.homework as string,
          classroomId: followUp.classroom.id,
          classroomName: followUp.classroom.name,
        })),
      activities: classroomMemberships.flatMap(({ classroom }) =>
        classroom.writtenActivities
          .filter((activity) => activity.submissions.length === 0)
          .map((activity) => ({
            id: activity.id,
            title: activity.title,
            prompt: activity.prompt,
            createdAt: activity.createdAt.toISOString(),
            classroomId: classroom.id,
            classroomName: classroom.name,
          })),
      ),
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
