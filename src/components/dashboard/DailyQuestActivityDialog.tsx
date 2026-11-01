'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ExternalLink, Headphones, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import type { DailyQuestDto } from '../../lib/types/dashboard';
import { useSpeechRecognition } from '../../lib/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../lib/hooks/useSpeechSynthesis';
import { isMissionReadyToComplete } from '../../lib/mission-activity';

export function DailyQuestActivityDialog({
  quest,
  isSubmitting,
  error,
  onClose,
  onComplete,
}: {
  quest: DailyQuestDto | null;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onComplete: (questId: string) => void;
}) {
  const [response, setResponse] = useState('');
  const [resourceOpened, setResourceOpened] = useState(false);
  const speech = useSpeechRecognition({ language: 'en-US' });
  const voice = useSpeechSynthesis({ lang: 'en-US' });

  if (!quest) return null;

  const resourceRequired = ['LISTENING', 'VIDEO', 'GAME', 'PRACTICE'].includes(quest.activityType);
  const answerRequired = ['SPEAKING', 'LISTENING', 'TOPIC', 'VOCABULARY'].includes(quest.activityType);
  const canComplete = isMissionReadyToComplete({ activityType: quest.activityType, resourceOpened, response }) && !isSubmitting;
  const labels: Record<string, string> = {
    SPEAKING: 'Speaking', LISTENING: 'Listening', PRACTICE: 'Práctica', VIDEO: 'Vídeo',
    GAME: 'Juego', TOPIC: 'Tema', VOCABULARY: 'Vocabulario',
  };

  function close() {
    voice.cancel();
    speech.stop();
    onClose();
  }

  async function toggleRecording() {
    if (speech.isListening) {
      speech.stop();
      return;
    }
    await speech.start();
  }

  function useTranscript() {
    if (speech.transcript.trim()) setResponse((current) => [current.trim(), speech.transcript.trim()].filter(Boolean).join(' '));
  }

  const resourceLink = quest.resourceUrl?.startsWith('/') ? (
    <Link href={quest.resourceUrl} target="_blank" onClick={() => setResourceOpened(true)} className="inline-flex min-h-11 items-center justify-center gap-2 border border-speaking-cobalt/15 bg-white px-4 font-body text-sm font-semibold text-speaking-cobalt transition-colors hover:border-speaking-king/35 hover:bg-speaking-white">
      <ExternalLink className="h-4 w-4" aria-hidden="true" />Abrir práctica
    </Link>
  ) : quest.resourceUrl ? (
    <a href={quest.resourceUrl} target="_blank" rel="noopener noreferrer" onClick={() => setResourceOpened(true)} className="inline-flex min-h-11 items-center justify-center gap-2 border border-speaking-cobalt/15 bg-white px-4 font-body text-sm font-semibold text-speaking-cobalt transition-colors hover:border-speaking-king/35 hover:bg-speaking-white">
      <ExternalLink className="h-4 w-4" aria-hidden="true" />Abrir recurso
    </a>
  ) : null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-speaking-cobalt/55 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <motion.section role="dialog" aria-modal="true" aria-labelledby="daily-mission-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-speaking-cobalt/10 bg-white shadow-[0_24px_70px_rgba(16,52,105,0.28)]" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.2 }}>
          <div className="flex items-start justify-between gap-4 border-b border-speaking-cobalt/10 bg-gradient-to-r from-speaking-white to-white p-5 sm:p-6">
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">{labels[quest.activityType] ?? 'Misión diaria'}</p>
              <h2 id="daily-mission-title" className="mt-1 font-title text-2xl text-speaking-cobalt">{quest.title}</h2>
              <p className="mt-2 font-body text-sm leading-6 text-speaking-cobalt/70">{quest.description}</p>
            </div>
            <button type="button" onClick={close} aria-label="Cerrar misión" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-speaking-cobalt/60 transition-colors hover:bg-speaking-cobalt/5 hover:text-speaking-cobalt focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-speaking-success/10 px-3 py-2 font-body text-xs font-bold text-speaking-success">+{quest.xpReward} XP</span>
              <span className="rounded-lg bg-speaking-mustard/20 px-3 py-2 font-body text-xs font-bold text-speaking-cobalt">+{quest.coinReward} monedas</span>
            </div>

            {resourceRequired && (
              <div className="space-y-2 rounded-xl border border-speaking-cobalt/10 bg-speaking-white p-4">
                <div className="flex items-center gap-2 font-body text-sm font-semibold text-speaking-cobalt"><Headphones className="h-4 w-4 text-speaking-king" aria-hidden="true" />{quest.activityType === 'LISTENING' ? 'Escucha asignada' : quest.activityType === 'PRACTICE' ? 'Práctica asignada' : 'Recurso de la misión'}</div>
                {resourceLink ?? <p className="font-body text-sm text-speaking-streak">Esta misión no tiene un recurso asociado. Pide al profesor que la revise.</p>}
                {resourceOpened && <p role="status" className="font-body text-xs font-semibold text-speaking-success">Recurso abierto</p>}
              </div>
            )}

            {answerRequired && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="daily-mission-response" className="font-body text-sm font-semibold text-speaking-cobalt">Tu respuesta</label>
                  <button type="button" disabled={!voice.isSupported} onClick={() => voice.isSpeaking ? voice.cancel() : voice.speak(quest.description)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-speaking-cobalt/15 px-3 font-body text-xs font-semibold text-speaking-cobalt transition-colors hover:bg-speaking-white disabled:cursor-not-allowed disabled:opacity-50">
                    {voice.isSpeaking ? <VolumeX className="h-4 w-4 text-speaking-king" aria-hidden="true" /> : <Volume2 className="h-4 w-4 text-speaking-king" aria-hidden="true" />}
                    {voice.isSpeaking ? 'Detener audio' : 'Escuchar consigna'}
                  </button>
                </div>
                {voice.error && <p role="alert" className="font-body text-sm text-speaking-streak">{voice.error}</p>}
                {voice.warning && <p role="status" className="font-body text-xs text-speaking-cobalt/70">{voice.warning}</p>}
                {voice.isSpeaking && <p role="status" className="font-body text-xs font-semibold text-speaking-success">Reproduciendo la consigna…</p>}
                {!voice.isSupported && <p className="font-body text-xs text-speaking-cobalt/70">La lectura en voz alta no está disponible; puedes leer la consigna en pantalla.</p>}
                <textarea id="daily-mission-response" value={response} onChange={(event) => setResponse(event.target.value)} rows={4} maxLength={3000} placeholder="Escribe tu respuesta o dicta con el micrófono…" className="min-h-28 w-full resize-y border border-speaking-cobalt/15 bg-white px-3.5 py-3 font-body text-sm leading-6 text-speaking-cobalt outline-none transition focus:border-speaking-king focus:ring-2 focus:ring-speaking-king/15" />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void toggleRecording()} disabled={!speech.isSupported} className={`inline-flex min-h-10 items-center justify-center gap-2 border px-3 font-body text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${speech.isListening ? 'border-speaking-streak/30 bg-speaking-streak/5 text-speaking-streak' : 'border-speaking-cobalt/15 bg-white text-speaking-cobalt hover:bg-speaking-white'}`}>
                    {speech.isListening ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}{speech.isListening ? 'Detener dictado' : 'Dictar respuesta'}
                  </button>
                  {speech.transcript && <button type="button" onClick={useTranscript} className="min-h-10 px-3 font-body text-xs font-semibold text-speaking-king underline underline-offset-4">Usar transcripción</button>}
                  {!speech.isSupported && <span className="font-body text-xs text-speaking-cobalt/70">Dictado no disponible en este navegador; puedes escribir.</span>}
                </div>
                {speech.error && <p role="status" className="font-body text-xs text-speaking-cobalt/65">{speech.error}</p>}
                <p className="font-body text-xs text-speaking-cobalt/70">Escribe o dicta al menos tres palabras para enviar la misión.</p>
              </div>
            )}

            {error && <p role="alert" className="border-l-2 border-speaking-streak bg-speaking-streak/5 px-3 py-2 font-body text-sm text-speaking-streak">{error}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-speaking-cobalt/10 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} className="inline-flex min-h-11 items-center justify-center border border-speaking-cobalt/15 px-4 font-body text-sm font-semibold text-speaking-cobalt transition-colors hover:bg-speaking-white">Dejar para después</button>
              <button type="button" disabled={!canComplete} onClick={() => onComplete(quest.id)} className="inline-flex min-h-11 items-center justify-center gap-2 bg-speaking-cobalt px-5 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-king disabled:cursor-not-allowed disabled:opacity-45">
                <Check className="h-4 w-4" aria-hidden="true" />{isSubmitting ? 'Guardando…' : 'Completar misión'}
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
