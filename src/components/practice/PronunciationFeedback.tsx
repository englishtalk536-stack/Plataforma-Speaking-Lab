'use client';

import { motion } from 'framer-motion';
import type { MockFeedback } from '../../lib/ai/practice-context';

export interface PronunciationFeedbackProps {
  feedback: MockFeedback;
  onContinue: () => void;
  className?: string;
}

function ScoreGauge({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-body text-xs text-speaking-cobalt/70">{label}</span>
        <span className="font-title text-sm text-speaking-cobalt">{score}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-speaking-cobalt/10">
        <motion.div
          className="h-full rounded-full bg-speaking-success"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/**
 * Shows the evaluation for the turn just recorded: a word-by-word
 * breakdown (green for correct, mustard/orange for pronunciation to fix),
 * grammar/pronunciation scores for this turn, and the small Feedback Radar
 * gains (fluency, vocabulary) it contributes.
 */
export function PronunciationFeedback({ feedback, onContinue, className = '' }: PronunciationFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl border border-speaking-cobalt/10 bg-speaking-white p-6 shadow-sm ${className}`}
    >
      <p className="font-title text-lg text-speaking-cobalt">Here&apos;s how that sounded</p>

      <p className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1 font-body text-base leading-relaxed">
        {feedback.transcript.map((word, index) => (
          <span
            key={`${word.text}-${index}`}
            className={word.status === 'correct' ? 'text-speaking-success' : 'font-semibold text-speaking-streak'}
          >
            {word.text}
          </span>
        ))}
      </p>

      <p className="mt-3 rounded-xl bg-speaking-streak/10 px-3 py-2 font-body text-sm text-speaking-cobalt/80">
        {feedback.tip}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <ScoreGauge label="Grammar" score={feedback.grammarScore} />
        <ScoreGauge label="Pronunciation" score={feedback.pronunciationScore} />
      </div>

      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-speaking-success/10 px-3 py-1 font-body text-xs font-semibold text-speaking-success">
          Fluency +{feedback.fluencyDelta}
        </span>
        <span className="rounded-full bg-speaking-success/10 px-3 py-1 font-body text-xs font-semibold text-speaking-success">
          Vocabulary +{feedback.vocabularyDelta}
        </span>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-5 w-full rounded-full bg-speaking-king py-2.5 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt"
      >
        Continue
      </button>
    </motion.div>
  );
}
