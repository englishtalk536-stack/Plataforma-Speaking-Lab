import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireTeacherId: vi.fn(),
  membershipFindFirst: vi.fn(),
  dailyQuestFindFirst: vi.fn(),
  assignmentFindUnique: vi.fn(),
  assignmentCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/teacher-auth', () => ({ requireTeacherId: mocks.requireTeacherId }));
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    classroomMembership: { findFirst: mocks.membershipFindFirst },
    dailyQuest: { findFirst: mocks.dailyQuestFindFirst },
    userDailyQuest: { findUnique: mocks.assignmentFindUnique, create: mocks.assignmentCreate },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { assignDailyQuest } from '../../src/app/teacher/classrooms/[classroomId]/students/[studentId]/actions';

function missionForm(questId = 'quest-id') {
  const formData = new FormData();
  formData.set('questId', questId);
  return formData;
}

describe('assignDailyQuest', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireTeacherId.mockResolvedValue('teacher-id');
    mocks.membershipFindFirst.mockResolvedValue({ id: 'membership-id' });
    mocks.dailyQuestFindFirst.mockResolvedValue({ id: 'quest-id' });
    mocks.assignmentFindUnique.mockResolvedValue(null);
    mocks.assignmentCreate.mockResolvedValue({ id: 'daily-assignment-id' });
  });

  it('requires a teacher session even when the action is called directly', async () => {
    mocks.requireTeacherId.mockRejectedValue(new Error('not a teacher'));

    await expect(assignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, missionForm()))
      .rejects.toThrow('not a teacher');
    expect(mocks.assignmentCreate).not.toHaveBeenCalled();
  });

  it('rejects a student outside the teacher-owned active classroom', async () => {
    mocks.membershipFindFirst.mockResolvedValue(null);

    const result = await assignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, missionForm());

    expect(result).toEqual({ status: 'error', message: 'No tienes acceso a este estudiante.' });
    expect(mocks.assignmentCreate).not.toHaveBeenCalled();
  });

  it('rejects a mission that is not active', async () => {
    mocks.dailyQuestFindFirst.mockResolvedValue(null);

    const result = await assignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, missionForm());

    expect(result).toEqual({ status: 'error', message: 'La misión no existe o ya no está disponible.' });
    expect(mocks.assignmentCreate).not.toHaveBeenCalled();
  });

  it('creates a pending assignment for the current UTC day', async () => {
    const result = await assignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, missionForm());

    expect(result).toEqual({ status: 'success', message: 'Misión asignada para hoy.' });
    const data = mocks.assignmentCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({ userId: 'student-id', questId: 'quest-id', status: 'PENDING' });
    expect(data.assignedDate.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it('rejects duplicate assignment for today', async () => {
    mocks.assignmentFindUnique.mockResolvedValue({ id: 'existing-assignment' });

    const result = await assignDailyQuest('classroom-id', 'student-id', { status: 'idle', message: '' }, missionForm());

    expect(result).toEqual({ status: 'error', message: 'Esta misión ya está asignada para hoy.' });
    expect(mocks.assignmentCreate).not.toHaveBeenCalled();
  });
});