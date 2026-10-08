'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../lib/prisma';
import { requireTeacherId } from '../../../../lib/teacher-auth';

export type ActivityFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  resetKey: number;
};

export async function createWrittenActivity(
  classroomId: string,
  _previousState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const teacherId = await requireTeacherId();
  const titleValue = formData.get('title');
  const promptValue = formData.get('prompt');

  if (typeof titleValue !== 'string' || typeof promptValue !== 'string') {
    return { status: 'error', message: 'Completa el título y la consigna.', resetKey: _previousState.resetKey };
  }

  const title = titleValue.trim();
  const prompt = promptValue.trim();

  if (!title) return { status: 'error', message: 'El título es obligatorio.', resetKey: _previousState.resetKey };
  if (title.length > 120) {
    return { status: 'error', message: 'El título no puede superar 120 caracteres.', resetKey: _previousState.resetKey };
  }
  if (!prompt) return { status: 'error', message: 'La consigna es obligatoria.', resetKey: _previousState.resetKey };
  if (prompt.length > 2000) {
    return { status: 'error', message: 'La consigna no puede superar 2000 caracteres.', resetKey: _previousState.resetKey };
  }

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId, status: 'ACTIVE' },
    select: { id: true },
  });

  if (!classroom) {
    return { status: 'error', message: 'No se pudo guardar la actividad en esta aula.', resetKey: _previousState.resetKey };
  }

  try {
    await prisma.writtenActivity.create({
      data: {
        classroomId: classroom.id,
        title,
        prompt,
      },
    });
  } catch {
    return {
      status: 'error',
      message: 'No se pudo guardar la actividad. Inténtalo de nuevo.',
      resetKey: _previousState.resetKey,
    };
  }

  revalidatePath(`/teacher/classrooms/${classroom.id}`);
  return {
    status: 'success',
    message: 'Actividad guardada correctamente.',
    resetKey: _previousState.resetKey + 1,
  };
}