import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { StudentDashboardClient } from '../components/dashboard/StudentDashboardClient';
import { authOptions } from '../lib/auth-options';
import { prisma } from '../lib/prisma';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  if (session.user.role === 'TEACHER') redirect('/teacher');
  if (session.user.role === 'ADMIN') redirect('/admin');

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accessStatus: true } });
  if (user?.accessStatus === 'PAUSED') redirect('/access-paused');

  return <StudentDashboardClient />;
}
