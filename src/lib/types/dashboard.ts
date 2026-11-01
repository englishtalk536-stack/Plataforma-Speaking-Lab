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

export type ClassroomStatusDto = 'ACTIVE' | 'ARCHIVED';

export type ClassroomMembershipStatusDto = 'ACTIVE' | 'INACTIVE';

export interface ClassroomSummaryDto {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  englishLevel: string | null;
  status: ClassroomStatusDto;
  teacher: {
    id: string;
    name: string;
  };
  membershipStatus: ClassroomMembershipStatusDto;
  joinedAt: string;
}

export interface UpcomingVirtualClassDto {
  id: string;
  title: string;
  joinUrl: string;
  scheduledAt: string;
  classroomId: string;
  classroomName: string;
}

export interface DashboardNotificationDto {
  id: string;
  title: string;
  message: string;
  href: string | null;
  createdAt: string;
}

export interface CompletedClassDto {
  id: string;
  title: string;
  taughtAt: string;
  classroomId: string;
  classroomName: string;
  notes?: string | null;
  improvementOpportunities?: string | null;
}

export interface StudentClassFollowUpDto {
  id: string;
  title: string;
  taughtAt: string;
  notes: string;
  improvementOpportunities: string | null;
  homework: string | null;
  practiceNodeId: string | null;
  practiceTitle: string | null;
  practiceCompleted: boolean;
  classroomId: string;
  classroomName: string;
}

export interface StudentHomeworkTaskDto {
  id: string;
  title: string;
  homework: string;
  classroomId: string;
  classroomName: string;
}

export interface StudentActivityDto {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  classroomId: string;
  classroomName: string;
}

export interface DailyQuestDto {
  /** UserDailyQuest.id — pass this back as `questId` to POST /api/student/quest/complete. */
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  activityType: string;
  resourceUrl: string | null;
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
  classrooms: ClassroomSummaryDto[];
  upcomingVirtualClasses: UpcomingVirtualClassDto[];
  notifications: DashboardNotificationDto[];
  classFollowUps: StudentClassFollowUpDto[];
  homeworkTasks: StudentHomeworkTaskDto[];
  activities: StudentActivityDto[];
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
