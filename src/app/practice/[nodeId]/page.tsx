import { PracticeSession } from '../../../components/practice/PracticeSession';
import { buildPracticeContext } from '../../../lib/ai/practice-context';

export default function PracticePage({ params }: { params: { nodeId: string } }) {
  const context = buildPracticeContext(params.nodeId);

  return (
    <div className="min-h-screen bg-speaking-white">
      <PracticeSession context={context} />
    </div>
  );
}
