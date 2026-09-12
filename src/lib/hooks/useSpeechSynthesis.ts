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
}

export interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
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

  const isMutedRef = useRef(isMuted);
  const pendingOnEndRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const finish = useCallback(() => {
    setIsSpeaking(false);
    const callback = pendingOnEndRef.current;
    pendingOnEndRef.current = null;
    callback?.();
  }, []);

  const speak = useCallback(
    (text: string, speakOptions: SpeakOptions = {}) => {
      // Any previous utterance is superseded — cancel it (and let its own
      // onEnd fire naturally via the browser's cancel behavior is
      // inconsistent across browsers, so we finish it manually here).
      if (isSupported) window.speechSynthesis.cancel();
      finish();

      pendingOnEndRef.current = speakOptions.onEnd ?? null;

      if (!isSupported || isMutedRef.current) {
        // Nothing will actually play — resolve on the next tick so callers
        // that call speak() then immediately check `isSpeaking` see
        // consistent "not speaking" state rather than a same-tick flicker.
        setTimeout(finish, 0);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = finish;
      utterance.onerror = finish;

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

  return { isSupported, isSpeaking, isMuted, speak, cancel, toggleMute };
}
