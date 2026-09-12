import { Sparkles } from 'lucide-react';

export interface DailyQuestCardProps {
  questTitle: string;
  questDescription: string;
  xpReward: number;
  onStart: () => void;
  className?: string;
}

/** CTA panel prompting the student toward today's voice quest. */
export function DailyQuestCard({ questTitle, questDescription, xpReward, onStart, className = '' }: DailyQuestCardProps) {
  return (
    <div className={`rounded-2xl border border-speaking-mustard/50 bg-speaking-mustard/10 p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-speaking-mustard" aria-hidden="true" />
        <div>
          <p className="font-title text-base text-speaking-cobalt">{questTitle}</p>
          <p className="mt-1 font-body text-sm text-speaking-cobalt/70">{questDescription}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-speaking-king py-2.5 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt"
      >
        <span>Start quest</span>
        <span className="rounded-full bg-speaking-white/15 px-2 py-0.5 text-xs">+{xpReward} XP</span>
      </button>
    </div>
  );
}
