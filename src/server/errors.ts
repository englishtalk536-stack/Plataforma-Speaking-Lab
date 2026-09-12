export class DashboardApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

export class UnauthenticatedError extends DashboardApiError {
  constructor() {
    super('Not authenticated.', 401);
    this.name = 'UnauthenticatedError';
  }
}

export class InvalidRequestError extends DashboardApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'InvalidRequestError';
  }
}

export class StudentNotFoundError extends DashboardApiError {
  constructor(userId: string) {
    super(`Student not found: ${userId}`, 404);
    this.name = 'StudentNotFoundError';
  }
}

export class QuestNotAvailableError extends DashboardApiError {
  constructor(questId: string) {
    super(`No pending assignment of quest ${questId} found for today.`, 409);
    this.name = 'QuestNotAvailableError';
  }
}

export class LessonNotAvailableError extends DashboardApiError {
  constructor(nodeId: string) {
    super(`No completable lesson progress found for node ${nodeId}.`, 409);
    this.name = 'LessonNotAvailableError';
  }
}

/** Today's date normalized to UTC midnight — matches how `assignedDate` is stored on UserDailyQuest. */
export function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
