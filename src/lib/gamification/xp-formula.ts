/**
 * Cumulative XP required to *reach* level N: floor(100 * N^1.5).
 * Shared by GamificationEngineService (to evaluate level-ups) and the
 * dashboard API route (to compute `nextLevelXP` for the profile response),
 * so both sides can never drift out of sync on the formula.
 */
export function getXpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}
