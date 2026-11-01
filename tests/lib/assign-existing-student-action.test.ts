import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminId: vi.fn(),
  userFindFirst: vi.fn(),
  classroomFindFirst: vi.fn(),
  membershipFindUnique: vi.fn(),
  membershipCreate: vi.fn(),
  membershipUpdate: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/admin-auth', () => ({ requireAdminId: mocks.requireAdminId }));
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: { findFirst: mocks.userFindFirst },
    classroom: { findFirst: mocks.classroomFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { assignExistingStudentToClassroom } from '../../src/lib/assign-existing-student-action';

function makeForm(studentId = 'student-1', classroomId = 'classroom-1') {
  const form = new FormData();
  form.set('studentId', studentId);
  form.set('classroomId', classroomId);
  return form;
}

describe('assignExistingStudentToClassroom', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAdminId.mockResolvedValue('admin-1');
    mocks.userFindFirst.mockResolvedValue({ id: 'student-1' });
    mocks.classroomFindFirst.mockResolvedValue({ id: 'classroom-1' });
    mocks.membershipFindUnique.mockResolvedValue(null);
    mocks.membershipCreate.mockResolvedValue({ id: 'membership-1' });
    mocks.membershipUpdate.mockResolvedValue({ id: 'membership-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      classroomMembership: {
        findUnique: mocks.membershipFindUnique,
        create: mocks.membershipCreate,
        update: mocks.membershipUpdate,
      },
    }));
  });

  it('requires admin authorization when called directly', async () => {
    mocks.requireAdminId.mockRejectedValue(new Error('not an admin'));

    await expect(assignExistingStudentToClassroom({ status: 'idle', message: '' }, makeForm())).rejects.toThrow('not an admin');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects a classroom the admin cannot select as active', async () => {
    mocks.classroomFindFirst.mockResolvedValue(null);

    const result = await assignExistingStudentToClassroom({ status: 'idle', message: '' }, makeForm());

    expect(result).toEqual({ status: 'error', message: 'El aula no existe, no está activa o no tiene un profesor activo.' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('creates a new active membership for an existing student', async () => {
    const result = await assignExistingStudentToClassroom({ status: 'idle', message: '' }, makeForm());

    expect(result.status).toBe('success');
    expect(mocks.membershipCreate).toHaveBeenCalledWith({ data: { classroomId: 'classroom-1', userId: 'student-1', status: 'ACTIVE' } });
  });

  it('rejects an already active membership without duplicating it', async () => {
    mocks.membershipFindUnique.mockResolvedValue({ id: 'membership-existing', status: 'ACTIVE' });

    const result = await assignExistingStudentToClassroom({ status: 'idle', message: '' }, makeForm());

    expect(result).toEqual({ status: 'error', message: 'Este estudiante ya tiene una matrícula activa en esa aula.' });
    expect(mocks.membershipCreate).not.toHaveBeenCalled();
    expect(mocks.membershipUpdate).not.toHaveBeenCalled();
  });

  it('reactivates an existing inactive membership instead of duplicating it', async () => {
    mocks.membershipFindUnique.mockResolvedValue({ id: 'membership-existing', status: 'INACTIVE' });

    const result = await assignExistingStudentToClassroom({ status: 'idle', message: '' }, makeForm());

    expect(result.status).toBe('success');
    expect(mocks.membershipUpdate).toHaveBeenCalledWith({
      where: { id: 'membership-existing' },
      data: { status: 'ACTIVE', leftAt: null },
    });
    expect(mocks.membershipCreate).not.toHaveBeenCalled();
  });
});