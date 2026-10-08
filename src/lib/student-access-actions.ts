'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { prisma } from './prisma';

type StudentAccessActionState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  accessStatus: 'ACTIVE' | 'PAUSED' | null;
};

export async function toggleStudentAccess(
  studentId: string,
  classroomId: string | null,
  _previousState: StudentAccessActionState,
  _formData: FormData,
): Promise<StudentAccessActionState> {
  void _previousState;
  void _formData;
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id;
  const role = session?.user?.role;

  if (!actorId) redirect('/login');
  if (role !== 'TEACHER' && role !== 'ADMIN') redirect('/');

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, accessStatus: true },
  });

  if (!student || student.role !== 'STUDENT') {
    return { status: 'error', message: 'No se encontró la cuenta de estudiante.', accessStatus: null };
  }

  if (role === 'TEACHER') {
    if (!classroomId) redirect('/');
    const ownsActiveEnrollment = await prisma.classroomMembership.findFirst({
      where: {
        classroomId,
        userId: student.id,
        status: 'ACTIVE',
        classroom: { is: { teacherId: actorId, status: 'ACTIVE' } },
      },
      select: { id: true },
    });

    if (!ownsActiveEnrollment) {
      return { status: 'error', message: 'Solo puedes administrar alumnos activos de tus aulas.', accessStatus: null };
    }
  }

  const nextStatus = student.accessStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

  try {
    await prisma.user.update({
      where: { id: student.id },
      data: { accessStatus: nextStatus },
    });
  } catch {
    return { status: 'error', message: 'No se pudo actualizar el acceso. Inténtalo de nuevo.', accessStatus: null };
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/access-paused');
  if (classroomId) {
    revalidatePath(`/teacher/classrooms/${classroomId}`);
    revalidatePath(`/teacher/classrooms/${classroomId}/students/${student.id}`);
  }

  return {
    status: 'success',
    message: nextStatus === 'ACTIVE' ? 'Acceso del estudiante reactivado.' : 'Cuenta del estudiante pausada.',
    accessStatus: nextStatus,
  };
}
