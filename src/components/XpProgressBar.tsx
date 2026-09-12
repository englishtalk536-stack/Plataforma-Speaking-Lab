'use client';

import { motion } from 'framer-motion';

export interface XpProgressBarProps {
  /** Total XP the student currently has (cumulative). */
  currentXp: number;
  /** Cumulative XP required to reach the *current* level (the floor of this level's bracket). */
  xpForCurrentLevel: number;
  /** Cumulative XP required to reach the *next* level. */
  xpForNextLevel: number;
  /** 'dark' (default) for placement on speaking-cobalt surfaces; 'light' for white/light surfaces. */
  variant?: 'dark' | 'light';
  className?: string;
}

/**
 * A capsule XP bar showing progress within the current level bracket.
 * Fills from 0 to its target width once on mount — the one deliberate
 * motion moment for this component, not a hover/scroll-triggered effect.
 */
export function XpProgressBar({
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
  variant = 'dark',
  className = '',
}: XpProgressBarProps) {
  const bracketSize = Math.max(xpForNextLevel - xpForCurrentLevel, 1);
  const progressInBracket = Math.min(Math.max(currentXp - xpForCurrentLevel, 0), bracketSize);
  const percent = Math.round((progressInBracket / bracketSize) * 100);
  const xpRemaining = Math.max(xpForNextLevel - currentXp, 0);
  const trackClass = variant === 'dark' ? 'bg-speaking-white/15' : 'bg-speaking-cobalt/10';
  const labelClass = variant === 'dark' ? 'text-speaking-white/70' : 'text-speaking-cobalt/70';

  return (
    <div className={className}>
      <div
        className={`h-2.5 w-full overflow-hidden rounded-full ${trackClass}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Experience progress: ${percent}% to next level`}
      >
        <motion.div
          className="h-full rounded-full bg-speaking-success"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      <p className={`mt-1 font-body text-xs ${labelClass}`}>
        {xpRemaining > 0 ? `${xpRemaining} XP to next level` : 'Level complete'}
      </p>
    </div>
  );
}
