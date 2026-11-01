'use server';

import { EnglishLevel } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../../../lib/prisma';
import { requireTeacherId } from '../../../../../../lib/teacher-auth';

export type UpdateStudentEnglishLevelResult =
  | { ok: true; previousLevel: EnglishLevel | null; newLevel: EnglishLevel }
  | { ok: false; message: string };

const validLevels = new Set<string>(Object.values(EnglishLevel));
const MAX_REASON_LENGTH = 500;

export async function updateStudentEnglishLevel(
  classroomId: string,
  studentId: string,
  formData: FormData,
): Promise<UpdateStudentEnglishLevelResult> {
  const teacherId = await requireTeacherId();

  const rawLevel = formData.get('englishLevel');
  const rawReason = formData.get('reason');
  if (typeof rawLevel !== 'string' || !validLevels.has(rawLevel)) {
    return { ok: false, message: 'Selecciona un nivel de inglés válido.' };
  }
  if (rawReason !== null && typeof rawReason !== 'string') {
    return { ok: false, message: 'Revisa el motivo del cambio.' };
  }

  const newLevel = rawLevel as EnglishLevel;
  const reason = typeof rawReason === 'string' ? rawReason.trim() : '';
  if (reason.length > MAX_REASON_LENGTH) {
    return { ok: false, message: `El motivo no puede superar ${MAX_REASON_LENGTH} caracteres.` };
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const membership = await transaction.classroomMembership.findFirst({
        where: {
          classroomId,
          userId: studentId,
          status: 'ACTIVE',
          classroom: { is: { teacherId, status: 'ACTIVE' } },
          user: { is: { role: 'STUDENT' } },
        },
        select: { id: true, englishLevel: true },
      });

      if (!membership) return null;

      await transaction.classroomMembership.update({
        where: { id: membership.id },
        data: { englishLevel: newLevel },
      });
      await transaction.studentEnglishLevelChange.create({
        data: {
          membershipId: membership.id,
          previousLevel: membership.englishLevel,
          newLevel,
          changedByTeacherId: teacherId,
          reason: reason || null,
        },
      });

      return { previousLevel: membership.englishLevel, newLevel };
    });

    if (!result) return { ok: false, message: 'No tienes acceso a una membresía activa de este estudiante en el aula.' };

    revalidatePath(`/teacher/classrooms/${classroomId}/students/${studentId}`);
    return { ok: true, ...result };
  } catch (error) {
    console.error('updateStudentEnglishLevel failed:', error);
    return { ok: false, message: 'No se pudo guardar el nivel. Inténtalo de nuevo.' };
  }
}
