'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../lib/prisma';
import { requireTeacherId } from '../../../../lib/teacher-auth';

export type ClassLessonFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  resetKey: number;
};

export async function recordClassLesson(
  classroomId: string,
  previousState: ClassLessonFormState,
  formData: FormData,
): Promise<ClassLessonFormState> {
  const teacherId = await requireTeacherId();
  const titleValue = formData.get('title');
  const taughtAtValue = formData.get('taughtAt');
  const notesValue = formData.get('notes');
  const improvementsValue = formData.get('improvements');
  const homeworkValue = formData.get('homework');
  const practiceNodeIdValue = formData.get('practiceNodeId');
  const virtualClassIdValue = formData.get('virtualClassId');
  const recipientMode = formData.get('recipientMode');
  const selectedStudentIds = formData.getAll('studentIds');

  if (
    typeof titleValue !== 'string' ||
    typeof taughtAtValue !== 'string' ||
    typeof notesValue !== 'string' ||
    typeof improvementsValue !== 'string' ||
    typeof homeworkValue !== 'string' ||
    (practiceNodeIdValue !== null && typeof practiceNodeIdValue !== 'string') ||
    (virtualClassIdValue !== null && typeof virtualClassIdValue !== 'string') ||
    (recipientMode !== 'CLASS' && recipientMode !== 'SELECTED')
  ) {
    return { status: 'error', message: 'Revisa los datos del registro.', resetKey: previousState.resetKey };
  }

  const title = titleValue.trim();
  const notes = notesValue.trim();
  const improvements = improvementsValue.trim();
  const homework = homeworkValue.trim();
  const practiceNodeId = practiceNodeIdValue?.trim() || null;
  if (!title || title.length > 120) {
    return { status: 'error', message: 'El título es obligatorio y admite hasta 120 caracteres.', resetKey: previousState.resetKey };
  }
  if (!notes || notes.length > 5000 || improvements.length > 3000 || homework.length > 3000) {
    return { status: 'error', message: 'Los apuntes son obligatorios. Apuntes: máximo 5000; mejoras y tareas: 3000 caracteres cada una.', resetKey: previousState.resetKey };
  }

  const taughtAtMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(taughtAtValue);
  let taughtAt = new Date(taughtAtValue);
  if (
    !taughtAtMatch ||
    Number.isNaN(taughtAt.getTime()) ||
    taughtAt.getFullYear() !== Number(taughtAtMatch[1]) ||
    taughtAt.getMonth() + 1 !== Number(taughtAtMatch[2]) ||
    taughtAt.getDate() !== Number(taughtAtMatch[3]) ||
    taughtAt.getHours() !== Number(taughtAtMatch[4]) ||
    taughtAt.getMinutes() !== Number(taughtAtMatch[5])
  ) {
    return { status: 'error', message: 'Indica una fecha y hora válidas.', resetKey: previousState.resetKey };
  }
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId, status: 'ACTIVE' },
    select: {
      id: true,
      memberships: {
        where: {
          status: 'ACTIVE',
          user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } },
        },
        select: { userId: true },
      },
    },
  });
  if (!classroom) {
    return { status: 'error', message: 'No tienes acceso a esta aula activa.', resetKey: previousState.resetKey };
  }

  const virtualClassId = typeof virtualClassIdValue === 'string' ? virtualClassIdValue.trim() : '';
  if (virtualClassId) {
    const completedClass = await prisma.virtualClass.findFirst({
      where: {
        id: virtualClassId,
        classroomId: classroom.id,
        status: 'COMPLETED',
        scheduledAt: { lte: new Date() },
        classroom: { is: { teacherId, status: 'ACTIVE' } },
      },
      select: { scheduledAt: true },
    });
    if (!completedClass) {
      return { status: 'error', message: 'La clase seleccionada ya no está disponible para seguimiento.', resetKey: previousState.resetKey };
    }
    taughtAt = completedClass.scheduledAt;
  }

  if (taughtAt > new Date()) {
    return { status: 'error', message: 'La fecha de una clase dictada no puede estar en el futuro.', resetKey: previousState.resetKey };
  }

  const activeStudentIds = classroom.memberships.map(({ userId }) => userId);
  const recipientIds = recipientMode === 'CLASS'
    ? activeStudentIds
    : [...new Set(selectedStudentIds.filter((value): value is string => typeof value === 'string'))];
  if (recipientIds.length === 0 || recipientIds.some((studentId) => !activeStudentIds.includes(studentId))) {
    return {
      status: 'error',
      message: recipientIds.length === 0 ? 'Selecciona al menos un estudiante destinatario.' : 'Uno o más destinatarios ya no pertenecen a esta aula activa.',
      resetKey: previousState.resetKey,
    };
  }

  if (practiceNodeId) {
    const practice = await prisma.skillNode.findUnique({ where: { id: practiceNodeId }, select: { id: true } });
    if (!practice) {
      return { status: 'error', message: 'La práctica seleccionada no existe.', resetKey: previousState.resetKey };
    }
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const existingLesson = await transaction.classLesson.findFirst({
        where: { classroomId: classroom.id, taughtAt },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, recipients: { select: { studentId: true } } },
      });
      const lessonData = {
          classroomId: classroom.id,
          title,
          taughtAt,
          notes,
          improvementOpportunities: improvements || null,
          homework: homework || null,
          practiceNodeId,
      };
      if (existingLesson) {
        await transaction.classLessonRecipient.deleteMany({ where: { classLessonId: existingLesson.id } });
        await transaction.classLesson.update({
          where: { id: existingLesson.id },
          data: { ...lessonData, recipients: { create: recipientIds.map((studentId) => ({ studentId })) } },
        });
      } else {
        await transaction.classLesson.create({
          data: {
            ...lessonData,
            recipients: { create: recipientIds.map((studentId) => ({ studentId })) },
          },
        });
      }

      if (practiceNodeId) {
        for (const studentId of recipientIds) {
          const progress = await transaction.userSkillProgress.findUnique({
            where: { userId_nodeId: { userId: studentId, nodeId: practiceNodeId } },
            select: { id: true, status: true },
          });
          if (progress?.status === 'COMPLETED') continue;
          if (progress) {
            await transaction.userSkillProgress.update({ where: { id: progress.id }, data: { status: 'UNLOCKED' } });
          } else {
            await transaction.userSkillProgress.create({ data: { userId: studentId, nodeId: practiceNodeId, status: 'UNLOCKED' } });
          }
        }
      }

      for (const studentId of recipientIds) {
        await transaction.notification.create({
          data: {
            userId: studentId,
            title: 'Seguimiento de clase actualizado',
            message: `Tu profesor compartió o actualizó los apuntes de “${title}”.`,
            href: `/student/classrooms/${classroom.id}`,
          },
        });
      }
    });
  } catch {
    return { status: 'error', message: 'No se pudo guardar el registro. Inténtalo de nuevo.', resetKey: previousState.resetKey };
  }

  revalidatePath(`/teacher/classrooms/${classroom.id}`);
  revalidatePath('/teacher');
  revalidatePath('/teacher/history');
  revalidatePath('/');
  revalidatePath('/student/history');
  revalidatePath(`/student/classrooms/${classroom.id}`);
  for (const studentId of recipientIds) revalidatePath(`/teacher/classrooms/${classroom.id}/students/${studentId}`);

  return { status: 'success', message: 'Registro de clase guardado y compartido con los destinatarios.', resetKey: previousState.resetKey + 1 };
}