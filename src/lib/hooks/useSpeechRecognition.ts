'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Ambient types
// ============================================================================
// The Web Speech API (SpeechRecognition) is not part of TypeScript's default
// DOM lib — it's non-standard and still vendor-prefixed in most browsers
// (only Chrome/Edge/Safari ship it, as `webkitSpeechRecognition`; Firefox
// does not support it at all as of this writing). These are minimal
// hand-written types covering only what this hook uses.

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ============================================================================
// Hook
// ============================================================================

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag for recognition. Defaults to 'en-US'. */
  language?: string;
}

export interface UseSpeechRecognitionResult {
  /** false on browsers with neither SpeechRecognition nor a microphone API (e.g. Firefox, or non-secure contexts). */
  isSupported: boolean;
  isListening: boolean;
  /** Live transcript, interim results included — updates continuously while listening. */
  transcript: string;
  /** Average confidence (0-1) across finalized results this turn; a rough proxy for how clearly the speech was recognized. */
  confidence: number;
  /** Live microphone amplitude, 0-1, sampled from the actual input stream — drives the recording waveform. */
  volumeLevel: number;
  /** Set when the mic permission is denied, no speech API is available, or recognition errors out. */
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  /** Clears transcript/confidence between turns without touching mic permission state. */
  reset: () => void;
}

const VOLUME_UPDATE_INTERVAL_MS = 80;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionResult {
  const { language = 'en-US' } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVolumeSampleAtRef = useRef(0);
  const confidenceSamplesRef = useRef<number[]>([]);

  const isSupported =
    typeof window !== 'undefined' && getSpeechRecognitionConstructor() !== null && !!navigator.mediaDevices?.getUserMedia;

  const stopVolumeMetering = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  const runVolumeLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = (timestamp: number) => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(data);

      // RMS of the (centered) waveform, normalized to roughly 0-1.
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const centered = (data[i] - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / data.length);

      if (timestamp - lastVolumeSampleAtRef.current >= VOLUME_UPDATE_INTERVAL_MS) {
        lastVolumeSampleAtRef.current = timestamp;
        setVolumeLevel(Math.min(1, rms * 4)); // scaled up — raw mic RMS is usually small
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    setConfidence(0);
    confidenceSamplesRef.current = [];

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        const audioContext = new AudioContextCtor();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        runVolumeLoop();
      }
    } catch {
      setError('Microphone access was denied. Please allow microphone permissions and try again.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let combined = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        combined += `${result[0].transcript} `;
        if (result.isFinal) {
          confidenceSamplesRef.current.push(result[0].confidence);
          const avg =
            confidenceSamplesRef.current.reduce((sum, value) => sum + value, 0) / confidenceSamplesRef.current.length;
          setConfidence(avg);
        }
      }
      setTranscript(combined.trim());
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [language, runVolumeLoop]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopVolumeMetering();
    setIsListening(false);
  }, [stopVolumeMetering]);

  const reset = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    confidenceSamplesRef.current = [];
  }, []);

  // Safety net: release the mic and stop recognition if the component
  // unmounts mid-recording (e.g. the student navigates away).
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopVolumeMetering();
    };
  }, [stopVolumeMetering]);

  return { isSupported, isListening, transcript, confidence, volumeLevel, error, start, stop, reset };
}
