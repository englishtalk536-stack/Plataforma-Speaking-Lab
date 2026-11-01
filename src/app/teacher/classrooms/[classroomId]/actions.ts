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

export type VirtualClassFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  resetKey: number;
};

export async function createVirtualClass(
  classroomId: string,
  previousState: VirtualClassFormState,
  formData: FormData,
): Promise<VirtualClassFormState> {
  const teacherId = await requireTeacherId();
  const titleValue = formData.get('title');
  const scheduledAtValue = formData.get('scheduledAt');
  const joinUrlValue = formData.get('joinUrl');

  if (
    typeof titleValue !== 'string' ||
    typeof scheduledAtValue !== 'string' ||
    typeof joinUrlValue !== 'string'
  ) {
    return { status: 'error', message: 'Completa el título, la fecha, la hora y el enlace.', resetKey: previousState.resetKey };
  }

  const title = titleValue.trim();
  const joinUrlText = joinUrlValue.trim();
  if (!title) {
    return { status: 'error', message: 'El título es obligatorio.', resetKey: previousState.resetKey };
  }
  if (title.length > 120) {
    return { status: 'error', message: 'El título no puede superar 120 caracteres.', resetKey: previousState.resetKey };
  }

  const scheduledAtMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(scheduledAtValue);
  const scheduledAt = new Date(scheduledAtValue);
  if (
    !scheduledAtMatch ||
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt.getFullYear() !== Number(scheduledAtMatch[1]) ||
    scheduledAt.getMonth() + 1 !== Number(scheduledAtMatch[2]) ||
    scheduledAt.getDate() !== Number(scheduledAtMatch[3]) ||
    scheduledAt.getHours() !== Number(scheduledAtMatch[4]) ||
    scheduledAt.getMinutes() !== Number(scheduledAtMatch[5])
  ) {
    return { status: 'error', message: 'Indica una fecha y hora válidas.', resetKey: previousState.resetKey };
  }

  let joinUrl: URL;
  try {
    joinUrl = new URL(joinUrlText);
  } catch {
    return { status: 'error', message: 'Indica un enlace HTTPS válido.', resetKey: previousState.resetKey };
  }
  if (joinUrl.protocol !== 'https:' || !joinUrl.hostname) {
    return { status: 'error', message: 'El enlace debe ser una URL HTTPS válida.', resetKey: previousState.resetKey };
  }

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId, status: 'ACTIVE' },
    select: {
      id: true,
      memberships: {
        where: { status: 'ACTIVE', user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } } },
        select: { userId: true },
      },
    },
  });

  if (!classroom) {
    return {
      status: 'error',
      message: 'No se pudo guardar la clase virtual en esta aula.',
      resetKey: previousState.resetKey,
    };
  }

  try {
    await prisma.virtualClass.create({
      data: {
        classroomId: classroom.id,
        title,
        joinUrl: joinUrl.toString(),
        scheduledAt,
        status: 'SCHEDULED',
        attendances: { create: classroom.memberships.map(({ userId }) => ({ studentId: userId })) },
      },
    });
  } catch {
    return {
      status: 'error',
      message: 'No se pudo guardar la clase virtual. Inténtalo de nuevo.',
      resetKey: previousState.resetKey,
    };
  }

  revalidatePath(`/teacher/classrooms/${classroom.id}`);
  return {
    status: 'success',
    message: 'Clase virtual programada correctamente.',
    resetKey: previousState.resetKey + 1,
  };
}

export async function markVirtualClassTaught(
  classroomId: string,
  virtualClassId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  const teacherId = await requireTeacherId();
  const virtualClass = await prisma.virtualClass.findFirst({
    where: {
      id: virtualClassId,
      classroomId,
      status: 'SCHEDULED',
      scheduledAt: { lte: new Date() },
      classroom: { is: { teacherId, status: 'ACTIVE' } },
    },
    select: {
      id: true,
      classroom: {
        select: {
          memberships: {
            where: { status: 'ACTIVE', user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } } },
            select: { userId: true },
          },
        },
      },
    },
  });
  if (!virtualClass) return;

  await prisma.$transaction(async (transaction) => {
    for (const { userId } of virtualClass.classroom.memberships) {
      await transaction.virtualClassAttendance.upsert({
        where: { virtualClassId_studentId: { virtualClassId: virtualClass.id, studentId: userId } },
        update: {},
        create: { virtualClassId: virtualClass.id, studentId: userId },
      });
    }
    await transaction.virtualClass.updateMany({
      where: { id: virtualClass.id, classroomId, status: 'SCHEDULED' },
      data: { status: 'COMPLETED' },
    });
  });

  revalidatePath('/teacher');
  revalidatePath('/teacher/history');
  revalidatePath(`/teacher/classrooms/${classroomId}`);
  revalidatePath('/');
  revalidatePath('/student/history');
  revalidatePath(`/student/classrooms/${classroomId}`);
}

export type RescheduleVirtualClassState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  resetKey: number;
};

