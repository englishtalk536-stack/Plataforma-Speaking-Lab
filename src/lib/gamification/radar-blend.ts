/**
 * Blends a new session's average score into the student's stored Feedback
 * Radar value using a simple exponential moving average, so one unusually
 * good or bad session doesn't swing the radar wildly. `weight` is how much
 * the new session counts (0.3 = 30% new, 70% prior history).
 */
export function blendRadarScore(previousValue: number, sessionAverage: number, weight = 0.3): number {
  const blended = previousValue * (1 - weight) + sessionAverage * weight;
  return Math.round(Math.min(100, Math.max(0, blended)) * 10) / 10;
}
