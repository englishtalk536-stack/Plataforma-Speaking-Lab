'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Ear, Eye, Repeat, Sparkles, Turtle, Volume2, VolumeX } from 'lucide-react';

export interface VoiceAssistantCardProps {
  challengeText: string;
  grammarFocus: string[];
  /** true while the AI's voice is actually speaking (from useSpeechSynthesis) — drives the waveform. */
  isSpeaking: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  /** Replays the current challenge at normal speed. Disabled while already speaking or muted. */
  onReplay: () => void;
  /** Replays the current challenge at ~0.75x speed. Disabled while already speaking or muted. */
  onReplaySlower: () => void;
  /**
   * "Listening First" mode: the question text stays hidden until this is
   * true — the student is meant to rely on the audio, not read along. Set
   * by the parent after 3 failed attempts, or by the student tapping
   * "Reveal text" below.
   */
  isTextRevealed: boolean;
  onRevealText: () => void;
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
 * Presents the AI's current challenge as audio-first: the question text is
 * hidden by default ("Listening First" mode) so the student practices
 * listening comprehension instead of reading along, with normal-speed and
 * slowed-down replay controls to compensate. Grammar hints stay available
 * underneath, entirely decoupled from the hidden question and from any
 * scoring — they're a quick conceptual reference, not part of the
 * evaluation the results screen shows.
 */
export function VoiceAssistantCard({
  challengeText,
  grammarFocus,
  isSpeaking,
  isMuted,
  onToggleMute,
  onReplay,
  onReplaySlower,
  isTextRevealed,
  onRevealText,
  className = '',
}: VoiceAssistantCardProps) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const replayDisabled = isSpeaking || isMuted;

  return (
    <div className={`rounded-2xl border border-speaking-cobalt/10 bg-speaking-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-speaking-king">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="font-body text-xs font-semibold">Your AI conversation partner</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReplay}
            disabled={replayDisabled}
            aria-label="Listen again"
            title={isMuted ? 'Unmute to listen again' : 'Listen again'}
            className="rounded-full p-1.5 text-speaking-cobalt/50 transition-colors hover:bg-speaking-cobalt/5 hover:text-speaking-cobalt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Repeat className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onReplaySlower}
            disabled={replayDisabled}
            aria-label="Listen again, slower"
            title={isMuted ? 'Unmute to listen again' : 'Listen again, slower'}
            className="rounded-full p-1.5 text-speaking-cobalt/50 transition-colors hover:bg-speaking-cobalt/5 hover:text-speaking-cobalt disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Turtle className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={isMuted}
            aria-label={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
            className="rounded-full p-1.5 text-speaking-cobalt/50 transition-colors hover:bg-speaking-cobalt/5 hover:text-speaking-cobalt"
          >
            {isMuted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <Waveform active={isSpeaking} />

      {isTextRevealed ? (
        <p className="text-center font-title text-lg leading-snug text-speaking-cobalt">{challengeText}</p>
      ) : (
        <div className="flex flex-col items-center gap-2 py-1">
          <Ear className="h-6 w-6 text-speaking-cobalt/30" aria-hidden="true" />
          <p className="font-body text-sm text-speaking-cobalt/50">Listen carefully — no text this time.</p>
          <button
            type="button"
            onClick={onRevealText}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-body text-xs font-semibold text-speaking-cobalt/50 hover:bg-speaking-cobalt/5 hover:text-speaking-king"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reveal text</span>
          </button>
        </div>
      )}

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
