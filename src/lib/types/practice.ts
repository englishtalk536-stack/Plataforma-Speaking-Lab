export interface LessonSessionMetrics {
  /** 0-100 average across the session's turns. */
  grammar: number;
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
  updatedRadar: RadarSnapshot;
}
