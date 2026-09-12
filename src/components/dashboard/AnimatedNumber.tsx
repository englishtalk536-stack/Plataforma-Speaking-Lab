'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export interface AnimatedNumberProps {
  value: number;
  className?: string;
  /** Formats the in-progress and final number for display. Defaults to a plain integer with thousands separators. */
  format?: (value: number) => string;
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString('en-US');

/**
 * Renders a number that tweens toward `value` whenever it changes, instead
 * of jumping instantly — used for Speaking Coins and XP so a reward feels
 * like it's "landing" rather than just appearing.
 */
export function AnimatedNumber({ value, className = '', format = defaultFormat }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    if (from === to) return;

    const controls = animate(from, to, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(latest),
    });

    previousValue.current = to;
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}
