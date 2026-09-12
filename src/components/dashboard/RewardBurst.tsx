'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

export interface RewardBurstProps {
  /** Change this value (e.g. increment a counter) to trigger a new burst. `null`/`0` renders nothing. */
  triggerKey: number;
  className?: string;
}

const PARTICLE_COUNT = 10;
const COLORS = ['#EAB135', '#10B981', '#205088'];

/**
 * A short-lived radial burst of brand-colored dots, meant to sit centered
 * over a reward chip (coins/XP) the instant a quest is completed. Hand-built
 * with Framer Motion rather than a confetti library, so it stays this one
 * small, contained moment instead of a full-screen effect.
 */
export function RewardBurst({ triggerKey, className = '' }: RewardBurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const angle = (Math.PI * 2 * index) / PARTICLE_COUNT;
        const distance = 34 + (index % 3) * 8;
        return {
          id: index,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          color: COLORS[index % COLORS.length],
        };
      }),
    [],
  );

  return (
    <AnimatePresence>
      {triggerKey > 0 && (
        <motion.div
          key={triggerKey}
          className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: particle.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: particle.dx, y: particle.dy, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
