'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../lib/prisma';
import { requireStudentId } from '../../../../lib/student-auth';

export type SubmissionFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function saveActivitySubmission(
  classroomId: string,
  activityId: string,
  _previousState: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  const studentId = await requireStudentId();
  const responseValue = formData.get('responseText');

  if (typeof responseValue !== 'string') {
    return { status: 'error', message: 'Escribe tu respuesta antes de guardarla.' };
  }

  const responseText = responseValue.trim();
  if (!responseText) return { status: 'error', message: 'La respuesta no puede estar vacía.' };
  if (responseText.length > 5000) {
    return { status: 'error', message: 'La respuesta no puede superar 5000 caracteres.' };
  }

  const membership = await prisma.classroomMembership.findFirst({
    where: {
      classroomId,
      userId: studentId,
      status: 'ACTIVE',
      classroom: { is: { status: 'ACTIVE' } },
    },
    select: { id: true },
  });

  if (!membership) return { status: 'error', message: 'No tienes acceso activo a esta aula.' };

  const activity = await prisma.writtenActivity.findFirst({
    where: { id: activityId, classroomId },
    select: { id: true },
  });

  if (!activity) return { status: 'error', message: 'No se encontró esta actividad en el aula.' };

  try {
    const created = await prisma.$transaction(async (transaction) => {
      const existingSubmission = await transaction.activitySubmission.findUnique({
        where: {
          activityId_studentId: {
            activityId: activity.id,
            studentId,
          },
        },
        select: { id: true },
      });

      if (existingSubmission) return false;

      await transaction.activitySubmission.create({
        data: {
          activityId: activity.id,
          studentId,
          responseText,
        },
      });

      return true;
    });

    if (!created) {
      return { status: 'error', message: 'Esta actividad ya fue entregada y no se puede editar.' };
    }

    revalidatePath(`/student/classrooms/${classroomId}`);
    return { status: 'success', message: 'Respuesta guardada correctamente. La entrega ya no se puede editar.' };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { status: 'error', message: 'Esta actividad ya fue entregada y no se puede editar.' };
    }
    return { status: 'error', message: 'No se pudo guardar la respuesta. Inténtalo de nuevo.' };
  }
}