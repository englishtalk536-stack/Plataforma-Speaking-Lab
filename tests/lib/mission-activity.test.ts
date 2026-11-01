import { describe, expect, it } from 'vitest';
import { isMissionReadyToComplete } from '../../src/lib/mission-activity';

describe('daily mission activity completion', () => {
  it('does not complete speaking by merely opening the mission', () => {
    expect(isMissionReadyToComplete({ activityType: 'SPEAKING', resourceOpened: false, response: '' })).toBe(false);
    expect(isMissionReadyToComplete({ activityType: 'SPEAKING', resourceOpened: false, response: 'I practiced today' })).toBe(true);
  });

  it('requires listening resource and an answer', () => {
    expect(isMissionReadyToComplete({ activityType: 'LISTENING', resourceOpened: false, response: 'I heard three words' })).toBe(false);
    expect(isMissionReadyToComplete({ activityType: 'LISTENING', resourceOpened: true, response: '' })).toBe(false);
    expect(isMissionReadyToComplete({ activityType: 'LISTENING', resourceOpened: true, response: 'I heard three words' })).toBe(true);
  });

  it('requires opening video, game, and practice resources', () => {
    for (const activityType of ['VIDEO', 'GAME', 'PRACTICE']) {
      expect(isMissionReadyToComplete({ activityType, resourceOpened: false, response: '' })).toBe(false);
      expect(isMissionReadyToComplete({ activityType, resourceOpened: true, response: '' })).toBe(true);
    }
  });

  it('requires a response for topic and vocabulary missions', () => {
    expect(isMissionReadyToComplete({ activityType: 'TOPIC', resourceOpened: false, response: 'short' })).toBe(false);
    expect(isMissionReadyToComplete({ activityType: 'VOCABULARY', resourceOpened: false, response: 'I learned five new words' })).toBe(true);
  });
});