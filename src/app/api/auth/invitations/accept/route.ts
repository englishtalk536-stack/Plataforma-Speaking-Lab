import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../../lib/prisma';

type AcceptanceError = 'invalid' | 'used' | 'expired' | 'duplicate' | 'classroom';

function errorResponse(error: AcceptanceError) {
  const messages: Record<AcceptanceError, string> = {
    invalid: 'La invitación no es válida.',
    used: 'Esta invitación ya fue utilizada.',
    expired: 'La invitación expiró. Solicita una nueva al administrador.',
    duplicate: 'Ya existe una cuenta con ese correo electrónico.',
    classroom: 'El aula de la invitación ya no está disponible.',
  };
  const statuses: Record<AcceptanceError, number> = {
    invalid: 404,
    used: 409,
    expired: 410,
    duplicate: 409,
    classroom: 409,
  };
  return NextResponse.json({ error: messages[error] }, { status: statuses[error] });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return NextResponse.json({ error: 'No disponible.' }, { status: 404 });

  let body: { token?: unknown; password?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: 'Revisa los datos enviados.' }, { status: 400 });
    }
    body = parsed as { token?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: 'Revisa los datos enviados.' }, { status: 400 });
  }

  if (typeof body.token !== 'string' || body.token.length < 40 || typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
    return NextResponse.json({ error: 'El enlace o la contraseña no son válidos. La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(body.token).digest('hex');
  const passwordHash = await bcrypt.hash(body.password, 12);
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const invitation = await transaction.accountInvitation.findUnique({ where: { tokenHash } });
      if (!invitation) return { error: 'invalid' as const };
      if (invitation.usedAt) return { error: 'used' as const };
      if (invitation.expiresAt <= now) return { error: 'expired' as const };
      if (invitation.role !== Role.TEACHER && invitation.role !== Role.STUDENT) return { error: 'invalid' as const };

      if (await transaction.user.findUnique({ where: { email: invitation.email }, select: { id: true } })) {
        return { error: 'duplicate' as const };
      }

      if (invitation.role === Role.STUDENT) {
        if (invitation.classroomId && !await transaction.classroom.findFirst({
          where: { id: invitation.classroomId, status: 'ACTIVE' },
          select: { id: true },
        })) return { error: 'classroom' as const };
      }

      const claim = await transaction.accountInvitation.updateMany({
        where: { id: invitation.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claim.count !== 1) return { error: 'used' as const };

      const user = await transaction.user.create({
        data: {
          fullName: invitation.fullName,
          email: invitation.email,
          passwordHash,
          role: invitation.role,
        },
        select: { id: true, role: true },
      });

      if (invitation.role === Role.STUDENT && invitation.classroomId) {
        await transaction.classroomMembership.create({
          data: { userId: user.id, classroomId: invitation.classroomId, status: 'ACTIVE' },
        });
      }

      return { user };
    });

    if ('error' in result && result.error) return errorResponse(result.error);
    if (!('user' in result)) return NextResponse.json({ error: 'No se pudo aceptar la invitación.' }, { status: 500 });
    return NextResponse.json({ accepted: true, role: result.user.role });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return errorResponse('duplicate');
    }
    console.error('POST /api/auth/invitations/accept failed:', error);
    return NextResponse.json({ error: 'No se pudo aceptar la invitación. Inténtalo de nuevo.' }, { status: 500 });
  }
}