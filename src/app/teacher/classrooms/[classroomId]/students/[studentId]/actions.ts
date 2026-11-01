'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../../../../lib/prisma';
import { requireTeacherId } from '../../../../../../lib/teacher-auth';
import { todayUtcMidnight } from '../../../../../../server/errors';

export type AssignPracticeState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export async function assignPracticeNode(
  classroomId: string,
  studentId: string,
  _previousState: AssignPracticeState,
  formData: FormData,
): Promise<AssignPracticeState> {
  const teacherId = await requireTeacherId();
  const rawNodeId = formData.get('nodeId');

  if (typeof rawNodeId !== 'string' || !rawNodeId) {
    return { status: 'error', message: 'Selecciona una práctica.' };
  }

  const membership = await prisma.classroomMembership.findFirst({
    where: {
      classroomId,
      userId: studentId,
      status: 'ACTIVE',
      classroom: { is: { teacherId, status: 'ACTIVE' } },
      user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } },
    },
    select: { id: true },
  });

  if (!membership) return { status: 'error', message: 'No tienes acceso a este estudiante.' };

  const node = await prisma.skillNode.findUnique({ where: { id: rawNodeId }, select: { id: true } });
  if (!node) return { status: 'error', message: 'No se encontró la práctica seleccionada.' };

  const existingProgress = await prisma.userSkillProgress.findUnique({
    where: { userId_nodeId: { userId: studentId, nodeId: node.id } },
    select: { id: true, status: true },
  });

  if (existingProgress?.status === 'COMPLETED') {
    return { status: 'error', message: 'Esta práctica ya está completada.' };
  }

  try {
    await prisma.userSkillProgress.upsert({
      where: { userId_nodeId: { userId: studentId, nodeId: node.id } },
      update: { status: 'UNLOCKED' },
      create: { userId: studentId, nodeId: node.id, status: 'UNLOCKED' },
    });
  } catch {
    return { status: 'error', message: 'No se pudo asignar la práctica. Inténtalo de nuevo.' };
  }

  revalidatePath(`/teacher/classrooms/${classroomId}/students/${studentId}`);
  revalidatePath('/');
  return { status: 'success', message: 'Práctica asignada.' };
}

export async function assignDailyQuest(
  classroomId: string,
  studentId: string,
  _previousState: AssignPracticeState,
  formData: FormData,
): Promise<AssignPracticeState> {
  const teacherId = await requireTeacherId();
  const questId = formData.get('questId');
  if (typeof questId !== 'string' || !questId) {
    return { status: 'error', message: 'Selecciona una misión.' };
  }

  const [membership, quest] = await Promise.all([
    prisma.classroomMembership.findFirst({
      where: {
        classroomId,
        userId: studentId,
        status: 'ACTIVE',
        classroom: { is: { teacherId, status: 'ACTIVE' } },
        user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } },
      },
      select: { id: true },
    }),
    prisma.dailyQuest.findFirst({ where: { id: questId, isActive: true }, select: { id: true } }),
  ]);

  if (!membership) return { status: 'error', message: 'No tienes acceso a este estudiante.' };
  if (!quest) return { status: 'error', message: 'La misión no existe o ya no está disponible.' };

  const assignedDate = todayUtcMidnight();
  const existingAssignment = await prisma.userDailyQuest.findUnique({
    where: { userId_questId_assignedDate: { userId: studentId, questId, assignedDate } },
    select: { id: true },
  });
  if (existingAssignment) return { status: 'error', message: 'Esta misión ya está asignada para hoy.' };

  try {
    await prisma.userDailyQuest.create({ data: { userId: studentId, questId, assignedDate, status: 'PENDING' } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { status: 'error', message: 'Esta misión ya está asignada para hoy.' };
    }
    return { status: 'error', message: 'No se pudo asignar la misión. Inténtalo de nuevo.' };
  }

  revalidatePath(`/teacher/classrooms/${classroomId}/students/${studentId}`);
  revalidatePath('/');
  return { status: 'success', message: 'Misión asignada para hoy.' };
}

const teacherMissionTypes = new Set(['SPEAKING', 'LISTENING', 'PRACTICE', 'VIDEO', 'GAME', 'TOPIC', 'VOCABULARY']);

