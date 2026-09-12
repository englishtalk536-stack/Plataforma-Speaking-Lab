'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ear, Loader2, Mic, Square } from 'lucide-react';

export type RecorderStatus = 'idle' | 'recording' | 'processing' | 'listening';

export interface AudioRecorderControlsProps {
  status: RecorderStatus;
  onToggleRecord: () => void;
  className?: string;
}

const VOLUME_BAR_COUNT = 5;

const STATUS_LABEL: Record<RecorderStatus, string> = {
  idle: 'Tap to answer',
  recording: 'Recording — tap to stop',
  processing: 'Processing your answer…',
  listening: 'Listening to the AI…',
};

/**
 * Simulates a live input-volume meter while `status === 'recording'` (no
 * real microphone analysis in this mock — see practice-context.ts for why).
 * Bars settle back to a flat baseline the instant recording stops.
 */
function useSimulatedVolume(status: RecorderStatus): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array(VOLUME_BAR_COUNT).fill(0.15));

  useEffect(() => {
    if (status !== 'recording') {
      return;
    }

    const interval = setInterval(() => {
      setLevels(Array.from({ length: VOLUME_BAR_COUNT }, () => 0.25 + Math.random() * 0.75));
    }, 160);

    return () => clearInterval(interval);
  }, [status]);

  return status === 'recording' ? levels : Array(VOLUME_BAR_COUNT).fill(0.15);
}

export function AudioRecorderControls({ status, onToggleRecord, className = '' }: AudioRecorderControlsProps) {
  const volumeLevels = useSimulatedVolume(status);
  const isBusy = status === 'processing' || status === 'listening';

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex h-8 items-end gap-1" aria-hidden="true">
        {volumeLevels.map((level, index) => (
          <span
            key={index}
            className="w-1.5 rounded-full bg-speaking-mustard transition-[height] duration-150"
            style={{ height: `${Math.round(level * 32)}px` }}
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
