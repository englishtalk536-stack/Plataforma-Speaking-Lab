export interface MissionCompletionInput {
  activityType: string;
  resourceOpened: boolean;
  response: string;
}

const ANSWER_REQUIRED_TYPES = new Set(['SPEAKING', 'LISTENING', 'TOPIC', 'VOCABULARY']);
const RESOURCE_REQUIRED_TYPES = new Set(['LISTENING', 'PRACTICE', 'VIDEO', 'GAME']);

export function isMissionReadyToComplete({ activityType, resourceOpened, response }: MissionCompletionInput): boolean {
  const words = response.trim().split(/\s+/).filter(Boolean).length;
  const answerReady = !ANSWER_REQUIRED_TYPES.has(activityType) || words >= 3;
  const resourceReady = !RESOURCE_REQUIRED_TYPES.has(activityType) || resourceOpened;
  return answerReady && resourceReady;
}
