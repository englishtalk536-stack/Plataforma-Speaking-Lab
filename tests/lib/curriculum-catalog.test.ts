import { describe, expect, it } from 'vitest';
import { additionalDailyMissions, additionalSpeakingListeningPractices } from '../../prisma/curriculum-catalog';

describe('expanded curriculum catalog', () => {
  it('provides multiple guided oral practices across every CEFR band', () => {
    expect(additionalSpeakingListeningPractices).toHaveLength(52);

    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      const practices = additionalSpeakingListeningPractices.filter((practice) => practice.cefrLevel === level);
      expect(practices.length).toBeGreaterThanOrEqual(3);
      expect(practices.every((practice) => practice.challengeText.trim().length > 40)).toBe(true);
      expect(practices.every((practice) => practice.description.trim().length > 20)).toBe(true);
    }

    expect(new Set(additionalSpeakingListeningPractices.map((practice) => practice.id)).size).toBe(52);
  });

  it('provides a broad reusable mission catalog without assigning it to a student', () => {
    expect(additionalDailyMissions).toHaveLength(12);
    expect(new Set(additionalDailyMissions.map((mission) => mission.id)).size).toBe(12);
    expect(additionalDailyMissions.every((mission) => mission.isActive && mission.xpReward > 0 && mission.coinReward > 0)).toBe(true);
  });
});