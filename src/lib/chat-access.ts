import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { prisma } from './prisma';

export type ChatIdentity = { id: string; role: 'TEACHER' | 'STUDENT'; fullName: string };

export async function getChatIdentity(): Promise<ChatIdentity | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, accessStatus: true, fullName: true },
  });
  if (!user || user.accessStatus !== 'ACTIVE' || (user.role !== 'TEACHER' && user.role !== 'STUDENT')) return null;

  return { id: user.id, role: user.role, fullName: user.fullName };
}

export async function getAuthorizedChatPair(identity: ChatIdentity, counterpartId: string) {
  const counterpart = await prisma.user.findUnique({
    where: { id: counterpartId },
    select: { id: true, role: true, accessStatus: true, fullName: true },
  });
  if (!counterpart || counterpart.accessStatus !== 'ACTIVE') return null;

  const teacherId = identity.role === 'TEACHER' ? identity.id : counterpart.id;
  const studentId = identity.role === 'STUDENT' ? identity.id : counterpart.id;
  const expectedCounterpartRole = identity.role === 'TEACHER' ? 'STUDENT' : 'TEACHER';
  if (counterpart.role !== expectedCounterpartRole) return null;

  const membership = await prisma.classroomMembership.findFirst({
    where: {
      userId: studentId,
      status: 'ACTIVE',
      classroom: { is: { teacherId, status: 'ACTIVE' } },
      user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } },
    },
    select: { id: true },
  });
  if (!membership) return null;

  return { teacherId, studentId, counterpart };
}
