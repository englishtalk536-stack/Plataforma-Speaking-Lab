'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { requireAdminId } from './admin-auth';
import { prisma } from './prisma';

export type AccountInvitationResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; message: string };

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createAccountInvitation(
  requestedRole: string,
  formData: FormData,
): Promise<AccountInvitationResult> {
  const adminId = await requireAdminId();

  if (process.env.NODE_ENV !== 'development') {
    return { ok: false, message: 'Las invitaciones con enlace manual solo están disponibles en desarrollo.' };
  }
  if (requestedRole !== Role.TEACHER && requestedRole !== Role.STUDENT) {
    return { ok: false, message: 'El rol de invitación no es válido.' };
  }

  const fullName = formData.get('fullName');
  const rawEmail = formData.get('email');
  const rawClassroomId = formData.get('classroomId');
  if (typeof fullName !== 'string' || typeof rawEmail !== 'string' || (rawClassroomId !== null && typeof rawClassroomId !== 'string')) {
    return { ok: false, message: 'Revisa los datos de la invitación.' };
  }

  const name = fullName.trim();
  const email = rawEmail.trim().toLowerCase();
  const classroomId = requestedRole === Role.STUDENT && typeof rawClassroomId === 'string' && rawClassroomId.trim()
    ? rawClassroomId.trim()
    : null;
  if (name.length < 2 || name.length > 120 || !validEmail.test(email) || email.length > 254) {
    return { ok: false, message: 'Introduce un nombre válido y un correo electrónico válido.' };
  }
  if (requestedRole === Role.TEACHER && typeof rawClassroomId === 'string' && rawClassroomId.trim()) {
    return { ok: false, message: 'La invitación de profesor no debe incluir un aula.' };
  }

  if (classroomId) {
    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!classroom) return { ok: false, message: 'No tienes permisos para invitar a esa aula o ya no está activa.' };
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) return { ok: false, message: 'Ya existe una cuenta con ese correo electrónico.' };

  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const duplicateInvitation = await prisma.accountInvitation.findFirst({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (duplicateInvitation) return { ok: false, message: 'Ya hay una invitación pendiente para ese correo electrónico.' };

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.accountInvitation.create({
    data: {
      tokenHash,
      email,
      fullName: name,
      role: requestedRole,
      classroomId,
      createdById: adminId,
      expiresAt,
    },
  });

  revalidatePath('/admin');
  return { ok: true, token, expiresAt: expiresAt.toISOString() };
}