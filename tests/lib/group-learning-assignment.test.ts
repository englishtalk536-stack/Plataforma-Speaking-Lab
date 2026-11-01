import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireTeacherId: vi.fn(),
  classroomFindFirst: vi.fn(),
  skillNodeFindUnique: vi.fn(),
  missionFindFirst: vi.fn(),
  transaction: vi.fn(),
  progressFindUnique: vi.fn(),
  progressUpsert: vi.fn(),
  userDailyQuestFindUnique: vi.fn(),
  userDailyQuestCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/teacher-auth', () => ({ requireTeacherId: mocks.requireTeacherId }));
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    classroom: { findFirst: mocks.classroomFindFirst },
    skillNode: { findUnique: mocks.skillNodeFindUnique },
    dailyQuest: { findFirst: mocks.missionFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { assignLearningToGroup } from '../../src/app/teacher/classrooms/[classroomId]/group-assignment-actions';

function form(item: string, studentIds: string[]) {
  const data = new FormData();
  data.set('learningItem', item);
  for (const studentId of studentIds) data.append('studentIds', studentId);
  return data;
}

describe('assignLearningToGroup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireTeacherId.mockResolvedValue('teacher-id');
    mocks.classroomFindFirst.mockResolvedValue({ id: 'classroom-id', memberships: [{ userId: 'student-a' }, { userId: 'student-b' }] });
    mocks.skillNodeFindUnique.mockResolvedValue({ id: 'practice-id', title: 'Practice' });
    mocks.missionFindFirst.mockResolvedValue({ id: 'mission-id', title: 'Mission' });
    mocks.progressFindUnique.mockResolvedValue(null);
    mocks.progressUpsert.mockResolvedValue({ id: 'progress-id' });
    mocks.userDailyQuestFindUnique.mockResolvedValue(null);
    mocks.userDailyQuestCreate.mockResolvedValue({ id: 'assignment-id' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      userSkillProgress: { findUnique: mocks.progressFindUnique, upsert: mocks.progressUpsert },
      userDailyQuest: { findUnique: mocks.userDailyQuestFindUnique, create: mocks.userDailyQuestCreate },
    }));
  });

  it('requires teacher authorization when invoked directly', async () => {
    mocks.requireTeacherId.mockRejectedValue(new Error('not a teacher'));
    await expect(assignLearningToGroup('classroom-id', { status: 'idle', message: '' }, form('MISSION:mission-id', ['student-a'])))
      .rejects.toThrow('not a teacher');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects students who are not active members of the teacher classroom', async () => {
    const result = await assignLearningToGroup('classroom-id', { status: 'idle', message: '' }, form('MISSION:mission-id', ['outside-student']));
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/no pertenecen activamente/);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('assigns an existing mission to each selected group member and skips duplicates', async () => {
    mocks.userDailyQuestFindUnique.mockImplementation(({ where }) => Promise.resolve(
      where.userId_questId_assignedDate.userId === 'student-a' ? { id: 'already-assigned' } : null,
    ));

    const result = await assignLearningToGroup('classroom-id', { status: 'idle', message: '' }, form('MISSION:mission-id', ['student-a', 'student-b']));

    expect(result).toEqual({ status: 'success', message: 'Mission: asignada a 1; ya estaba asignada hoy a 1.' });
    expect(mocks.userDailyQuestCreate).toHaveBeenCalledTimes(1);
    expect(mocks.progressUpsert).not.toHaveBeenCalled();
  });

  it('unlocks a selected practice for every selected non-completed student', async () => {
    const result = await assignLearningToGroup('classroom-id', { status: 'idle', message: '' }, form('PRACTICE:practice-id', ['student-a', 'student-b']));
    expect(result.status).toBe('success');
    expect(result.message).toContain('asignada a 2');
    expect(mocks.progressUpsert).toHaveBeenCalledTimes(2);
  });

  it('rejects a completed practice instead of resetting its progress', async () => {
    mocks.progressFindUnique.mockResolvedValue({ status: 'COMPLETED' });
    const result = await assignLearningToGroup('classroom-id', { status: 'idle', message: '' }, form('PRACTICE:practice-id', ['student-a']));
    expect(result.status).toBe('success');
    expect(result.message).toContain('ya completada por 1');
    expect(mocks.progressUpsert).not.toHaveBeenCalled();
  });
});