import { describe, expect, it } from 'vitest';
import { blendRadarScore } from '../../src/lib/gamification/radar-blend';

describe('blendRadarScore', () => {
  it('blends the previous score and the new session average', () => {
    expect(blendRadarScore(50, 80)).toBe(59);
  });

  it('clamps results to the 0-100 radar range', () => {
    expect(blendRadarScore(0, -50)).toBe(0);
    expect(blendRadarScore(100, 150)).toBe(100);
  });

  it('rounds the result to one decimal place', () => {
    expect(blendRadarScore(33, 66, 0.3)).toBe(42.9);
  });
});
