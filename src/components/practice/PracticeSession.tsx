'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, MicOff, PenLine } from 'lucide-react';
import { PracticeHeader } from './PracticeHeader';
import { VoiceAssistantCard } from './VoiceAssistantCard';
import { AudioRecorderControls, type RecorderStatus } from './AudioRecorderControls';
import { PronunciationFeedback } from './PronunciationFeedback';
import { generateAdaptiveChallenge, type MockFeedback, type PracticeContext } from '../../lib/ai/practice-context';
import { evaluateTranscript, deltaToRadarScale } from '../../lib/ai/evaluate-transcript';
import { useSpeechRecognition } from '../../lib/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../lib/hooks/useSpeechSynthesis';
import type { CompleteLessonResponse } from '../../lib/types/practice';

export interface PracticeSessionProps {
  context: PracticeContext;
}

type SessionPhase =
  | 'ai-speaking'
  | 'idle'
  | 'recording'
  | 'processing'
  | 'feedback'
  | 'submitting'
  | 'summary'
  | 'submit-error';

const ASR_FLUSH_DELAY_MS = 900; // time given for the recognizer's final result (and recorded audio) to arrive after stop()

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Owns the real turn-by-turn flow of a practice session:
 *   ai-speaking (challenge actually spoken aloud via SpeechSynthesis) ->
 *   idle (waiting to record) -> recording (real mic + live transcript) ->
 *   processing (ASR settles) -> feedback (real evaluation of what was
 *   actually said) -> next turn, whose question reacts to that transcript.
 * After turn 5, submits the session's average scores to the backend and
 * shows the confirmed XP/coins/level/streak reward.
 */
