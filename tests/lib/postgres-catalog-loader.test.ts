import type { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { additionalDailyMissions, additionalSpeakingListeningPractices } from '../../prisma/curriculum-catalog';
import {
  loadPostgresCatalog,
  POSTGRES_CATALOG_CONFIRMATION,
  requiredParentSkillNodes,
  validatePostgresCatalogTarget,
} from '../../prisma/postgresql/catalog-loader';

describe('PostgreSQL catalog loader', () => {
  it('upserts only the approved catalog and its required parents', async () => {
    const skillCalls: Array<{ where: { id: string }; update: unknown; create: unknown }> = [];
    const missionCalls: Array<{ where: { id: string }; update: unknown; create: unknown }> = [];
    const transaction = {
      skillNode: { upsert: vi.fn(async (args: (typeof skillCalls)[number]) => { skillCalls.push(args); }) },
      dailyQuest: { upsert: vi.fn(async (args: (typeof missionCalls)[number]) => { missionCalls.push(args); }) },
    } as unknown as Prisma.TransactionClient;

    const counts = await loadPostgresCatalog(transaction);

    expect(counts).toEqual({ parentNodes: 6, practices: 52, missions: 12 });
    expect(skillCalls).toHaveLength(58);
    expect(missionCalls).toHaveLength(12);
    expect(skillCalls.map(({ where }) => where.id)).toEqual([
      ...requiredParentSkillNodes.map(({ id }) => id),
      ...additionalSpeakingListeningPractices.map(({ id }) => id),
    ]);
    expect(missionCalls.map(({ where }) => where.id)).toEqual(additionalDailyMissions.map(({ id }) => id));
    expect(skillCalls.every(({ update, create }) => update === create || JSON.stringify(update) === JSON.stringify(create))).toBe(true);
    expect(missionCalls.every(({ update, create }) => update === create || JSON.stringify(update) === JSON.stringify(create))).toBe(true);

    const parentIds = new Set(requiredParentSkillNodes.map(({ id }) => id));
    expect(additionalSpeakingListeningPractices.every(({ parentNodeId }) => parentIds.has(parentNodeId))).toBe(true);
    const practiceTitles = additionalSpeakingListeningPractices.map(({ title }) => title);
    for (const draftTitle of [
      'Me presento',
      '¿Quién se presenta?',
      'Pregunto y respondo dos datos',
      'Dos datos en un diálogo',
    ]) {
      expect(practiceTitles).not.toContain(draftTitle);
    }
  });

  it('requires explicit confirmation and both Neon PostgreSQL URLs', () => {
    const directHost = 'ep-preview.c-2.us-east-1.aws.neon.tech';
    const target = {
      POSTGRES_CATALOG_CONFIRM: POSTGRES_CATALOG_CONFIRMATION,
      DATABASE_URL: `postgresql://user:pass@${directHost.replace('.', '-pooler.')}/speakinglab`,
      DIRECT_URL: `postgresql://user:pass@${directHost}/speakinglab`,
    };

    expect(() => validatePostgresCatalogTarget(target)).not.toThrow();
    expect(() => validatePostgresCatalogTarget({ ...target, POSTGRES_CATALOG_CONFIRM: undefined })).toThrow(/Refusing to load catalog/);
    expect(() => validatePostgresCatalogTarget({ ...target, DATABASE_URL: 'file:./dev.db' })).toThrow(/Neon PostgreSQL/);
    expect(() => validatePostgresCatalogTarget({ ...target, DIRECT_URL: 'postgresql://localhost/speakinglab' })).toThrow(/Neon PostgreSQL/);
    expect(() => validatePostgresCatalogTarget({
      ...target,
      DIRECT_URL: 'postgresql://user:pass@ep-other.c-2.us-east-1.aws.neon.tech/speakinglab',
    })).toThrow(/same Neon database/);
    expect(() => validatePostgresCatalogTarget({
      ...target,
      DIRECT_URL: `postgresql://user:pass@${directHost}/another-database`,
    })).toThrow(/same Neon database/);
  });
});