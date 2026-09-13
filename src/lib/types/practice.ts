export interface LessonSessionMetrics {
  /**
   * 0-100 average across the session's turns. Optional: the Speaking
   * Playground's oral-skills module (as of Prompt 8.2) doesn't score
   * grammar at all, so it omits this rather than send a made-up number —
   * the backend leaves `radarGrammar` untouched when it's absent.
   */
  grammar?: number;
  pronunciation: number;
  fluency: number;
  vocabulary: number;
}

export interface CompleteLessonRequest {
  nodeId: string;
  sessionMetrics: LessonSessionMetrics;
}

export interface RadarSnapshot {
  fluency: number;
  grammar: number;
  pronunciation: number;
  vocabulary: number;
}

export interface CompleteLessonResponse {
  success: true;
  xpEarned: number;
  newTotalXp: number;
  currentLevel: number;
  didLevelUp: boolean;
  currentStreak: number;
  coinsEarned: number;
  newTotalCoins: number;
  /** True when this node was already completed before this call — XP/coins were NOT re-granted, but the Feedback Radar still updated from this practice session. */
  alreadyCompleted: boolean;
  updatedRadar: RadarSnapshot;
}
