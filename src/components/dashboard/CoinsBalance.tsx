import { Coins } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { RewardBurst } from './RewardBurst';

export interface CoinsBalanceProps {
  coins: number;
  className?: string;
  /** Bump this (e.g. +1 each time) to play a reward burst over the chip. */
  burstTrigger?: number;
}

/** Compact HUD chip for the student's Speaking Coins balance. */
export function CoinsBalance({ coins, className = '', burstTrigger = 0 }: CoinsBalanceProps) {
  return (
    <div
      className={`relative flex items-center gap-1.5 rounded-full border border-speaking-mustard/40 bg-speaking-mustard/10 px-3 py-1.5 ${className}`}
      title={`${coins.toLocaleString('en-US')} Speaking Coins`}
    >
      <Coins aria-hidden="true" className="h-4 w-4 text-speaking-mustard" />
      <AnimatedNumber value={coins} className="font-title text-sm text-speaking-white" />
      <span className="sr-only">Speaking Coins</span>
      <RewardBurst triggerKey={burstTrigger} />
    </div>
  );
}
