'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../lib/prisma';
import { requireTeacherId } from '../../../../lib/teacher-auth';

export type GradeFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function gradeActivitySubmission(
  classroomId: string,
  submissionId: string,
  _previousState: GradeFormState,
  formData: FormData,
): Promise<GradeFormState> {
  const teacherId = await requireTeacherId();
  const rawScore = formData.get('score');
  const score = typeof rawScore === 'string' ? Number(rawScore) : Number.NaN;

  if (!Number.isInteger(score) || score < 1 || score > 20) {
    return { status: 'error', message: 'La calificación debe ser un número entero entre 1 y 20.' };
  }

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId, status: 'ACTIVE' },
    select: { id: true },
  });

  if (!classroom) return { status: 'error', message: 'No tienes acceso a esta aula.' };

  const submission = await prisma.activitySubmission.findFirst({
    where: {
      id: submissionId,
      activity: { is: { classroomId: classroom.id } },
    },
    select: { id: true },
  });

  if (!submission) return { status: 'error', message: 'No se encontró esta respuesta en el aula.' };

  try {
    await prisma.submissionFeedback.upsert({
      where: { submissionId: submission.id },
      update: { score, teacherId },
      create: {
        submissionId: submission.id,
        teacherId,
        score,
        comment: '',
      },
    });
  } catch {
    return { status: 'error', message: 'No se pudo guardar la calificación. Inténtalo de nuevo.' };
  }

  revalidatePath(`/teacher/classrooms/${classroom.id}`);
  revalidatePath(`/student/classrooms/${classroom.id}`);
  return { status: 'success', message: 'Calificación guardada.' };
}