import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import { requireStudentId } from '../../../../lib/student-auth';
import { SubmissionForm } from './SubmissionForm';
import { displayableText } from '../../../../lib/presentation-content';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { DashboardSection } from '../../../../components/dashboard/DashboardSection';
import { PageHeader } from '../../../../components/dashboard/PageHeader';
import { ArrowRight, BookOpenCheck, CalendarDays, History } from 'lucide-react';

export default async function StudentClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const studentId = await requireStudentId();
  const { classroomId } = await params;
  const membership = await prisma.classroomMembership.findFirst({
    where: {
      classroomId,
      userId: studentId,
      status: 'ACTIVE',
      classroom: { is: { status: 'ACTIVE' } },
    },
    select: {
      englishLevel: true,
      classroom: {
        select: {
          name: true,
          description: true,
          level: true,
          virtualClasses: {
            where: { status: { in: ['SCHEDULED', 'COMPLETED'] } },
            select: {
              id: true,
              title: true,
              joinUrl: true,
              scheduledAt: true,
              status: true,
            },
            orderBy: { scheduledAt: 'asc' },
          },
          classLessons: {
            where: { recipients: { some: { studentId } } },
            select: {
              id: true,
              title: true,
              taughtAt: true,
              notes: true,
              improvementOpportunities: true,
              homework: true,
              practiceNode: {
                select: {
                  title: true,
                  userProgress: { where: { userId: studentId, status: 'COMPLETED' }, select: { id: true }, take: 1 },
                  lessonProgress: { where: { userId: studentId, completedAt: { not: null } }, select: { id: true }, take: 1 },
                },
              },
            },
            orderBy: { taughtAt: 'desc' },
          },
          writtenActivities: {
            select: {
              id: true,
              title: true,
              prompt: true,
              createdAt: true,
              submissions: {
                where: { studentId },
                select: {
                  id: true,
                  responseText: true,
                  submissionFeedback: { select: { score: true, comment: true } },
                },
                take: 1,
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!membership) notFound();

  const { classroom } = membership;
  const upcomingVirtualClasses = classroom.virtualClasses.filter((virtualClass) => virtualClass.status === 'SCHEDULED').map((virtualClass) => ({
    ...virtualClass,
    scheduledAt: virtualClass.scheduledAt.toISOString(),
    classroomId,
    classroomName: classroom.name,
  }));
  const completedLessonKeys = new Set(
    classroom.virtualClasses
      .filter((virtualClass) => virtualClass.status === 'COMPLETED')
      .map((virtualClass) => `${virtualClass.scheduledAt.getTime()}`),
  );
  const activeClassLessons = classroom.classLessons.filter((lesson) => {
    const practiceCompleted = Boolean(lesson.practiceNode?.userProgress.length || lesson.practiceNode?.lessonProgress.length);
    return !completedLessonKeys.has(`${lesson.taughtAt.getTime()}`) &&
      [lesson.notes, lesson.improvementOpportunities, displayableHomework(lesson.homework), practiceCompleted ? null : lesson.practiceNode?.title].some((value) => displayableText(value));
  });
  const completedLessonHomework = classroom.classLessons
    .filter((lesson) => completedLessonKeys.has(`${lesson.taughtAt.getTime()}`) && displayableText(displayableHomework(lesson.homework)))
    .filter((lesson) => {
      const e2eTitle = /^E2E Clase (\d+)$/.exec(lesson.title.trim());
      return !e2eTitle || lesson.homework?.trim() !== `E2E Tarea ${e2eTitle[1]}`;
    });
  const pendingActivities = classroom.writtenActivities.filter((activity) => activity.submissions.length === 0);

  function displayableHomework(value: string | null | undefined) {
    return value?.trim().toLowerCase() === 'nq' ? null : value;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
      >
        Volver al dashboard
      </Link>

      <PageHeader
        eyebrow="Aula del estudiante"
        title={classroom.name}
        description={displayableText(classroom.description) ?? undefined}
        action={<Link href="/student/history" className="inline-flex min-h-11 items-center justify-center rounded-full border border-speaking-cobalt/15 px-4 py-2 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">Historial</Link>}
      />

      <section aria-label="Nivel de inglés asignado" className="flex flex-col gap-1 border-l-4 border-speaking-king bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="font-body text-sm font-semibold text-speaking-cobalt">Tu nivel de inglés</p>
        <p className="font-title text-lg text-speaking-king">{membership.englishLevel ?? 'Aún sin asignar'}</p>
      </section>

      {activeClassLessons.length > 0 && <div id="class-lesson-notes-heading" className="scroll-mt-6">
        <DashboardSection title="Seguimiento activo" description="Notas y recomendaciones compartidas por tu profesor.">
        {activeClassLessons.length > 0 && (
          <ul className="space-y-3">
            {activeClassLessons.map((lesson) => (
              <li key={lesson.id} className="group overflow-hidden rounded-xl border border-speaking-cobalt/10 border-l-4 border-l-speaking-king/75 bg-white shadow-[0_3px_14px_rgba(16,52,105,0.035)] transition duration-200 hover:border-speaking-king/25 hover:shadow-[0_8px_22px_rgba(16,52,105,0.08)]">
                <div className="flex flex-col justify-between gap-3 border-b border-speaking-cobalt/8 bg-gradient-to-r from-speaking-white to-white px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {displayableText(lesson.title) && <h3 className="font-title text-lg text-speaking-cobalt">{displayableText(lesson.title)}</h3>}
                      <StatusBadge tone="info">Compartido por tu profesor</StatusBadge>
                    </div>
                    <p className="mt-1.5 font-body text-xs font-medium text-speaking-cobalt/70">Seguimiento individual</p>
                  </div>
                  <time dateTime={lesson.taughtAt.toISOString()} className="inline-flex min-h-9 shrink-0 items-center gap-2 self-start rounded-lg border border-speaking-cobalt/8 bg-white px-3 font-body text-xs font-semibold text-speaking-cobalt/65 sm:self-auto">
                    <CalendarDays className="h-4 w-4 text-speaking-king" aria-hidden="true" />
                    {lesson.taughtAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
                <div className="space-y-4 p-4 sm:p-5">
                {displayableText(lesson.notes) && (
                  <div className="border-l-2 border-speaking-king/35 pl-3 sm:pl-4">
                    <h4 className="font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-cobalt/70">Apuntes</h4>
                    <p className="mt-1.5 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/85">{displayableText(lesson.notes)}</p>
                  </div>
                )}
                {displayableText(lesson.improvementOpportunities) && (
                  <div className="rounded-lg bg-speaking-white px-3.5 py-3 sm:px-4">
                    <h4 className="font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-cobalt/70">Oportunidades de mejora</h4>
                    <p className="mt-1.5 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(lesson.improvementOpportunities)}</p>
                  </div>
                )}
                {displayableText(displayableHomework(lesson.homework)) && (
                  <div className="rounded-lg border border-speaking-mustard/25 bg-speaking-mustard/10 px-3.5 py-3 sm:px-4">
                    <h4 className="font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-cobalt/80">Tareas</h4>
                    <p className="mt-1.5 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/85">{displayableText(displayableHomework(lesson.homework))}</p>
                  </div>
                )}
                {displayableText(lesson.practiceNode?.title) && !lesson.practiceNode?.userProgress.length && !lesson.practiceNode?.lessonProgress.length && (
                  <p className="inline-flex min-h-9 items-center rounded-lg bg-speaking-cobalt/5 px-3 font-body text-sm font-semibold text-speaking-cobalt">Práctica asignada: {displayableText(lesson.practiceNode?.title)}</p>
                )}
                </div>
              </li>
            ))}
          </ul>
        )}
        </DashboardSection>
      </div>}

      {(completedLessonHomework.length > 0 || pendingActivities.length > 0) && (
        <div id="student-pending-tasks" className="scroll-mt-6">
          <DashboardSection title="Actividades y tareas" description="Consulta la consigna, prepara tu respuesta y revisa lo que falta por entregar.">
            {completedLessonHomework.length > 0 && (
              <ul className="space-y-3">
                {completedLessonHomework.map((lesson) => (
                  <li key={lesson.id} className="flex flex-col gap-4 border border-speaking-cobalt/10 border-l-4 border-l-speaking-mustard bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {displayableText(lesson.title) && <h3 className="font-title text-base text-speaking-cobalt">{displayableText(lesson.title)}</h3>}
                        <StatusBadge tone="warning">Pendiente</StatusBadge>
                      </div>
                      <p className="whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(displayableHomework(lesson.homework))}</p>
                    </div>
                    <Link href={`/student/history#class-${classroomId}-${lesson.taughtAt.getTime()}`} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 sm:w-auto">Ver clase y tarea</Link>
                  </li>
                ))}
              </ul>
            )}
            {pendingActivities.length > 0 && (
              <ul className={completedLessonHomework.length > 0 ? 'mt-5 space-y-4 border-t border-speaking-cobalt/10 pt-5' : 'space-y-4'}>
                {pendingActivities.map((activity) => (
                  <li key={activity.id} className="overflow-hidden border border-speaking-cobalt/12 bg-white shadow-[0_2px_10px_rgba(16,52,105,0.04)]">
                    <div className="flex flex-col justify-between gap-3 border-b border-speaking-cobalt/10 bg-speaking-white px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                      <div className="min-w-0">
                        <p className="font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-king">Actividad escrita</p>
                        <h3 className="mt-1 font-title text-lg text-speaking-cobalt">{displayableText(activity.title) ?? 'Actividad'}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone="warning">Pendiente de entregar</StatusBadge>
                        <time dateTime={activity.createdAt.toISOString()} className="font-body text-xs text-speaking-cobalt/60">
                          {activity.createdAt.toLocaleDateString('es', { dateStyle: 'medium' })}
                        </time>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      {displayableText(activity.prompt) && (
                        <div className="border-l-2 border-speaking-king/45 bg-speaking-white px-3 py-3 sm:px-4">
                          <h4 className="font-body text-xs font-semibold uppercase tracking-[0.06em] text-speaking-cobalt/65">Consigna</h4>
                          <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/85">{displayableText(activity.prompt)}</p>
                        </div>
                      )}
                      <SubmissionForm
                        classroomId={classroomId}
                        activityId={activity.id}
                        initialResponse={activity.submissions[0]?.responseText ?? ''}
                      />
                      {(activity.submissions[0]?.submissionFeedback?.score != null ||
                        displayableText(activity.submissions[0]?.submissionFeedback?.comment)) && (
                        <section className="mt-4 border-t border-speaking-cobalt/10 pt-4" aria-label="Feedback del profesor">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-body text-sm font-semibold text-speaking-cobalt">Feedback del profesor</h4>
                            {activity.submissions[0]?.submissionFeedback?.score != null && <StatusBadge tone="success">Calificada</StatusBadge>}
                          </div>
                          {activity.submissions[0]?.submissionFeedback?.score != null && (
                            <p className="mt-2 font-title text-lg text-speaking-king">{activity.submissions[0]?.submissionFeedback?.score}<span className="font-body text-xs font-normal text-speaking-cobalt/60"> / 20</span></p>
                          )}
                          {displayableText(activity.submissions[0]?.submissionFeedback?.comment) && (
                            <p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-speaking-success/50 bg-speaking-success/5 px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt/80">
                              {displayableText(activity.submissions[0]?.submissionFeedback?.comment)}
                            </p>
                          )}
                        </section>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>
        </div>
      )}

      {upcomingVirtualClasses.length > 0 && (
        <DashboardSection title="Próximas clases" description="Consulta la hora y accede al enlace de la sesión.">
          <ul className="divide-y divide-speaking-cobalt/10">
            {upcomingVirtualClasses.map((virtualClass) => (
              <li key={virtualClass.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-title text-base text-speaking-cobalt">{displayableText(virtualClass.title) ?? 'Clase virtual'}</h3>
                    <StatusBadge tone="neutral">Programada</StatusBadge>
                  </div>
                  <Link
                    href={`/student/classrooms/${virtualClass.classroomId}`}
                    className="mt-1 inline-flex min-h-8 items-center font-body text-xs text-speaking-cobalt/70 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                  >
                    {virtualClass.classroomName}
                  </Link>
                  <time dateTime={virtualClass.scheduledAt} className="mt-1 block font-body text-sm text-speaking-cobalt/75">
                    {new Date(virtualClass.scheduledAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
                <a
                  href={virtualClass.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                >
                  Abrir clase
                </a>
              </li>
            ))}
          </ul>
        </DashboardSection>
      )}

      {upcomingVirtualClasses.length === 0 && pendingActivities.length === 0 && activeClassLessons.length === 0 && completedLessonHomework.length === 0 && (
        <section aria-labelledby="classroom-ready-title" className="relative isolate overflow-hidden rounded-2xl border border-speaking-cobalt/15 bg-gradient-to-br from-speaking-cobalt via-speaking-cobalt to-speaking-king px-5 py-6 text-white shadow-[0_16px_38px_rgba(16,52,105,0.18)] sm:px-7 sm:py-8">
          <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[38%] border-l border-white/10 bg-white/[0.035] sm:block" />
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-speaking-mustard/40 bg-speaking-mustard text-speaking-cobalt shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
                <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-speaking-mustard">Tu espacio de aprendizaje</p>
                <h2 id="classroom-ready-title" className="mt-1 font-title text-2xl text-white sm:text-3xl">No tienes actividades pendientes</h2>
                <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-white/85">Las clases, tareas o actividades que requieran una acción aparecerán aquí cuando tu profesor las comparta.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/15 pt-4 sm:min-w-48 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <p className="font-body text-sm font-medium text-white/75">Puedes revisar lo que ya completaste.</p>
              <Link href="/student/history" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-speaking-mustard px-4 font-body text-sm font-bold text-speaking-cobalt shadow-sm transition-colors hover:bg-speaking-mustard/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2">
                <History className="h-4 w-4" aria-hidden="true" />Ver historial<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}