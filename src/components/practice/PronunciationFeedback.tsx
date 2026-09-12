'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import type { MockFeedback } from '../../lib/ai/practice-context';
import { deltaToRadarScale } from '../../lib/ai/evaluate-transcript';

export interface PronunciationFeedbackProps {
  feedback: MockFeedback;
  /** Object URL for this turn's recorded audio, from useSpeechRecognition. Null hides the playback button (unsupported browser, or a typed answer). */
  audioUrl: string | null;
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

/** Compact play/pause button driving a hidden <audio> element, for the student to hear back what they just said. */
function PlaybackButton({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2 rounded-full border border-speaking-king/30 bg-speaking-king/5 px-3 py-1.5 font-body text-xs font-semibold text-speaking-king transition-colors hover:bg-speaking-king/10"
    >
      {isPlaying ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{isPlaying ? 'Playing your answer…' : 'Listen to your answer'}</span>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </button>
  );
}

/**
 * Shows the evaluation for the turn just recorded: a word-by-word
 * breakdown (green for correct, mustard/orange for pronunciation to fix),
 * and this module's three oral-skill scores — Pronunciation, Fluency, and
 * Vocabulary. Grammar is intentionally not shown here: this playground is
 * scoped to oral skills, so grammar mistake-detection still runs (it feeds
 * the tip text) but isn't surfaced as its own metric.
 */
export function PronunciationFeedback({ feedback, audioUrl, onContinue, className = '' }: PronunciationFeedbackProps) {
  const fluencyScore = Math.round(deltaToRadarScale(feedback.fluencyDelta));
  const vocabularyScore = Math.round(deltaToRadarScale(feedback.vocabularyDelta));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl border border-speaking-cobalt/10 bg-speaking-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-title text-lg text-speaking-cobalt">Here&apos;s how that sounded</p>
        {audioUrl && <PlaybackButton audioUrl={audioUrl} />}
      </div>

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

      <div className="mt-5 grid grid-cols-3 gap-4">
        <ScoreGauge label="Pronunciation" score={feedback.pronunciationScore} />
        <ScoreGauge label="Fluency" score={fluencyScore} />
        <ScoreGauge label="Vocabulary" score={vocabularyScore} />
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
