import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { StudentDashboardClient } from '../components/dashboard/StudentDashboardClient';
import { authOptions } from '../lib/auth-options';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  if (session.user.role === 'TEACHER') redirect('/teacher');

  return <StudentDashboardClient />;
}
