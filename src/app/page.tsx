'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '../components/dashboard/SidebarNav';
import { StudentHeader } from '../components/dashboard/StudentHeader';
import { SkillPath } from '../components/dashboard/SkillPath';
import { FeedbackRadar } from '../components/dashboard/FeedbackRadar';
import { DailyQuestCard } from '../components/dashboard/DailyQuestCard';
import { LessonModal } from '../components/dashboard/LessonModal';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { DashboardError } from '../components/dashboard/DashboardError';
import { completeQuest, useDashboardData } from '../lib/hooks/useDashboardData';
import { getXpRequiredForLevel } from '../lib/gamification/xp-formula';
import type { SkillPathNodeDto, StudentDashboardResponse } from '../lib/types/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { dashboard, error, isLoading, mutate } = useDashboardData();

  const [selectedNode, setSelectedNode] = useState<SkillPathNodeDto | null>(null);
  const [submittingQuestId, setSubmittingQuestId] = useState<string | null>(null);
  const [rewardTrigger, setRewardTrigger] = useState(0);
  const [questError, setQuestError] = useState<string | null>(null);

  if (isLoading && !dashboard) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboard) {
    return <DashboardError message={error instanceof Error ? error.message : 'Unknown error.'} onRetry={() => mutate()} />;
  }

  if (!dashboard) {
    return <DashboardSkeleton />;
  }

  const { profile, skillPath, feedbackRadar, dailyQuests } = dashboard;
  const xpForCurrentLevel = getXpRequiredForLevel(profile.currentLevel);

  async function handleStartQuest(questId: string) {
    setQuestError(null);
    setSubmittingQuestId(questId);
    try {
      const result = await completeQuest(questId);
      setRewardTrigger((n) => n + 1);

      await mutate(
        (current): StudentDashboardResponse | undefined =>
          current && {
            ...current,
            profile: {
              ...current.profile,
              currentLevel: result.currentLevel,
              currentXP: result.newTotalXp,
              nextLevelXP: getXpRequiredForLevel(result.currentLevel + 1),
              streakDays: result.currentStreak,
              speakingCoins: result.newTotalCoins,
            },
            dailyQuests: current.dailyQuests.map((quest) =>
              quest.id === questId ? { ...quest, status: 'COMPLETED' as const } : quest,
            ),
          },
        { revalidate: false },
      );
    } catch (err) {
      setQuestError(err instanceof Error ? err.message : 'Could not complete the quest. Please try again.');
    } finally {
      setSubmittingQuestId(null);
    }
  }

  function handleStartLesson(node: SkillPathNodeDto) {
    router.push(`/practice/${node.id}`);
  }

  return (
    <div className="flex min-h-screen gap-4 bg-speaking-white p-4 sm:p-6">
      <SidebarNav />

      <main className="flex-1 space-y-6">
        <StudentHeader
          fullName={profile.name}
          avatarUrl={profile.avatarUrl}
          level={profile.currentLevel}
          currentXp={profile.currentXP}
          xpForCurrentLevel={xpForCurrentLevel}
          xpForNextLevel={profile.nextLevelXP}
          currentStreak={profile.streakDays}
          coins={profile.speakingCoins}
          rewardTrigger={rewardTrigger}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section aria-labelledby="skill-path-heading">
            <h2 id="skill-path-heading" className="font-title text-xl text-speaking-cobalt">
              Skill Path
            </h2>
            <SkillPath
              className="mt-4"
              nodes={skillPath}
              selectedNodeId={selectedNode?.id ?? null}
              onSelectNode={setSelectedNode}
            />
          </section>

          <div className="space-y-6">
            <section aria-labelledby="feedback-radar-heading">
              <h2 id="feedback-radar-heading" className="font-title text-xl text-speaking-cobalt">
                Feedback Radar
              </h2>
              <FeedbackRadar className="mt-4 flex justify-center" {...feedbackRadar} />
            </section>

            <div className="space-y-3">
              {dailyQuests.length === 0 && (
                <p className="font-body text-sm text-speaking-cobalt/60">No quests assigned for today yet.</p>
              )}
              {dailyQuests.map((quest) => (
                <DailyQuestCard
                  key={quest.id}
                  questTitle={quest.title}
                  questDescription={quest.description}
                  xpReward={quest.xpReward}
                  coinReward={quest.coinReward}
                  status={quest.status}
                  isSubmitting={submittingQuestId === quest.id}
                  onStart={() => handleStartQuest(quest.id)}
                />
              ))}
              {questError && <p className="font-body text-xs text-speaking-streak">{questError}</p>}
            </div>
          </div>
        </div>
      </main>

      <LessonModal node={selectedNode} onClose={() => setSelectedNode(null)} onStartLesson={handleStartLesson} />
    </div>
  );
}
