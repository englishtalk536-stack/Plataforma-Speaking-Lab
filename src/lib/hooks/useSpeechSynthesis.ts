'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSpeechSynthesisOptions {
  /** BCP-47 accent tag for the AI's voice. Defaults to 'en-US'. */
  lang?: 'en-US' | 'en-GB';
  /** 0.1-10, SpeechSynthesisUtterance's rate. Defaults to 0.95 — very slightly slower than natural pace, easier for learners to follow. */
  rate?: number;
  pitch?: number;
}

export interface SpeakOptions {
  /** Called once the utterance finishes — whether it actually played, was skipped (muted), or errored. Always fires exactly once per `speak()` call. */
  onEnd?: () => void;
  /** Overrides the hook's default rate for just this utterance (e.g. 0.75 for a "slower" replay). */
  rate?: number;
}

export interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  error: string | null;
  warning: string | null;
  speak: (text: string, options?: SpeakOptions) => void;
  cancel: () => void;
  toggleMute: () => void;
}

/**
 * Wraps the browser's SpeechSynthesis API so the AI's challenge is actually
 * spoken aloud, with `isSpeaking` reflecting real utterance start/end
 * events (for syncing VoiceAssistantCard's waveform) rather than a guessed
 * timeout. Muting stops any in-progress utterance immediately and still
 * fires `onEnd`, so a caller's turn-flow state machine never stalls
 * waiting on speech that was silenced mid-sentence.
 */
export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisResult {
  const { lang = 'en-US', rate = 0.95, pitch = 1 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const isMutedRef = useRef(isMuted);
  const pendingOnEndRef = useRef<(() => void) | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const finish = useCallback(() => {
    setIsSpeaking(false);
    utteranceRef.current = null;
    const callback = pendingOnEndRef.current;
    pendingOnEndRef.current = null;
    callback?.();
  }, []);

  const speak = useCallback(
    (text: string, speakOptions: SpeakOptions = {}) => {
      if (isSupported && utteranceRef.current) window.speechSynthesis.cancel();
      finish();
      pendingOnEndRef.current = speakOptions.onEnd ?? null;
      setError(null);
      setWarning(null);

      if (!text.trim()) {
        setError('No hay texto para reproducir.');
        setTimeout(finish, 0);
        return;
      }
      if (!isSupported) {
        setError('La lectura en voz alta no está disponible en este navegador.');
        setTimeout(finish, 0);
        return;
      }
      if (isMutedRef.current) {
        setError('La voz está silenciada. Activa el sonido del navegador e inténtalo de nuevo.');
        // Nothing will actually play — resolve on the next tick so callers
        // that call speak() then immediately check `isSpeaking` see
        // consistent "not speaking" state rather than a same-tick flicker.
        setTimeout(finish, 0);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speakOptions.rate ?? rate;
      utterance.pitch = pitch;
      const requestedLanguage = lang.toLowerCase();
      const availableVoices = window.speechSynthesis.getVoices();
      const englishVoice = availableVoices.find((voice) => voice.lang.toLowerCase() === requestedLanguage)
        ?? availableVoices.find((voice) => voice.lang.toLowerCase().startsWith(requestedLanguage.split('-')[0]));
      const selectedVoice = englishVoice ?? availableVoices.find((voice) => voice.default) ?? availableVoices[0];
      utterance.lang = englishVoice?.lang ?? selectedVoice?.lang ?? lang;
      if (selectedVoice) utterance.voice = selectedVoice;
      if (!englishVoice && selectedVoice) {
        setWarning('No hay una voz en inglés instalada. Se reproducirá con la voz predeterminada del dispositivo.');
      }
      utterance.onstart = () => {
        setError(null);
        setIsSpeaking(true);
      };
      utterance.onend = finish;
      utterance.onerror = () => {
        setError('No se pudo reproducir la consigna. Comprueba que el dispositivo tenga una voz en inglés disponible.');
        finish();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang, rate, pitch, finish],
  );

  const cancel = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
    finish();
  }, [isSupported, finish]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next && isSupported) {
        // Muting mid-sentence: stop immediately rather than let it finish.
        window.speechSynthesis.cancel();
        finish();
      }
      return next;
    });
  }, [isSupported, finish]);

  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  return { isSupported, isSpeaking, isMuted, error, warning, speak, cancel, toggleMute };
}
