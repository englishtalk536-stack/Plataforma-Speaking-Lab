import { Coins } from 'lucide-react';

export interface CoinsBalanceProps {
  coins: number;
  className?: string;
}

/** Compact HUD chip for the student's Speaking Coins balance. */
export function CoinsBalance({ coins, className = '' }: CoinsBalanceProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-speaking-mustard/40 bg-speaking-mustard/10 px-3 py-1.5 ${className}`}
      title={`${coins.toLocaleString('en-US')} Speaking Coins`}
    >
      <Coins aria-hidden="true" className="h-4 w-4 text-speaking-mustard" />
      <span className="font-title text-sm text-speaking-white">{coins.toLocaleString('en-US')}</span>
      <span className="sr-only">Speaking Coins</span>
    </div>
  );
}
