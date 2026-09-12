import { PracticeSession } from '../../../components/practice/PracticeSession';
import { buildPracticeContext } from '../../../lib/ai/practice-context';

export default async function PracticePage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const context = buildPracticeContext(nodeId);

  return (
    <div className="min-h-screen bg-speaking-white">
      <PracticeSession context={context} />
    </div>
  );
}
