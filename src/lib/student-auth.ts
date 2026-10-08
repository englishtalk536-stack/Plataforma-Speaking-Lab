import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { prisma } from './prisma';

export async function requireStudentId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'STUDENT') redirect('/');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, accessStatus: true },
  });

  if (user?.role !== 'STUDENT') redirect('/');
  if (user.accessStatus !== 'ACTIVE') redirect('/access-paused');

  return session.user.id;
}