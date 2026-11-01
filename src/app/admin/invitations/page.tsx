import Link from 'next/link';
import { MailPlus, ShieldCheck } from 'lucide-react';
import { AdminAccountManagement } from '../../../components/AdminAccountManagement';
import { AdminLogoutButton } from '../../../components/AdminLogoutButton';
import { requireAdminId } from '../../../lib/admin-auth';
import { prisma } from '../../../lib/prisma';

export default async function AdminInvitationsPage() {
  const adminId = await requireAdminId();
  const [admin, classrooms, invitations] = await Promise.all([
    prisma.user.findUnique({ where: { id: adminId }, select: { fullName: true, email: true } }),
    prisma.classroom.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, teacher: { select: { fullName: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.accountInvitation.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        expiresAt: true,
        usedAt: true,
        classroom: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col justify-between gap-5 rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_8px_30px_rgba(16,52,105,0.06)] sm:flex-row sm:items-start sm:p-6">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">Acceso seguro</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-speaking-king/10 text-speaking-king"><MailPlus className="h-5 w-5" aria-hidden="true" /></span>
            <h1 className="font-title text-3xl text-speaking-cobalt">Invitaciones</h1>
          </div>
          <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-speaking-cobalt/75">Crea accesos para las personas que formarán parte de Speaking Lab. El rol queda definido antes de compartir el enlace.</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-3 rounded-xl border border-speaking-cobalt/10 bg-speaking-white px-3.5 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking-cobalt/8 text-speaking-cobalt"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
            <div><p className="font-body text-sm font-semibold text-speaking-cobalt">{admin?.fullName ?? 'Administrador'}</p><p className="font-body text-sm text-speaking-cobalt/65">{admin?.email} · Cuenta administradora</p></div>
          </div>
          <AdminLogoutButton />
        </div>
      </header>

      <nav aria-label="Secciones de administración" className="sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto border-y border-speaking-cobalt/8 bg-speaking-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link href="/admin" className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 font-body text-sm font-semibold text-speaking-cobalt/70 transition-colors hover:bg-white hover:text-speaking-cobalt">Usuarios y aulas</Link>
        <Link href="/admin/invitations" aria-current="page" className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-speaking-cobalt px-3 font-body text-sm font-semibold text-white">Invitaciones</Link>
      </nav>

      <AdminAccountManagement
        classrooms={classrooms.map((classroom) => ({ id: classroom.id, name: classroom.name, teacherName: classroom.teacher.fullName }))}
        invitations={invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          fullName: invitation.fullName,
          role: invitation.role === 'TEACHER' ? 'TEACHER' as const : 'STUDENT' as const,
          classroomName: invitation.classroom?.name ?? null,
          expiresAt: invitation.expiresAt.toISOString(),
          status: invitation.usedAt ? 'accepted' as const : invitation.expiresAt <= new Date() ? 'expired' as const : 'pending' as const,
        }))}
      />
    </main>
  );
}
