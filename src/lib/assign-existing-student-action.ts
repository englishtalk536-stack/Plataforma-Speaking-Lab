'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminId } from './admin-auth';
import { prisma } from './prisma';

export type ExistingStudentAssignmentState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function assignExistingStudentToClassroom(
  _previousState: ExistingStudentAssignmentState,
  formData: FormData,
): Promise<ExistingStudentAssignmentState> {
  await requireAdminId();

  const studentId = formData.get('studentId');
  const classroomId = formData.get('classroomId');
  if (typeof studentId !== 'string' || !studentId || typeof classroomId !== 'string' || !classroomId) {
    return { status: 'error', message: 'Selecciona un estudiante y un aula.' };
  }

  const [student, classroom] = await Promise.all([
    prisma.user.findFirst({
      where: { id: studentId, role: 'STUDENT', accessStatus: 'ACTIVE' },
      select: { id: true },
    }),
    prisma.classroom.findFirst({
      where: { id: classroomId, status: 'ACTIVE', teacher: { is: { role: 'TEACHER', accessStatus: 'ACTIVE' } } },
      select: { id: true },
    }),
  ]);

  if (!student) return { status: 'error', message: 'La cuenta seleccionada no es un estudiante activo.' };
  if (!classroom) return { status: 'error', message: 'El aula no existe, no está activa o no tiene un profesor activo.' };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const membership = await transaction.classroomMembership.findUnique({
        where: { classroomId_userId: { classroomId, userId: studentId } },
        select: { id: true, status: true },
      });

      if (membership?.status === 'ACTIVE') return 'already-assigned' as const;

      if (membership) {
        await transaction.classroomMembership.update({
          where: { id: membership.id },
          data: { status: 'ACTIVE', leftAt: null },
        });
      } else {
        await transaction.classroomMembership.create({
          data: { classroomId, userId: studentId, status: 'ACTIVE' },
        });
      }

      return 'assigned' as const;
    });

    if (result === 'already-assigned') {
      return { status: 'error', message: 'Este estudiante ya tiene una matrícula activa en esa aula.' };
    }
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { status: 'error', message: 'Este estudiante ya tiene una matrícula en esa aula.' };
    }
    return { status: 'error', message: 'No se pudo asignar el estudiante. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath(`/student/classrooms/${classroomId}`);
  return { status: 'success', message: 'Estudiante asignado al aula.' };
}