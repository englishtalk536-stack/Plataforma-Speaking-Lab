import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireStudentId: vi.fn(),
  membershipFindFirst: vi.fn(),
  activityFindFirst: vi.fn(),
  transaction: vi.fn(),
  submissionFindUnique: vi.fn(),
  submissionCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/student-auth', () => ({ requireStudentId: mocks.requireStudentId }));
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    classroomMembership: { findFirst: mocks.membershipFindFirst },
    writtenActivity: { findFirst: mocks.activityFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { saveActivitySubmission } from '../../src/app/student/classrooms/[classroomId]/actions';

function responseForm(responseText: string) {
  const form = new FormData();
  form.set('responseText', responseText);
  return form;
}

describe('saveActivitySubmission', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireStudentId.mockResolvedValue('student-id');
    mocks.membershipFindFirst.mockResolvedValue({ id: 'membership-id' });
    mocks.activityFindFirst.mockResolvedValue({ id: 'activity-id' });
    mocks.submissionFindUnique.mockResolvedValue(null);
    mocks.submissionCreate.mockResolvedValue({ id: 'submission-id' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      activitySubmission: { findUnique: mocks.submissionFindUnique, create: mocks.submissionCreate },
    }));
  });

  it('creates the first submission', async () => {
    const result = await saveActivitySubmission('classroom-id', 'activity-id', { status: 'idle', message: '' }, responseForm('First response'));

    expect(result).toEqual({ status: 'success', message: 'Respuesta guardada correctamente. La entrega ya no se puede editar.' });
    expect(mocks.submissionCreate).toHaveBeenCalledWith({ data: {
      activityId: 'activity-id', studentId: 'student-id', responseText: 'First response',
    } });
  });

  it('rejects a later edit and leaves the existing submission untouched', async () => {
    mocks.submissionFindUnique.mockResolvedValue({ id: 'existing-submission' });

    const result = await saveActivitySubmission('classroom-id', 'activity-id', { status: 'idle', message: '' }, responseForm('Changed response'));

    expect(result).toEqual({ status: 'error', message: 'Esta actividad ya fue entregada y no se puede editar.' });
    expect(mocks.submissionCreate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a concurrent duplicate submission without overwriting it', async () => {
    mocks.submissionFindUnique.mockResolvedValue(null);
    mocks.submissionCreate.mockRejectedValue({ code: 'P2002' });

    const result = await saveActivitySubmission('classroom-id', 'activity-id', { status: 'idle', message: '' }, responseForm('Duplicate response'));

    expect(result).toEqual({ status: 'error', message: 'Esta actividad ya fue entregada y no se puede editar.' });
  });
});