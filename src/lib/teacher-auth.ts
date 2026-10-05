import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';

export async function requireTeacherId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'TEACHER') redirect('/');

  return session.user.id;
}