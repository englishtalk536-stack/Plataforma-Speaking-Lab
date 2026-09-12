'use client';

import { SidebarNav } from '@/components/SidebarNav';
import { StudentHeader } from '@/components/StudentHeader';
import { SkillPath } from '@/components/SkillPath';
import { FeedbackRadar } from '@/components/FeedbackRadar';
import { DailyQuestCard } from '@/components/DailyQuestCard';

// Mock data standing in for a server-side fetch (e.g. a Prisma query in a
// Server Component, or a call to the backend API). Swap this out for real
// data without changing any component below.
const MOCK_STUDENT = {
  fullName: 'Camila Torres',
  avatarUrl: null,
  level: 4,
  currentXp: 720,
  xpForCurrentLevel: 800, // floor(100 * 4^1.5)
  xpForNextLevel: 1118, // floor(100 * 5^1.5)
  currentStreak: 7,
  coins: 320,
};

const MOCK_RADAR = {
  fluency: 68,
  grammar: 82,
  pronunciation: 55,
  vocabulary: 74,
};

const MOCK_SKILL_NODES = [
  { id: '1', title: 'Basic Greetings', xpReward: 50, status: 'COMPLETED' as const },
  { id: '2', title: 'Ordering Food', xpReward: 75, status: 'UNLOCKED' as const },
  { id: '3', title: 'Job Interview Prep', xpReward: 150, status: 'LOCKED' as const },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-speaking-white pl-16 md:pl-64">
      <aside className="fixed left-4 top-4 z-10 md:left-6">
        <SidebarNav />
      </aside>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6">
        <div className="lg:col-span-3">
          <StudentHeader
            fullName={MOCK_STUDENT.fullName}
            avatarUrl={MOCK_STUDENT.avatarUrl}
            level={MOCK_STUDENT.level}
            currentXp={MOCK_STUDENT.currentXp}
            xpForCurrentLevel={MOCK_STUDENT.xpForCurrentLevel}
            xpForNextLevel={MOCK_STUDENT.xpForNextLevel}
            currentStreak={MOCK_STUDENT.currentStreak}
            coins={MOCK_STUDENT.coins}
          />
        </div>

        <section
          className="rounded-2xl border border-speaking-border bg-speaking-card p-5 shadow-sm lg:col-span-2"
          aria-labelledby="skill-path-heading"
        >
          <h2 id="skill-path-heading" className="font-title text-xl text-speaking-cobalt">
            Skill Path
          </h2>
          <SkillPath
            className="mt-4"
            nodes={MOCK_SKILL_NODES}
            onSelectNode={(node) => console.log('Selected node', node.id)}
          />
        </section>

        <div className="space-y-6 lg:col-span-1">
          <section
            className="rounded-2xl border border-speaking-border bg-speaking-card p-5 shadow-sm"
            aria-labelledby="feedback-radar-heading"
          >
            <h2 id="feedback-radar-heading" className="font-title text-xl text-speaking-cobalt">
              Feedback Radar
            </h2>
            <FeedbackRadar className="mt-4 flex justify-center" {...MOCK_RADAR} />
          </section>

          <DailyQuestCard
            className="border-speaking-border bg-speaking-card shadow-sm"
            questTitle="Order coffee like a local"
            questDescription="A 3-minute voice roleplay at a café counter."
            xpReward={30}
            onStart={() => console.log('Starting daily quest')}
          />
        </div>
      </main>
    </div>
  );
}
