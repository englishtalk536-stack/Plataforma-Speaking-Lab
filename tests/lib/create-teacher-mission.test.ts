import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireTeacherId: vi.fn(),
  membershipFindFirst: vi.fn(),
  skillNodeFindUnique: vi.fn(),
  progressFindUnique: vi.fn(),
  transaction: vi.fn(),
  progressUpsert: vi.fn(),
  dailyQuestCreate: vi.fn(),
  userDailyQuestCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/teacher-auth', () => ({ requireTeacherId: mocks.requireTeacherId }));
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    classroomMembership: { findFirst: mocks.membershipFindFirst },
    skillNode: { findUnique: mocks.skillNodeFindUnique },
    userSkillProgress: { findUnique: mocks.progressFindUnique },
    $transaction: mocks.transaction,
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { createAndAssignDailyQuest } from '../../src/app/teacher/classrooms/[classroomId]/students/[studentId]/actions';

function makeForm(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

function baseForm(activityType = 'SPEAKING') {
  return makeForm({
    title: 'E2E Custom Speaking Mission',
    description: 'Answer the spoken prompt with two supporting details.',
    activityType,
    resourceUrl: '',
    practiceNodeId: '',
    xpReward: '35',
    coinReward: '12',
  });
}

describe('createAndAssignDailyQuest', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireTeacherId.mockResolvedValue('teacher-id');
    mocks.membershipFindFirst.mockResolvedValue({ id: 'membership-id' });
    mocks.skillNodeFindUnique.mockResolvedValue({ id: 'practice-id' });
    mocks.progressFindUnique.mockResolvedValue(null);
    mocks.dailyQuestCreate.mockResolvedValue({ id: 'created-quest-id' });
    mocks.userDailyQuestCreate.mockResolvedValue({ id: 'daily-assignment-id' });
    mocks.progressUpsert.mockResolvedValue({ id: 'progress-id' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      userSkillProgress: { upsert: mocks.progressUpsert },
      dailyQuest: { create: mocks.dailyQuestCreate },
      userDailyQuest: { create: mocks.userDailyQuestCreate },
    }));
  });

  it('requires teacher authorization even when called directly', async () => {
    mocks.requireTeacherId.mockRejectedValue(new Error('not a teacher'));

    await expect(createAndAssignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, baseForm()))
      .rejects.toThrow('not a teacher');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects a student outside the teacher-owned classroom', async () => {
    mocks.membershipFindFirst.mockResolvedValue(null);

    const result = await createAndAssignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, baseForm());

    expect(result).toEqual({ status: 'error', message: 'No tienes acceso a este estudiante.' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('requires HTTPS resources for video missions', async () => {
    const form = baseForm('VIDEO');
    form.set('resourceUrl', 'http://video.example.test/lesson');

    const result = await createAndAssignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, form);

    expect(result).toEqual({ status: 'error', message: 'El enlace debe ser una URL válida y segura (HTTPS).' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('creates and assigns a custom speaking mission for today', async () => {
    const result = await createAndAssignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, baseForm());

    expect(result).toEqual({ status: 'success', message: 'Misión creada y asignada para hoy.' });
    expect(mocks.dailyQuestCreate.mock.calls[0][0].data).toMatchObject({
      title: 'E2E Custom Speaking Mission', activityType: 'SPEAKING', xpReward: 35, coinReward: 12, isActive: true,
    });
    expect(mocks.userDailyQuestCreate.mock.calls[0][0].data).toMatchObject({
      userId: 'student-id', questId: 'created-quest-id', status: 'PENDING',
    });
    expect(mocks.progressUpsert).not.toHaveBeenCalled();
  });

  it('unlocks and links a selected practice within the assignment transaction', async () => {
    const form = baseForm('PRACTICE');
    form.set('practiceNodeId', 'practice-id');

    const result = await createAndAssignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, form);

    expect(result.status).toBe('success');
    expect(mocks.progressUpsert).toHaveBeenCalledWith({
      where: { userId_nodeId: { userId: 'student-id', nodeId: 'practice-id' } },
      update: { status: 'UNLOCKED' },
      create: { userId: 'student-id', nodeId: 'practice-id', status: 'UNLOCKED' },
    });
    expect(mocks.dailyQuestCreate.mock.calls[0][0].data.resourceUrl).toBe('/practice/practice-id');
  });
});