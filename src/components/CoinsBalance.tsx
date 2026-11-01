import { Coins } from 'lucide-react';

export interface CoinsBalanceProps {
  coins: number;
  className?: string;
}

/** Compact HUD chip for the student's Speaking Coins balance. */
export function CoinsBalance({ coins, className = '' }: CoinsBalanceProps) {
  return (
    <div
      className={`flex min-h-11 items-center gap-2 rounded-xl border border-speaking-mustard/35 bg-speaking-mustard/10 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${className}`}
      title={`${coins.toLocaleString('en-US')} Speaking Coins`}
    >
      <Coins aria-hidden="true" className="h-4 w-4 text-speaking-mustard" />
      <span className="font-title text-base leading-none text-speaking-white">{coins.toLocaleString('en-US')}</span>
      <span className="font-body text-xs font-semibold text-speaking-white/80">monedas</span>
      <span className="sr-only">Speaking Coins</span>
    </div>
  );
}