export async function createAndAssignDailyQuest(
  classroomId: string,
  studentId: string,
  _previousState: AssignPracticeState,
  formData: FormData,
): Promise<AssignPracticeState> {
  const teacherId = await requireTeacherId();
  const titleValue = formData.get('title');
  const descriptionValue = formData.get('description');
  const typeValue = formData.get('activityType');
  const rawResourceValue = formData.get('resourceUrl');
  const rawPracticeNodeValue = formData.get('practiceNodeId');
  const xpValue = Number(formData.get('xpReward'));
  const coinValue = Number(formData.get('coinReward'));

  if (
    typeof titleValue !== 'string' || typeof descriptionValue !== 'string' ||
    typeof typeValue !== 'string' || (rawResourceValue !== null && typeof rawResourceValue !== 'string') ||
    (rawPracticeNodeValue !== null && typeof rawPracticeNodeValue !== 'string') ||
    !teacherMissionTypes.has(typeValue)
  ) return { status: 'error', message: 'Revisa los datos de la misión.' };

  const title = titleValue.trim();
  const description = descriptionValue.trim();
  const resourceUrl = typeof rawResourceValue === 'string' ? rawResourceValue.trim() : '';
  const practiceNodeId = typeof rawPracticeNodeValue === 'string' ? rawPracticeNodeValue.trim() : '';
  if (title.length < 3 || title.length > 100 || description.length < 10 || description.length > 1000) {
    return { status: 'error', message: 'El título debe tener 3–100 caracteres y las instrucciones 10–1000.' };
  }
  if (!Number.isInteger(xpValue) || xpValue < 0 || xpValue > 500 || !Number.isInteger(coinValue) || coinValue < 0 || coinValue > 500) {
    return { status: 'error', message: 'XP y monedas deben ser números enteros entre 0 y 500.' };
  }
  if (typeValue === 'PRACTICE' && !practiceNodeId) {
    return { status: 'error', message: 'Selecciona la práctica que debe realizar el estudiante.' };
  }
  if (typeValue !== 'PRACTICE' && practiceNodeId) {
    return { status: 'error', message: 'La práctica vinculada solo se admite en misiones de tipo Práctica específica.' };
  }
  if ((typeValue === 'VIDEO' || typeValue === 'GAME' || typeValue === 'LISTENING') && !resourceUrl) {
    return { status: 'error', message: 'Añade el enlace HTTPS del audio, vídeo o juego.' };
  }
  if (resourceUrl) {
    try {
      const parsed = new URL(resourceUrl, 'http://localhost');
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Invalid scheme');
      if (parsed.origin !== 'http://localhost' && parsed.protocol !== 'https:') throw new Error('External links must use HTTPS');
    } catch {
      return { status: 'error', message: 'El enlace debe ser una URL válida y segura (HTTPS).' };
    }
  }

  const membership = await prisma.classroomMembership.findFirst({
    where: {
      classroomId,
      userId: studentId,
      status: 'ACTIVE',
      classroom: { is: { teacherId, status: 'ACTIVE' } },
      user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } },
    },
    select: { id: true },
  });
  if (!membership) return { status: 'error', message: 'No tienes acceso a este estudiante.' };

  let practiceNode: { id: string } | null = null;
  if (practiceNodeId) {
    const practice = await prisma.skillNode.findUnique({ where: { id: practiceNodeId }, select: { id: true } });
    if (!practice) return { status: 'error', message: 'La práctica seleccionada ya no está disponible.' };
    practiceNode = practice;
    const progress = await prisma.userSkillProgress.findUnique({
      where: { userId_nodeId: { userId: studentId, nodeId: practice.id } },
      select: { status: true },
    });
    if (progress?.status === 'COMPLETED') return { status: 'error', message: 'El estudiante ya completó esa práctica.' };
  }

  const assignedDate = todayUtcMidnight();
  try {
    await prisma.$transaction(async (transaction) => {
      if (typeValue === 'PRACTICE' && practiceNode) {
        await transaction.userSkillProgress.upsert({
          where: { userId_nodeId: { userId: studentId, nodeId: practiceNode.id } },
          update: { status: 'UNLOCKED' },
          create: { userId: studentId, nodeId: practiceNode.id, status: 'UNLOCKED' },
        });
      }
      const mission = await transaction.dailyQuest.create({
        data: {
          title,
          description,
          xpReward: xpValue,
          coinReward: coinValue,
          scenarioType: 'FREE_TALK',
          activityType: typeValue,
          resourceUrl: practiceNodeId ? `/practice/${practiceNodeId}` : resourceUrl || null,
          isActive: true,
        },
        select: { id: true },
      });
      await transaction.userDailyQuest.create({
        data: { userId: studentId, questId: mission.id, assignedDate, status: 'PENDING' },
      });
    });
  } catch {
    return { status: 'error', message: 'No se pudo crear y asignar la misión. Inténtalo de nuevo.' };
  }

  revalidatePath(`/teacher/classrooms/${classroomId}/students/${studentId}`);
  revalidatePath('/');
  return { status: 'success', message: 'Misión creada y asignada para hoy.' };
}
