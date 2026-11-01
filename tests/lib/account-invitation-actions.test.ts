import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminId: vi.fn(),
  classroomFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  invitationFindFirst: vi.fn(),
  invitationCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/admin-auth', () => ({ requireAdminId: mocks.requireAdminId }));
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    classroom: { findFirst: mocks.classroomFindFirst },
    user: { findUnique: mocks.userFindUnique },
    accountInvitation: { findFirst: mocks.invitationFindFirst, create: mocks.invitationCreate },
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { createAccountInvitation } from '../../src/lib/account-invitation-actions';

function formData(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

describe('createAccountInvitation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
    mocks.requireAdminId.mockResolvedValue('admin-id');
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.invitationFindFirst.mockResolvedValue(null);
    mocks.invitationCreate.mockResolvedValue({ id: 'invitation-id' });
    mocks.classroomFindFirst.mockResolvedValue({ id: 'classroom-id' });
  });

  it('requires admin authorization even when invoked directly', async () => {
    mocks.requireAdminId.mockRejectedValue(new Error('not an admin'));

    await expect(createAccountInvitation('TEACHER', formData({ fullName: 'Test Teacher', email: 'teacher@example.test' })))
      .rejects.toThrow('not an admin');
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it('never permits an ADMIN invitation role', async () => {
    const result = await createAccountInvitation('ADMIN', formData({ fullName: 'Test Admin', email: 'admin@example.test' }));

    expect(result).toEqual({ ok: false, message: 'El rol de invitación no es válido.' });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects an existing account with a clear duplicate message', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'existing-id' });

    const result = await createAccountInvitation('TEACHER', formData({ fullName: 'Test Teacher', email: 'EXISTING@example.test' }));

    expect(result).toEqual({ ok: false, message: 'Ya existe una cuenta con ese correo electrónico.' });
    expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { email: 'existing@example.test' }, select: { id: true } });
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects a student invitation for an unavailable classroom', async () => {
    mocks.classroomFindFirst.mockResolvedValue(null);

    const result = await createAccountInvitation('STUDENT', formData({
      fullName: 'Test Student', email: 'student@example.test', classroomId: 'unauthorized-classroom',
    }));

    expect(result).toEqual({ ok: false, message: 'No tienes permisos para invitar a esa aula o ya no está activa.' });
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it('stores only the token hash and creates teacher invitations without a classroom', async () => {
    const result = await createAccountInvitation('TEACHER', formData({ fullName: 'Test Teacher', email: 'teacher@example.test' }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const stored = mocks.invitationCreate.mock.calls[0][0].data;
    expect(stored.role).toBe('TEACHER');
    expect(stored.classroomId).toBeNull();
    expect(stored.createdById).toBe('admin-id');
    expect(stored.tokenHash).not.toBe(result.token);
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.token).toHaveLength(43);
    expect(result.expiresAt).toBeTruthy();
  });

  it('creates a student invitation without requiring a classroom', async () => {
    const result = await createAccountInvitation('STUDENT', formData({ fullName: 'Test Student', email: 'student@example.test' }));

    expect(result.ok).toBe(true);
    expect(mocks.classroomFindFirst).not.toHaveBeenCalled();
    expect(mocks.invitationCreate.mock.calls[0][0].data).toMatchObject({ role: 'STUDENT', classroomId: null });
  });

  it('rejects a second pending invitation for the same email', async () => {
    mocks.invitationFindFirst.mockResolvedValue({ id: 'pending-invitation' });

    const result = await createAccountInvitation('STUDENT', formData({
      fullName: 'Test Student', email: 'student@example.test', classroomId: 'classroom-id',
    }));

    expect(result).toEqual({ ok: false, message: 'Ya hay una invitación pendiente para ese correo electrónico.' });
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });
});