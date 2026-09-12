'use client';

import { motion } from 'framer-motion';
import { Ear, Loader2, Mic, Square } from 'lucide-react';

export type RecorderStatus = 'idle' | 'recording' | 'processing' | 'listening';

export interface AudioRecorderControlsProps {
  status: RecorderStatus;
  /** Live microphone amplitude, 0-1, from useSpeechRecognition. Ignored outside 'recording'. */
  volumeLevel: number;
  onToggleRecord: () => void;
  className?: string;
}

// Per-bar sensitivity multipliers so a single amplitude reading still reads
// as an organic waveform rather than 5 identical bars moving in lockstep.
const BAR_SENSITIVITY = [0.6, 0.85, 1, 0.85, 0.6];

const STATUS_LABEL: Record<RecorderStatus, string> = {
  idle: 'Tap to answer',
  recording: 'Recording — tap to stop',
  processing: 'Processing your answer…',
  listening: 'Listening to the AI…',
};

export function AudioRecorderControls({ status, volumeLevel, onToggleRecord, className = '' }: AudioRecorderControlsProps) {
  const isBusy = status === 'processing' || status === 'listening';
  const effectiveVolume = status === 'recording' ? volumeLevel : 0.05;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex h-8 items-end gap-1" aria-hidden="true">
        {BAR_SENSITIVITY.map((sensitivity, index) => (
          <span
            key={index}
            className="w-1.5 rounded-full bg-speaking-mustard transition-[height] duration-100"
            style={{ height: `${Math.max(4, Math.round(effectiveVolume * sensitivity * 32))}px` }}
          />
        ))}
      </div>

      <motion.button
        type="button"
        onClick={onToggleRecord}
        disabled={isBusy}
        aria-label={STATUS_LABEL[status]}
        whileTap={!isBusy ? { scale: 0.94 } : undefined}
        animate={status === 'recording' ? { boxShadow: ['0 0 0 0 #EAB13566', '0 0 0 14px #EAB13500'] } : {}}
        transition={status === 'recording' ? { duration: 1.4, repeat: Infinity, ease: 'easeOut' } : undefined}
        className={`flex h-16 w-16 items-center justify-center rounded-full text-speaking-cobalt transition-colors ${
          isBusy ? 'cursor-wait bg-speaking-locked/30 text-speaking-locked' : 'bg-speaking-mustard hover:brightness-95'
        }`}
      >
        {status === 'idle' && <Mic className="h-7 w-7" aria-hidden="true" />}
        {status === 'recording' && <Square className="h-6 w-6" aria-hidden="true" />}
        {status === 'processing' && <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />}
        {status === 'listening' && <Ear className="h-7 w-7" aria-hidden="true" />}
      </motion.button>

      <p className="font-body text-sm text-speaking-cobalt/70">{STATUS_LABEL[status]}</p>
    </div>
  );
}
