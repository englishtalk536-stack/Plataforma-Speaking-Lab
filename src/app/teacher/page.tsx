import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import { requireTeacherId } from '../../lib/teacher-auth';
import { NotificationList } from '../../components/NotificationList';
import { TeacherSidebarNav } from '../../components/TeacherSidebarNav';
import { EditVirtualClassScheduleForm } from './EditVirtualClassScheduleForm';
import { MarkVirtualClassTaughtButton } from './MarkVirtualClassTaughtButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSection } from '../../components/dashboard/DashboardSection';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { displayableText } from '../../lib/presentation-content';

export default async function TeacherPage() {
  const teacherId = await requireTeacherId();
  const now = new Date();
  const [teacher, classrooms, notifications] = await Promise.all([
    prisma.user.findUnique({ where: { id: teacherId }, select: { fullName: true, email: true, avatarUrl: true } }),
    prisma.classroom.findMany({
      where: { teacherId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        description: true,
        memberships: {
          where: {
            status: 'ACTIVE',
            user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE' } },
          },
          select: { id: true, englishLevel: true, user: { select: { id: true, fullName: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        writtenActivities: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            submissions: {
              select: { studentId: true, submissionFeedback: { select: { id: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        virtualClasses: {
          where: { status: 'SCHEDULED' },
          select: { id: true, title: true, joinUrl: true, scheduledAt: true, status: true },
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.notification.findMany({
      where: { userId: teacherId, readAt: null },
      select: { id: true, title: true, message: true, href: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);
  const upcomingVirtualClasses = classrooms
    .flatMap((classroom) =>
      classroom.virtualClasses.map((virtualClass) => ({
        ...virtualClass,
        classroomId: classroom.id,
        classroomName: classroom.name,
      })),
    )
    .sort((first, second) => first.scheduledAt.getTime() - second.scheduledAt.getTime());

  const pendingActionsCount = upcomingVirtualClasses.filter((virtualClass) => virtualClass.scheduledAt <= now).length;
  const pendingActivities = classrooms.flatMap((classroom) => {
    if (classroom.memberships.length === 0) return [];

    return classroom.writtenActivities.flatMap((activity) => {
      const pendingCount = classroom.memberships.filter(({ user }) => {
        const submission = activity.submissions.find(({ studentId }) => studentId === user.id);
        return !submission?.submissionFeedback;
      }).length;
      return pendingCount > 0 ? [{ ...activity, classroomId: classroom.id, classroomName: classroom.name, pendingCount }] : [];
    });
  });
  const metrics = [
    { label: 'Próximas clases', value: String(upcomingVirtualClasses.length) },
    { label: 'Pendientes de dictar', value: String(pendingActionsCount) },
    { label: 'Actividades pendientes', value: String(pendingActivities.length) },
    { label: 'Aulas activas', value: String(classrooms.length) },
  ];

  return (
    <div className="min-h-screen bg-speaking-white md:flex">
      <TeacherSidebarNav active="classrooms" />

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <PageHeader
            eyebrow="Panel del profesor"
            title={teacher?.fullName ?? 'Profesor'}
            description={teacher?.email ? `Correo: ${teacher.email}` : undefined}
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/teacher/history" className="inline-flex min-h-11 items-center justify-center rounded-full border border-speaking-cobalt/15 px-4 py-2 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">
                  Historial
                </Link>
              <Link
                href="#active-classrooms"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-speaking-cobalt px-4 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2"
              >
                Gestionar aulas
              </Link>
              </div>
            }
          />

          <NotificationList notifications={notifications.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() }))} />

          {pendingActionsCount > 0 || pendingActivities.length > 0 ? (
            <DashboardSection title="Requiere tu atención" description="Acciones pendientes o seguimiento por revisar.">
              <div className="space-y-2">
                {pendingActionsCount > 0 && (
                  <p className="font-body text-sm text-speaking-cobalt/75">
                    Hay <span className="font-semibold text-speaking-cobalt">{pendingActionsCount}</span> clase{pendingActionsCount === 1 ? '' : 's'} programada{pendingActionsCount === 1 ? '' : 's'} con hora ya alcanzada y pendiente{pendingActionsCount === 1 ? '' : 's'} de marcar como dictada.
                  </p>
                )}
                {pendingActivities.length > 0 && (
                  <ul className="divide-y divide-speaking-cobalt/10">
                    {pendingActivities.map((activity) => (
                      (() => {
                        const activeStudentIds = classrooms
                          .find((classroom) => classroom.id === activity.classroomId)
                          ?.memberships.map(({ user }) => user.id) ?? [];
                        const pendingGradeCount = activity.submissions.filter(
                          (submission) => activeStudentIds.includes(submission.studentId) && !submission.submissionFeedback,
                        ).length;
                        const pendingDeliveryCount = Math.max(0, activity.pendingCount - pendingGradeCount);
                        return (
                      <li key={activity.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-title text-base text-speaking-cobalt">{displayableText(activity.title) ?? 'Actividad'}</p>
                          {displayableText(activity.classroomName) && <p className="mt-1 font-body text-sm text-speaking-cobalt/70">{displayableText(activity.classroomName)}</p>}
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          {pendingGradeCount > 0 && <StatusBadge tone="warning">Pendiente de calificar · {pendingGradeCount}</StatusBadge>}
                          {pendingDeliveryCount > 0 && <StatusBadge tone="neutral">Pendiente de entrega · {pendingDeliveryCount}</StatusBadge>}
                          <Link
                            href={`/teacher/classrooms/${activity.classroomId}`}
                            className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                          >
                            Abrir aula
                          </Link>
                        </div>
                      </li>
                        );
                      })()
                    ))}
                  </ul>
                )}
              </div>
            </DashboardSection>
          ) : (
            <EmptyState
              title="No tienes acciones pendientes"
              description="Todo está al día en tus aulas y clases programadas."
              action={<Link href="/teacher/history" className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">Ver historial</Link>}
            />
          )}

          <section aria-label="Métricas del profesor">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-speaking-cobalt/12 bg-white p-4 shadow-[0_1px_0_rgba(19,39,67,0.03)]">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/60">{metric.label}</p>
                  <p className="mt-3 font-title text-3xl text-speaking-cobalt">{metric.value}</p>
                </div>
              ))}
            </div>
          </section>

          <DashboardSection title="Agenda de clases virtuales" description="Tus clases previstas y sus acciones actuales.">
            {upcomingVirtualClasses.length === 0 ? (
              <EmptyState
                title="No hay clases para esta agenda"
                description="Cuando programes clases virtuales, aparecerán aquí con sus acciones y estado."
              />
            ) : (
              <ul className="space-y-4">
                {upcomingVirtualClasses.map((virtualClass) => {
                  const isDue = virtualClass.scheduledAt <= now;
                  const badgeTone = isDue ? 'warning' : 'neutral';
                  return (
                    <li key={virtualClass.id} className="rounded-2xl border border-speaking-cobalt/12 bg-speaking-white p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-title text-lg text-speaking-cobalt">{displayableText(virtualClass.title) ?? 'Clase virtual'}</h3>
                            <StatusBadge tone={badgeTone}>{isDue ? 'Requiere acción' : 'Programada'}</StatusBadge>
                          </div>
                          {displayableText(virtualClass.classroomName) && <Link href={`/teacher/classrooms/${virtualClass.classroomId}`} className="inline-flex items-center font-body text-sm text-speaking-cobalt/75 underline-offset-4 hover:underline">
                            {displayableText(virtualClass.classroomName)}
                          </Link>}
                          <div className="font-body text-sm text-speaking-cobalt/75">
                            <time dateTime={virtualClass.scheduledAt.toISOString()}>
                              {virtualClass.scheduledAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                            </time>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-start justify-end">
                          <a
                            href={virtualClass.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                          >
                            Abrir enlace externo
                          </a>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t border-speaking-cobalt/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex flex-col gap-2 sm:items-end">
                          <EditVirtualClassScheduleForm
                            classroomId={virtualClass.classroomId}
                            virtualClassId={virtualClass.id}
                            scheduledAt={virtualClass.scheduledAt.toISOString()}
                          />
                          <MarkVirtualClassTaughtButton
                            classroomId={virtualClass.classroomId}
                            virtualClassId={virtualClass.id}
                            canMark={isDue}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardSection>

          <div id="active-classrooms" className="scroll-mt-6">
            {classrooms.length === 0 ? (
              <EmptyState
                title="No hay aulas activas"
                description="Las aulas activas asignadas a tu cuenta aparecerán aquí."
              />
            ) : (
              <DashboardSection title="Aulas activas" description="Accede rápidamente a cada aula.">
              <ul className="grid gap-4 md:grid-cols-2">
                {classrooms.map((classroom) => (
                  <li key={classroom.id} className="rounded-2xl border border-speaking-cobalt/12 bg-speaking-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-title text-lg text-speaking-cobalt">{displayableText(classroom.name) ?? 'Aula'}</h3>
                      </div>
                      <Link href={`/teacher/classrooms/${classroom.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-speaking-cobalt/15 px-3 py-2 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">
                        Abrir aula
                      </Link>
                    </div>
                    {classroom.description && <p className="mt-3 font-body text-sm leading-6 text-speaking-cobalt/70">{classroom.description}</p>}
                    <p className="mt-3 font-body text-xs font-semibold uppercase tracking-[0.08em] text-speaking-cobalt/60">Estudiantes activos ({classroom.memberships.length})</p>
                    {classroom.memberships.length === 0 ? (
                      <p className="mt-2 font-body text-sm text-speaking-cobalt/60">Sin estudiantes asignados.</p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {classroom.memberships.slice(0, 4).map(({ id, englishLevel, user }) => (
                          <li key={id} className="rounded-full border border-speaking-cobalt/10 bg-white px-2.5 py-1 font-body text-xs text-speaking-cobalt/75">
                            {user.fullName}{englishLevel ? ` · ${englishLevel}` : ''}
                          </li>
                        ))}
                        {classroom.memberships.length > 4 && (
                          <li className="rounded-full border border-speaking-cobalt/10 bg-white px-2.5 py-1 font-body text-xs text-speaking-cobalt/65">
                            +{classroom.memberships.length - 4}
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
              </DashboardSection>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}