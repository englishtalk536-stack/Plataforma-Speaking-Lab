'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminId } from './admin-auth';
import { prisma } from './prisma';

export type ClassroomAssignmentState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function assignStudentsToClassroom(
  _previousState: ClassroomAssignmentState,
  formData: FormData,
): Promise<ClassroomAssignmentState> {
  await requireAdminId();
  const classroomId = formData.get('classroomId');
  const rawStudentIds = formData.getAll('studentIds');
  if (
    typeof classroomId !== 'string' ||
    !classroomId ||
    rawStudentIds.some((value) => typeof value !== 'string')
  ) {
    return { status: 'error', message: 'Selecciona un aula y estudiantes válidos.' };
  }
  const studentIds = [...new Set(rawStudentIds.filter((value): value is string => typeof value === 'string'))];
  if (studentIds.length === 0) return { status: 'error', message: 'Selecciona al menos un estudiante.' };

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, status: 'ACTIVE', teacher: { is: { role: 'TEACHER', accessStatus: 'ACTIVE' } } },
    select: { id: true, name: true, teacherId: true, teacher: { select: { fullName: true } } },
  });
  if (!classroom) return { status: 'error', message: 'El aula seleccionada no está activa o no tiene un profesor activo.' };

  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: 'STUDENT', accessStatus: 'ACTIVE' },
    select: { id: true, fullName: true },
  });
  if (students.length !== studentIds.length) {
    return { status: 'error', message: 'La selección contiene una cuenta que no es un estudiante activo.' };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const newlyAssigned: typeof students = [];
      for (const student of students) {
        const membership = await transaction.classroomMembership.findUnique({
          where: { classroomId_userId: { classroomId, userId: student.id } },
          select: { status: true },
        });
        if (membership?.status !== 'ACTIVE') newlyAssigned.push(student);
        await transaction.classroomMembership.upsert({
          where: { classroomId_userId: { classroomId, userId: student.id } },
          update: { status: 'ACTIVE', leftAt: null },
          create: { classroomId, userId: student.id, status: 'ACTIVE' },
        });
      }

      if (newlyAssigned.length > 0) {
        await transaction.notification.createMany({
          data: newlyAssigned.map((student) => ({
            userId: student.id,
            title: 'Nueva asignación de aula',
            message: `Te asignaron al aula ${classroom.name} con ${classroom.teacher.fullName}.`,
            href: `/student/classrooms/${classroom.id}`,
          })),
        });
        await transaction.notification.create({
          data: {
            userId: classroom.teacherId,
            title: 'Nuevos estudiantes asignados',
            message: `${newlyAssigned.map(({ fullName }) => fullName).join(', ')} ${newlyAssigned.length === 1 ? 'se incorporó' : 'se incorporaron'} al aula ${classroom.name}.`,
            href: `/teacher/classrooms/${classroom.id}`,
          },
        });
      }
    });
  } catch {
    return { status: 'error', message: 'No se pudo completar la asignación. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/teacher');
  revalidatePath(`/teacher/classrooms/${classroom.id}`);
  return { status: 'success', message: `Asignación actualizada para ${students.length} estudiante(s).` };
}