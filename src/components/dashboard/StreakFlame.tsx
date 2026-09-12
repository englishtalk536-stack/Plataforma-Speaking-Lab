import { Flame } from 'lucide-react';

export interface StreakFlameProps {
  currentStreak: number;
  className?: string;
}

/**
 * Compact HUD chip for the daily streak. The flame flickers continuously
 * (a small, contained loop, not a page-load reveal) to read as "alive" the
 * way a real streak counter in a game does. A streak of 0 shows a dim,
 * static flame so the chip never implies progress that isn't there.
 */
export function StreakFlame({ currentStreak, className = '' }: StreakFlameProps) {
  const isActive = currentStreak > 0;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-speaking-streak/30 bg-speaking-streak/10 px-3 py-1.5 ${className}`}
      title={isActive ? `${currentStreak}-day streak` : 'No active streak yet'}
    >
      <Flame
        aria-hidden="true"
        className={`h-4 w-4 ${
          isActive ? 'origin-bottom animate-flame-flicker text-speaking-streak' : 'text-speaking-locked'
        }`}
        fill={isActive ? 'currentColor' : 'none'}
        strokeWidth={isActive ? 1.5 : 1.5}
      />
      <span className="font-title text-sm text-speaking-white">{currentStreak}</span>
      <span className="sr-only">day streak</span>
    </div>
  );
}