export function PracticeSession({ context }: PracticeSessionProps) {
  const router = useRouter();
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis({ lang: 'en-US' });

  const [turnIndex, setTurnIndex] = useState(0);
  const [challengeText, setChallengeText] = useState(context.initialChallenge);
  const [phase, setPhase] = useState<SessionPhase>('ai-speaking');
  const [feedback, setFeedback] = useState<MockFeedback | null>(null);
  const [turnAudioUrl, setTurnAudioUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lessonResult, setLessonResult] = useState<CompleteLessonResponse | null>(null);

  // Text-input fallback, offered only after a failed/empty mic attempt.
  const [lastAttemptHadNoSpeech, setLastAttemptHadNoSpeech] = useState(false);
  const [isTextFallbackOpen, setIsTextFallbackOpen] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');

  // Refs mirror the hook's live values so the setTimeout below (scheduled
  // when the user taps "stop") reads the transcript/confidence/audio as
  // they stand once the recognizer actually finalizes — not whatever they
  // were at the instant the button was tapped (a real, not stale, closure).
  const transcriptRef = useRef('');
  const confidenceRef = useRef(0);
  const audioUrlRef = useRef<string | null>(null);
  const recordStartRef = useRef(0);
  const turnMetricsRef = useRef<{ grammar: number; pronunciation: number; fluency: number; vocabulary: number }[]>([]);

  useEffect(() => {
    transcriptRef.current = speech.transcript;
  }, [speech.transcript]);
  useEffect(() => {
    confidenceRef.current = speech.confidence;
  }, [speech.confidence]);
  useEffect(() => {
    audioUrlRef.current = speech.audioUrl;
  }, [speech.audioUrl]);

  // Speak the initial challenge aloud once, on mount, then settle to idle.
  useEffect(() => {
    tts.speak(context.initialChallenge, { onEnd: () => setPhase('idle') });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, []);

  function recordTurnResult(result: MockFeedback, audioUrl: string | null) {
    turnMetricsRef.current.push({
      grammar: result.grammarScore,
      pronunciation: result.pronunciationScore,
      fluency: deltaToRadarScale(result.fluencyDelta),
      vocabulary: deltaToRadarScale(result.vocabularyDelta),
    });
    setFeedback(result);
    setTurnAudioUrl(audioUrl);
    setLastAttemptHadNoSpeech(result.transcript[0]?.text === '(no speech detected)');
    setPhase('feedback');
  }

  function handleToggleRecord() {
    if (phase === 'idle') {
      setFeedback(null);
      setIsTextFallbackOpen(false);
      speech.reset();
      recordStartRef.current = performance.now();
      void speech.start();
      setPhase('recording');
      return;
    }

    if (phase === 'recording') {
      speech.stop();
      const durationSeconds = (performance.now() - recordStartRef.current) / 1000;
      setPhase('processing');

      setTimeout(() => {
        const result = evaluateTranscript({
          transcript: transcriptRef.current,
          cefrLevel: context.cefrLevel,
          confidence: confidenceRef.current,
          durationSeconds,
          teacherNote: context.teacherNote,
        });
        recordTurnResult(result, audioUrlRef.current);
      }, ASR_FLUSH_DELAY_MS);
    }
  }

  function handleSubmitTypedAnswer() {
    const result = evaluateTranscript({
      transcript: typedAnswer,
      cefrLevel: context.cefrLevel,
      confidence: 1,
      durationSeconds: 0,
      teacherNote: context.teacherNote,
      isTyped: true,
    });
    recordTurnResult(result, null); // no recorded audio for a typed answer
    setTypedAnswer('');
    setIsTextFallbackOpen(false);
  }

  function handleContinue() {
    const nextTurn = turnIndex + 1;

    if (nextTurn >= context.totalTurns) {
      void submitSession();
      return;
    }

    // transcriptRef still holds the answer just given (reset only happens
    // when the *next* recording starts), so the next question can react to it.
    const nextQuestion = generateAdaptiveChallenge(
      context.cefrLevel,
      context.levelBand,
      nextTurn,
      transcriptRef.current,
      context.teacherNote,
    );

    setTurnIndex(nextTurn);
    setFeedback(null);
    setTurnAudioUrl(null);
    setLastAttemptHadNoSpeech(false);
    setChallengeText(nextQuestion);
    setPhase('ai-speaking');
    tts.speak(nextQuestion, { onEnd: () => setPhase('idle') });
  }

  async function submitSession() {
    setPhase('submitting');
    setSubmitError(null);

    const metrics = turnMetricsRef.current;
    const sessionMetrics = {
      grammar: average(metrics.map((m) => m.grammar)),
      pronunciation: average(metrics.map((m) => m.pronunciation)),
      fluency: average(metrics.map((m) => m.fluency)),
      vocabulary: average(metrics.map((m) => m.vocabulary)),
    };

    try {
      const response = await fetch('/api/student/lesson/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: context.nodeId, sessionMetrics }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed with status ${response.status}`);
      }

      const result = (await response.json()) as CompleteLessonResponse;
      setLessonResult(result);
      setPhase('summary');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save your progress. Please try again.');
      setPhase('submit-error');
    }
  }

  const recorderStatus: RecorderStatus =
    phase === 'recording'
      ? 'recording'
      : phase === 'processing'
        ? 'processing'
        : phase === 'ai-speaking'
          ? 'listening'
          : 'idle';

  const canOfferTextFallback = phase === 'idle' && !isTextFallbackOpen && (!!speech.error || lastAttemptHadNoSpeech);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <PracticeHeader
        cefrLevel={context.cefrLevel}
        cefrName={context.cefrName}
        exerciseTitle={context.exerciseTitle}
        currentTurn={Math.min(turnIndex, context.totalTurns)}
        totalTurns={context.totalTurns}
        teacherNote={context.teacherNote}
      />

      {!speech.isSupported && !isTextFallbackOpen ? (
        <div className="rounded-2xl border border-speaking-streak/30 bg-speaking-streak/10 p-6 text-center">
          <MicOff className="mx-auto h-8 w-8 text-speaking-streak" aria-hidden="true" />
          <p className="mt-3 font-title text-lg text-speaking-cobalt">Speech recognition isn&apos;t available here</p>
          <p className="mt-1 font-body text-sm text-speaking-cobalt/70">
            This browser doesn&apos;t support the Web Speech API. You can still practice by writing your answers.
          </p>
          <button
            type="button"
            onClick={() => setIsTextFallbackOpen(true)}
            className="mt-4 rounded-full bg-speaking-king px-5 py-2 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt"
          >
            Write my answer instead
          </button>
        </div>
      ) : phase === 'summary' && lessonResult ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-speaking-success/30 bg-speaking-success/10 p-8 text-center"
        >
          <p className="font-title text-xl text-speaking-cobalt">Session complete!</p>
          <p className="mt-1 font-body text-sm text-speaking-cobalt/70">Great work at the {context.cefrLevel} level.</p>

          {lessonResult.alreadyCompleted ? (
            <p className="mt-4 font-body text-sm text-speaking-cobalt/70">
              You&apos;d already completed this lesson, so there&apos;s no additional XP or coins this time — but your
              Feedback Radar was refreshed from this practice round.
            </p>
          ) : (
            <div className="mt-5 flex justify-center gap-3">
              <span className="rounded-full bg-speaking-success/20 px-4 py-1.5 font-title text-sm text-speaking-success">
                +{lessonResult.xpEarned} XP
              </span>
              <span className="rounded-full bg-speaking-mustard/20 px-4 py-1.5 font-title text-sm text-speaking-cobalt">
                +{lessonResult.coinsEarned} coins
              </span>
            </div>
          )}

          {lessonResult.didLevelUp && (
            <p className="mt-3 font-body text-sm font-semibold text-speaking-king">
              Level up! You&apos;re now level {lessonResult.currentLevel}.
            </p>
          )}

          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 rounded-full bg-speaking-king px-6 py-2.5 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt"
          >
            Back to Dashboard
          </button>
        </motion.div>
      ) : phase === 'submit-error' ? (
        <div className="rounded-2xl border border-speaking-streak/30 bg-speaking-streak/10 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-speaking-streak" aria-hidden="true" />
          <p className="mt-3 font-title text-lg text-speaking-cobalt">Couldn&apos;t save your progress</p>
          <p className="mt-1 font-body text-sm text-speaking-cobalt/70">{submitError}</p>
          <button
            type="button"
            onClick={() => void submitSession()}
            className="mt-4 rounded-full bg-speaking-king px-5 py-2 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt"
          >
            Try again
          </button>
        </div>
      ) : phase === 'submitting' ? (
        <div className="rounded-2xl border border-speaking-cobalt/10 bg-speaking-white p-8 text-center shadow-sm">
          <p className="font-body text-sm text-speaking-cobalt/70">Saving your progress…</p>
        </div>
      ) : (
        <>
          {speech.error && (
            <p className="rounded-xl bg-speaking-streak/10 px-4 py-2 font-body text-sm text-speaking-streak">
              {speech.error}
            </p>
          )}

          <VoiceAssistantCard
            challengeText={challengeText}
            grammarFocus={context.grammarFocus}
            isSpeaking={tts.isSpeaking}
            isMuted={tts.isMuted}
            onToggleMute={tts.toggleMute}
            onReplay={() => {
              setPhase('ai-speaking');
              tts.speak(challengeText, { onEnd: () => setPhase('idle') });
            }}
          />

          {isTextFallbackOpen ? (
            <div className="rounded-2xl border border-speaking-cobalt/10 bg-speaking-white p-5 shadow-sm">
              <label htmlFor="typed-answer" className="font-body text-sm font-semibold text-speaking-cobalt">
                Write your answer
              </label>
              <textarea
                id="typed-answer"
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-speaking-cobalt/20 p-3 font-body text-sm text-speaking-cobalt focus:border-speaking-king focus:outline-none"
                placeholder="Type your response here…"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSubmitTypedAnswer}
                  disabled={typedAnswer.trim().length === 0}
                  className="rounded-full bg-speaking-king px-5 py-2 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit answer
                </button>
                {speech.isSupported && (
                  <button
                    type="button"
                    onClick={() => setIsTextFallbackOpen(false)}
                    className="rounded-full px-5 py-2 font-body text-sm font-semibold text-speaking-cobalt/60 hover:text-speaking-cobalt"
                  >
                    Use the mic instead
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <AudioRecorderControls
                status={recorderStatus}
                volumeLevel={speech.volumeLevel}
                onToggleRecord={handleToggleRecord}
                className="py-2"
              />

              {phase === 'recording' && speech.transcript && (
                <p className="text-center font-body text-sm italic text-speaking-cobalt/60">&quot;{speech.transcript}&quot;</p>
              )}

              {canOfferTextFallback && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsTextFallbackOpen(true)}
                    className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-speaking-cobalt/50 hover:text-speaking-king"
                  >
                    <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Having trouble? Write your answer instead</span>
                  </button>
                </div>
              )}
            </>
          )}

          <AnimatePresence mode="wait">
            {phase === 'feedback' && feedback && (
              <PronunciationFeedback
                key={turnIndex}
                feedback={feedback}
                audioUrl={turnAudioUrl}
                onContinue={handleContinue}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
