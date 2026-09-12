import { Anton } from 'next/font/google';

/**
 * Anton is loaded via next/font/google (self-hosted at build time, no
 * runtime request to Google Fonts, zero layout shift). It's exposed as a
 * CSS variable so Tailwind's `font-title` utility (see tailwind.config.ts)
 * can reference it.
 *
 * Tahoma is NOT on Google Fonts — it's a Microsoft-licensed system font,
 * bundled with Windows and (older) macOS, but not guaranteed on Linux,
 * Android, or iOS. There is no legal way to self-host or web-embed it. The
 * `font-body` utility therefore uses the literal family name "Tahoma" with
 * a close-metric fallback stack (Verdana, Segoe UI, system sans) so brand
 * devices render true Tahoma while everything else degrades gracefully.
 * If pixel-perfect consistency across all platforms matters more than the
 * literal brand font, consider licensing "Tahoma" from Monotype for web
 * embedding, or swapping in an open metrically-similar face (e.g. "Arimo").
 */
export const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});