export async function rescheduleVirtualClass(
  classroomId: string,
  virtualClassId: string,
  previousState: RescheduleVirtualClassState,
  formData: FormData,
): Promise<RescheduleVirtualClassState> {
  const teacherId = await requireTeacherId();
  const scheduledAtValue = formData.get('scheduledAt');
  const timeZoneOffsetValue = formData.get('timeZoneOffset');
  const match = typeof scheduledAtValue === 'string'
    ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(scheduledAtValue)
    : null;
  const timeZoneOffset = typeof timeZoneOffsetValue === 'string' ? Number(timeZoneOffsetValue) : Number.NaN;

  if (!match || !Number.isInteger(timeZoneOffset) || Math.abs(timeZoneOffset) > 14 * 60) {
    return { status: 'error', message: 'Indica una fecha y hora válidas.', resetKey: previousState.resetKey };
  }

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const localDateAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    localDateAsUtc.getUTCFullYear() !== year ||
    localDateAsUtc.getUTCMonth() + 1 !== month ||
    localDateAsUtc.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return { status: 'error', message: 'Indica una fecha y hora válidas.', resetKey: previousState.resetKey };
  }

  const scheduledAt = new Date(localDateAsUtc.getTime() + timeZoneOffset * 60_000);
  if (scheduledAt <= new Date()) {
    return { status: 'error', message: 'La nueva fecha y hora deben estar en el futuro.', resetKey: previousState.resetKey };
  }

  const virtualClass = await prisma.virtualClass.findFirst({
    where: {
      id: virtualClassId,
      classroomId,
      status: 'SCHEDULED',
      classroom: { is: { teacherId, status: 'ACTIVE' } },
    },
    select: { id: true },
  });
  if (!virtualClass) {
    return { status: 'error', message: 'Solo puedes cambiar la fecha de una clase programada en tu aula activa.', resetKey: previousState.resetKey };
  }

  try {
    await prisma.virtualClass.update({ where: { id: virtualClass.id }, data: { scheduledAt } });
  } catch {
    return { status: 'error', message: 'No se pudo cambiar la fecha. Inténtalo de nuevo.', resetKey: previousState.resetKey };
  }

  revalidatePath('/teacher');
  revalidatePath(`/teacher/classrooms/${classroomId}`);
  revalidatePath('/');
  revalidatePath(`/student/classrooms/${classroomId}`);

  return { status: 'success', message: 'Fecha y hora actualizadas.', resetKey: previousState.resetKey + 1 };
}

export async function validateVirtualClassAttendance(
  classroomId: string,
  virtualClassId: string,
  studentId: string,
  attendanceStatus: 'ATTENDED' | 'ABSENT',
  _formData: FormData,
): Promise<void> {
  void _formData;
  const teacherId = await requireTeacherId();
  if (attendanceStatus !== 'ATTENDED' && attendanceStatus !== 'ABSENT') return;

  const attendance = await prisma.virtualClassAttendance.findFirst({
    where: {
      virtualClassId,
      studentId,
      virtualClass: {
        is: {
          classroomId,
          status: 'COMPLETED',
          classroom: { is: { teacherId, status: 'ACTIVE' } },
        },
      },
    },
    select: { id: true },
  });
  if (!attendance) return;

  await prisma.virtualClassAttendance.update({
    where: { id: attendance.id },
    data: { status: attendanceStatus, validatedByTeacherId: teacherId, validatedAt: new Date() },
  });

  revalidatePath('/teacher');
  revalidatePath('/teacher/history');
  revalidatePath(`/teacher/classrooms/${classroomId}`);
  revalidatePath('/');
  revalidatePath('/student/history');
  revalidatePath(`/student/classrooms/${classroomId}`);
}

export type RenameClassroomState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function renameClassroom(
  classroomId: string,
  _previousState: RenameClassroomState,
  formData: FormData,
): Promise<RenameClassroomState> {
  const teacherId = await requireTeacherId();
  const nameValue = formData.get('name');
  if (typeof nameValue !== 'string') {
    return { status: 'error', message: 'Escribe un nombre para el aula.' };
  }

  const name = nameValue.trim();
  if (name.length < 2 || name.length > 80) {
    return { status: 'error', message: 'El nombre debe tener entre 2 y 80 caracteres.' };
  }

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!classroom) {
    return { status: 'error', message: 'No tienes acceso a esta aula.' };
  }

  try {
    await prisma.classroom.update({ where: { id: classroom.id }, data: { name } });
  } catch {
    return { status: 'error', message: 'No se pudo actualizar el nombre. Inténtalo de nuevo.' };
  }

  revalidatePath(`/teacher/classrooms/${classroom.id}`);
  revalidatePath('/teacher');
  revalidatePath('/teacher/history');
  revalidatePath('/');
  revalidatePath(`/student/classrooms/${classroom.id}`);
  revalidatePath('/student/history');
  return { status: 'success', message: 'Nombre del aula actualizado.' };
}