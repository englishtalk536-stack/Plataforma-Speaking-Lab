import { notFound } from 'next/navigation';
import { PracticeSession } from '../../../components/practice/PracticeSession';
import { buildPracticeContext, isCEFRLevel } from '../../../lib/ai/practice-context';
import { prisma } from '../../../lib/prisma';
import { requireStudentId } from '../../../lib/student-auth';

export default async function PracticePage({ params }: { params: Promise<{ nodeId: string }> }) {
  const studentId = await requireStudentId();
  const { nodeId } = await params;
  const progress = await prisma.userSkillProgress.findFirst({
    where: {
      userId: studentId,
      nodeId,
      status: { in: ['UNLOCKED', 'COMPLETED'] },
    },
    select: {
      node: {
        select: {
          id: true,
          title: true,
          description: true,
          cefrLevel: true,
          challengeText: true,
          targetVocabulary: true,
          grammarHints: true,
        },
      },
    },
  });

  if (!progress || !isCEFRLevel(progress.node.cefrLevel)) notFound();
  const context = buildPracticeContext({ ...progress.node, cefrLevel: progress.node.cefrLevel });

  return (
    <div className="min-h-screen bg-speaking-white">
      <PracticeSession context={context} />
    </div>
  );
}
