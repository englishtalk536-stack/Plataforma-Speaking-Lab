'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../lib/prisma';
import { requireTeacherId } from '../../../../lib/teacher-auth';
import { todayUtcMidnight } from '../../../../server/errors';

export type GroupAssignmentState = { status: 'idle' | 'error' | 'success'; message: string };

export async function assignLearningToGroup(
  classroomId: string,
  _previousState: GroupAssignmentState,
  formData: FormData,
): Promise<GroupAssignmentState> {
  const teacherId = await requireTeacherId();
  const rawItem = formData.get('learningItem');
  const rawStudentIds = formData.getAll('studentIds');
  if (typeof rawItem !== 'string' || !rawItem || rawStudentIds.some((value) => typeof value !== 'string')) {
    return { status: 'error', message: 'Selecciona una actividad y al menos un estudiante.' };
  }

  const separatorIndex = rawItem.indexOf(':');
  const itemType = rawItem.slice(0, separatorIndex);
  const itemId = rawItem.slice(separatorIndex + 1);
  if (separatorIndex < 1 || !itemId || (itemType !== 'PRACTICE' && itemType !== 'MISSION')) {
    return { status: 'error', message: 'La actividad seleccionada no es válida.' };
  }

  const studentIds = [...new Set(rawStudentIds.filter((value): value is string => typeof value === 'string' && value.length > 0))];
  if (studentIds.length === 0) return { status: 'error', message: 'Selecciona al menos un estudiante.' };

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
  if (!classroom) return { status: 'error', message: 'No tienes acceso a esta aula.' };

  const activeStudentIds = new Set(classroom.memberships.map(({ userId }) => userId));
  if (studentIds.some((studentId) => !activeStudentIds.has(studentId))) {
    return { status: 'error', message: 'La selección incluye estudiantes que no pertenecen activamente a esta aula.' };
  }

  if (itemType === 'PRACTICE') {
    const practice = await prisma.skillNode.findUnique({ where: { id: itemId }, select: { id: true, title: true } });
    if (!practice) return { status: 'error', message: 'La práctica ya no está disponible.' };

    let assigned = 0;
    let alreadyCompleted = 0;
    try {
      await prisma.$transaction(async (transaction) => {
        for (const studentId of studentIds) {
          const current = await transaction.userSkillProgress.findUnique({
            where: { userId_nodeId: { userId: studentId, nodeId: practice.id } },
            select: { status: true },
          });
          if (current?.status === 'COMPLETED') {
            alreadyCompleted += 1;
            continue;
          }
          await transaction.userSkillProgress.upsert({
            where: { userId_nodeId: { userId: studentId, nodeId: practice.id } },
            update: { status: 'UNLOCKED' },
            create: { userId: studentId, nodeId: practice.id, status: 'UNLOCKED' },
          });
          assigned += 1;
        }
      });
    } catch {
      return { status: 'error', message: 'No se pudo asignar la práctica al grupo. Inténtalo de nuevo.' };
    }

    revalidatePath(`/teacher/classrooms/${classroomId}`);
    for (const studentId of studentIds) revalidatePath(`/teacher/classrooms/${classroomId}/students/${studentId}`);
    revalidatePath('/');
    return { status: 'success', message: `${practice.title}: asignada a ${assigned}; ya completada por ${alreadyCompleted}.` };
  }

  const mission = await prisma.dailyQuest.findFirst({ where: { id: itemId, isActive: true }, select: { id: true, title: true } });
  if (!mission) return { status: 'error', message: 'La misión ya no está disponible.' };

  const assignedDate = todayUtcMidnight();
  let assigned = 0;
  let alreadyAssigned = 0;
  try {
    await prisma.$transaction(async (transaction) => {
      for (const studentId of studentIds) {
        const existing = await transaction.userDailyQuest.findUnique({
          where: { userId_questId_assignedDate: { userId: studentId, questId: mission.id, assignedDate } },
          select: { id: true },
        });
        if (existing) {
          alreadyAssigned += 1;
          continue;
        }
        await transaction.userDailyQuest.create({
          data: { userId: studentId, questId: mission.id, assignedDate, status: 'PENDING' },
        });
        assigned += 1;
      }
    });
  } catch {
    return { status: 'error', message: 'No se pudo asignar la misión al grupo. Inténtalo de nuevo.' };
  }

  revalidatePath(`/teacher/classrooms/${classroomId}`);
  for (const studentId of studentIds) revalidatePath(`/teacher/classrooms/${classroomId}/students/${studentId}`);
  revalidatePath('/');
  return { status: 'success', message: `${mission.title}: asignada a ${assigned}; ya estaba asignada hoy a ${alreadyAssigned}.` };
}