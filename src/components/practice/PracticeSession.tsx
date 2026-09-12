'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PracticeHeader } from './PracticeHeader';
import { VoiceAssistantCard } from './VoiceAssistantCard';
import { AudioRecorderControls, type RecorderStatus } from './AudioRecorderControls';
import { PronunciationFeedback } from './PronunciationFeedback';
import { generateMockFeedback, generateNextChallenge, type MockFeedback, type PracticeContext } from '../../lib/ai/practice-context';

export interface PracticeSessionProps {
  context: PracticeContext;
}

const AI_SPEAKING_DURATION_MS = 1400;
const PROCESSING_DURATION_MS = 1200;

/**
 * Owns the turn-by-turn flow of a practice session:
 *   ai-speaking (challenge "read aloud") -> idle (waiting to record) ->
 *   recording -> processing -> feedback -> next challenge -> ai-speaking...
 *
 * All timings are simulated (see practice-context.ts) so this runs fully
 * client-side without a real ASR/TTS pipeline wired up yet.
 */
export function PracticeSession({ context }: PracticeSessionProps) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [challengeText, setChallengeText] = useState(context.initialChallenge);
  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>('listening');
  const [feedback, setFeedback] = useState<MockFeedback | null>(null);

  // On mount, "play" the initial challenge, then settle to idle.
  useEffect(() => {
    const timer = setTimeout(() => setRecorderStatus('idle'), AI_SPEAKING_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  function handleToggleRecord() {
    if (recorderStatus === 'idle') {
      setFeedback(null);
      setRecorderStatus('recording');
      return;
    }

    if (recorderStatus === 'recording') {
      setRecorderStatus('processing');
      setTimeout(() => {
        setFeedback(generateMockFeedback(context.cefrLevel));
      }, PROCESSING_DURATION_MS);
    }
  }

  function handleContinue() {
    const nextTurn = turnIndex + 1;
    setTurnIndex(nextTurn);
    setFeedback(null);
    setChallengeText(generateNextChallenge(context.cefrLevel, nextTurn));
    setRecorderStatus('listening');
    setTimeout(() => setRecorderStatus('idle'), AI_SPEAKING_DURATION_MS);
  }

  const isSessionComplete = turnIndex >= context.totalTurns;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <PracticeHeader
        cefrLevel={context.cefrLevel}
        cefrName={context.cefrName}
        exerciseTitle={context.exerciseTitle}
        currentTurn={turnIndex}
        totalTurns={context.totalTurns}
        teacherNote={context.teacherNote}
      />

      {isSessionComplete ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-speaking-success/30 bg-speaking-success/10 p-8 text-center"
        >
          <p className="font-title text-xl text-speaking-cobalt">Session complete!</p>
          <p className="mt-1 font-body text-sm text-speaking-cobalt/70">
            Great work at the {context.cefrLevel} level. Head back to your Skill Path to continue.
          </p>
        </motion.div>
      ) : (
        <>
          <VoiceAssistantCard
            challengeText={challengeText}
            grammarFocus={context.grammarFocus}
            isSpeaking={recorderStatus === 'listening'}
          />

          <AudioRecorderControls status={recorderStatus} onToggleRecord={handleToggleRecord} className="py-2" />

          <AnimatePresence mode="wait">
            {feedback && (
              <PronunciationFeedback key={turnIndex} feedback={feedback} onContinue={handleContinue} />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
