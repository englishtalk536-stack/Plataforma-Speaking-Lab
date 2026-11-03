import type { Prisma } from '@prisma/client';
import { additionalDailyMissions, additionalSpeakingListeningPractices } from '../curriculum-catalog';

const skillNodeId = (value: number) => `00000000-0000-0000-0000-${value.toString().padStart(12, '0')}`;

export const requiredParentSkillNodes = [
  {
    id: skillNodeId(1),
    title: 'Basic Greetings',
    description: 'Learn how to introduce yourself and greet others in everyday situations.',
    levelRequired: 1,
    parentNodeId: null,
    xpReward: 50,
    coinReward: 10,
    cefrLevel: 'A1',
    challengeText: 'Introduce yourself and say where you are from.',
    targetVocabulary: 'name, country, city, live',
    grammarHints: 'be, subject pronouns',
    positionX: 0,
    positionY: 0,
  },
  {
    id: skillNodeId(2),
    title: 'Ordering Food',
    description: 'Practice vocabulary and phrases used to order food at restaurants and cafés.',
    levelRequired: 2,
    parentNodeId: skillNodeId(1),
    xpReward: 75,
    coinReward: 15,
    cefrLevel: 'A2',
    challengeText: 'Order a meal and describe what you had yesterday.',
    targetVocabulary: 'menu, order, meal, yesterday',
    grammarHints: 'polite requests, past simple',
    positionX: 1,
    positionY: 0,
  },
  {
    id: skillNodeId(3),
    title: 'Job Interview Prep',
    description: 'Build confidence answering common job interview questions in English.',
    levelRequired: 5,
    parentNodeId: skillNodeId(2),
    xpReward: 150,
    coinReward: 25,
    cefrLevel: 'B1',
    challengeText: 'Describe a challenging experience working in a team.',
    targetVocabulary: 'experience, teamwork, challenge, solution',
    grammarHints: 'past simple, present perfect',
    positionX: 2,
    positionY: 0,
  },
  {
    id: skillNodeId(4),
    title: 'Travel Stories',
    description: 'Tell engaging stories about trips, mishaps, and memorable places.',
    levelRequired: 8,
    parentNodeId: skillNodeId(3),
    xpReward: 200,
    coinReward: 30,
    cefrLevel: 'B2',
    challengeText: 'Tell a detailed story about a memorable trip.',
    targetVocabulary: 'journey, destination, memorable, unexpected',
    grammarHints: 'narrative tenses, conditionals',
    positionX: 3,
    positionY: 0,
  },
  {
    id: skillNodeId(5),
    title: 'Business Negotiation',
    description: 'Negotiate terms, make concessions, and defend your priorities clearly.',
    levelRequired: 12,
    parentNodeId: skillNodeId(4),
    xpReward: 275,
    coinReward: 40,
    cefrLevel: 'C1',
    challengeText: 'Negotiate a better contract while defending your priorities.',
    targetVocabulary: 'terms, concession, proposal, contingency',
    grammarHints: 'hedging, formal connectors',
    positionX: 4,
    positionY: 0,
  },
  {
    id: skillNodeId(6),
    title: 'Abstract Debate',
    description: 'Debate complex ideas with nuance, evidence, and precise transitions.',
    levelRequired: 16,
    parentNodeId: skillNodeId(5),
    xpReward: 350,
    coinReward: 50,
    cefrLevel: 'C2',
    challengeText: 'Defend a nuanced position on technology and human connection.',
    targetVocabulary: 'nuance, evidence, reconcile, implication',
    grammarHints: 'inversion, discourse markers',
    positionX: 5,
    positionY: 0,
  },
] satisfies Prisma.SkillNodeUncheckedCreateInput[];

export const POSTGRES_CATALOG_CONFIRMATION = 'LOAD_SPEAKINGLAB_CATALOG';

export function validatePostgresCatalogTarget(environment: Record<string, string | undefined>): void {
  if (environment.POSTGRES_CATALOG_CONFIRM !== POSTGRES_CATALOG_CONFIRMATION) {
    throw new Error(`Refusing to load catalog. Set POSTGRES_CATALOG_CONFIRM=${POSTGRES_CATALOG_CONFIRMATION} after verifying the Neon target.`);
  }

  const parseNeonTarget = (value: string | undefined) => {
    if (!value) return false;
    try {
      const url = new URL(value);
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech')) return null;
      return {
        hostname: url.hostname.replace(/-pooler(?=\.)/, ''),
        database: url.pathname,
        port: url.port || '5432',
      };
    } catch {
      return null;
    }
  };

  const databaseTarget = parseNeonTarget(environment.DATABASE_URL);
  const directTarget = parseNeonTarget(environment.DIRECT_URL);
  if (!databaseTarget || !directTarget) {
    throw new Error('Refusing to load catalog. DATABASE_URL and DIRECT_URL must both target Neon PostgreSQL.');
  }
  if (
    databaseTarget.hostname !== directTarget.hostname ||
    databaseTarget.database !== directTarget.database ||
    databaseTarget.port !== directTarget.port
  ) {
    throw new Error('Refusing to load catalog. DATABASE_URL and DIRECT_URL must target the same Neon database.');
  }
}

type CatalogTransaction = Pick<Prisma.TransactionClient, 'skillNode' | 'dailyQuest'>;

export async function loadPostgresCatalog(transaction: CatalogTransaction) {
  for (const node of requiredParentSkillNodes) {
    await transaction.skillNode.upsert({ where: { id: node.id }, update: node, create: node });
  }
  for (const practice of additionalSpeakingListeningPractices) {
    await transaction.skillNode.upsert({ where: { id: practice.id }, update: practice, create: practice });
  }
  for (const mission of additionalDailyMissions) {
    await transaction.dailyQuest.upsert({ where: { id: mission.id }, update: mission, create: mission });
  }

  return {
    parentNodes: requiredParentSkillNodes.length,
    practices: additionalSpeakingListeningPractices.length,
    missions: additionalDailyMissions.length,
  };
}