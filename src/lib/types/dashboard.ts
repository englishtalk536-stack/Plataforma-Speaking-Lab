export type WireNodeStatus = 'LOCKED' | 'CURRENT' | 'COMPLETED';

export interface SkillPathNodeDto {
  id: string;
  title: string;
  status: WireNodeStatus;
  xpReward: number;
  position: { x: number; y: number };
}

export interface FeedbackRadarDto {
  fluency: number;
  grammar: number;
  pronunciation: number;
  vocabulary: number;
}

export type DailyQuestStatusDto = 'PENDING' | 'COMPLETED' | 'EXPIRED';

export interface DailyQuestDto {
  /** UserDailyQuest.id — pass this back as `questId` to POST /api/student/quest/complete. */
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  status: DailyQuestStatusDto;
}

export interface StudentProfileDto {
  name: string;
  avatarUrl: string | null;
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  streakDays: number;
  speakingCoins: number;
}

export interface StudentDashboardResponse {
  profile: StudentProfileDto;
  skillPath: SkillPathNodeDto[];
  feedbackRadar: FeedbackRadarDto;
  dailyQuests: DailyQuestDto[];
}

export interface CompleteQuestRequest {
  questId: string;
}

export interface CompleteQuestResponse {
  success: true;
  xpEarned: number;
  newTotalXp: number;
  currentLevel: number;
  didLevelUp: boolean;
  currentStreak: number;
  coinsEarned: number;
  newTotalCoins: number;
}

export interface ApiErrorResponse {
  error: string;
}
