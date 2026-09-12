'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';

export interface VoiceAssistantCardProps {
  challengeText: string;
  grammarFocus: string[];
  /** true while the AI's voice is "speaking" the challenge — drives the waveform. */
  isSpeaking: boolean;
  className?: string;
}

const BAR_COUNT = 9;

/**
 * A row of bars that idles low and flat, then animates into a staggered
 * bounce while `active` — standing in for a real audio-level visualizer
 * without needing actual playback analysis for this mock.
 */
function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-center justify-center gap-1" role="img" aria-label={active ? 'AI speaking' : 'AI idle'}>
      {Array.from({ length: BAR_COUNT }, (_, index) => {
        const isCobalt = index % 2 === 0;
        return (
          <motion.span
            key={index}
            className={`w-1.5 rounded-full ${isCobalt ? 'bg-speaking-cobalt' : 'bg-speaking-king'}`}
            style={{ height: 8 }}
            animate={
              active
                ? { height: [8, 28, 12, 34, 8], opacity: 1 }
                : { height: 8, opacity: 0.35 }
            }
            transition={
              active
                ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: index * 0.07 }
                : { duration: 0.3 }
            }
          />
        );
      })}
    </div>
  );
}

/**
 * Presents the AI's current challenge (in-character question driven by the
 * active CEFR band) alongside a waveform for its "voice", plus grammar
 * hints the student can expand without them cluttering the question itself.
 */
export function VoiceAssistantCard({ challengeText, grammarFocus, isSpeaking, className = '' }: VoiceAssistantCardProps) {
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <div className={`rounded-2xl border border-speaking-cobalt/10 bg-speaking-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 text-speaking-king">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span className="font-body text-xs font-semibold">Your AI conversation partner</span>
      </div>

      <Waveform active={isSpeaking} />

      <p className="text-center font-title text-lg leading-snug text-speaking-cobalt">{challengeText}</p>

      <div className="mt-5 border-t border-speaking-cobalt/10 pt-4">
        <button
          type="button"
          onClick={() => setTipsOpen((open) => !open)}
          aria-expanded={tipsOpen}
          className="flex w-full items-center justify-between font-body text-sm font-semibold text-speaking-king"
        >
          <span>Grammar hints for this level</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${tipsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {tipsOpen && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-1.5"
          >
            {grammarFocus.map((tip) => (
              <li key={tip} className="flex gap-2 font-body text-sm text-speaking-cobalt/70">
                <span className="text-speaking-mustard">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
