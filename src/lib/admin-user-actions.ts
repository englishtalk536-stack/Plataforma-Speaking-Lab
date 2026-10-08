'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminId } from './admin-auth';
import { prisma } from './prisma';

export type DeleteUserState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function deleteManagedUser(
  userId: string,
  _previousState: DeleteUserState,
  _formData: FormData,
): Promise<DeleteUserState> {
  void _previousState;
  void _formData;
  await requireAdminId();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      _count: { select: { classroomsAsTeacher: true } },
    },
  });

  if (!target || (target.role !== 'STUDENT' && target.role !== 'TEACHER')) {
    return { status: 'error', message: 'Solo se pueden eliminar cuentas de estudiantes o profesores.' };
  }

  if (target.role === 'TEACHER' && target._count.classroomsAsTeacher > 0) {
    return {
      status: 'error',
      message: 'No se puede eliminar este profesor mientras tenga aulas asignadas. Transfiere primero sus aulas para conservar sus actividades y respuestas.',
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const currentTarget = await transaction.user.findUnique({
        where: { id: target.id },
        select: {
          role: true,
          _count: { select: { classroomsAsTeacher: true } },
        },
      });

      if (!currentTarget || (currentTarget.role !== 'STUDENT' && currentTarget.role !== 'TEACHER')) {
        throw new Error('Account is not eligible for deletion.');
      }
      if (currentTarget.role === 'TEACHER' && currentTarget._count.classroomsAsTeacher > 0) {
        throw new Error('Teacher still owns classrooms.');
      }

      await transaction.classroomMembership.deleteMany({ where: { userId: target.id } });
      await transaction.user.delete({ where: { id: target.id } });
    });
  } catch {
    return {
      status: 'error',
      message: 'No se pudo eliminar la cuenta. Comprueba que no tenga aulas asignadas y vuelve a intentarlo.',
    };
  }

  revalidatePath('/admin');
  revalidatePath('/');
  return { status: 'success', message: 'Cuenta eliminada.' };
}
