import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { requireTeacherId } from '../../../lib/teacher-auth';
import { TeacherSidebarNav } from '../../../components/TeacherSidebarNav';
import { VirtualClassAttendanceControl } from '../VirtualClassAttendanceControl';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { DashboardSection } from '../../../components/dashboard/DashboardSection';
import { PageHeader } from '../../../components/dashboard/PageHeader';

function displayableText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && !['na', 'n/a', 'null', 'undefined', '-'].includes(trimmed.toLowerCase()) ? trimmed : null;
}

export default async function TeacherClassHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; studentId?: string }>;
}) {
  const teacherId = await requireTeacherId();
  const search = await searchParams;
  const [teacher, ownedClassrooms, historyMemberships] = await Promise.all([
    prisma.user.findUnique({ where: { id: teacherId }, select: { fullName: true } }),
    prisma.classroom.findMany({ where: { teacherId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.classroomMembership.findMany({
      where: { classroom: { is: { teacherId } }, user: { is: { role: 'STUDENT' } } },
      select: { userId: true, classroomId: true, user: { select: { fullName: true } } },
      orderBy: [{ user: { fullName: 'asc' } }, { classroom: { name: 'asc' } }],
    }),
  ]);

  const selectedClassroomId = ownedClassrooms.some(({ id }) => id === search.classroomId) ? search.classroomId : undefined;
  const selectableMemberships = historyMemberships.filter(({ classroomId }) => !selectedClassroomId || classroomId === selectedClassroomId);
  const selectedStudentId = search.studentId && selectableMemberships.some(({ userId }) => userId === search.studentId)
    ? search.studentId
    : undefined;
  const classroomFilter = selectedClassroomId ? { id: selectedClassroomId } : {};
  const studentFilter = selectedStudentId ? { studentId: selectedStudentId } : {};

  const [virtualClasses, dailyQuestHistory, writtenActivities] = await Promise.all([
    prisma.virtualClass.findMany({
      where: {
        status: 'COMPLETED',
        classroom: { is: { teacherId, ...classroomFilter } },
        ...(selectedStudentId ? { attendances: { some: { studentId: selectedStudentId } } } : {}),
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        classroomId: true,
        attendances: {
          where: studentFilter,
          select: { studentId: true, status: true, student: { select: { fullName: true } } },
          orderBy: { student: { fullName: 'asc' } },
        },
        classroom: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.userDailyQuest.findMany({
      where: {
        status: 'COMPLETED',
        ...(selectedStudentId ? { userId: selectedStudentId } : {}),
        user: {
          is: {
            classroomMemberships: {
              some: {
                classroom: { is: { teacherId, ...classroomFilter } },
              },
            },
          },
        },
      } satisfies Prisma.UserDailyQuestWhereInput,
      select: {
        id: true,
        assignedDate: true,
        completedAt: true,
        quest: { select: { title: true, description: true, activityType: true, xpReward: true, coinReward: true } },
        user: {
          select: {
            id: true,
            fullName: true,
            classroomMemberships: {
              where: { classroom: { is: { teacherId, ...classroomFilter } } },
              select: { classroom: { select: { id: true, name: true } } },
              orderBy: { classroom: { name: 'asc' } },
            },
          },
        },
      },
      orderBy: [{ completedAt: 'desc' }, { assignedDate: 'desc' }],
    }),
    prisma.writtenActivity.findMany({
      where: { classroom: { is: { teacherId, ...classroomFilter } } },
      select: {
        id: true,
        title: true,
        prompt: true,
        createdAt: true,
        classroom: {
          select: {
            id: true,
            name: true,
            memberships: {
              where: {
                status: 'ACTIVE',
                user: { is: { role: 'STUDENT', accessStatus: 'ACTIVE', ...(selectedStudentId ? { id: selectedStudentId } : {}) } },
              },
              select: { userId: true },
            },
          },
        },
        submissions: {
          where: studentFilter,
          select: {
            studentId: true,
            responseText: true,
            submittedAt: true,
            student: { select: { fullName: true } },
            submissionFeedback: { select: { id: true, score: true, comment: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const classroomIds = [...new Set(virtualClasses.map(({ classroomId }) => classroomId))];
  const classLessons = virtualClasses.length === 0
    ? []
    : await prisma.classLesson.findMany({
        where: {
          classroomId: { in: classroomIds },
          taughtAt: { in: virtualClasses.map(({ scheduledAt }) => scheduledAt) },
        },
        select: {
          id: true,
          classroomId: true,
          title: true,
          taughtAt: true,
          notes: true,
          improvementOpportunities: true,
          homework: true,
          practiceNode: { select: { title: true } },
          recipients: { where: studentFilter, select: { student: { select: { fullName: true } } } },
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
  const closedActivities = writtenActivities.filter((activity) =>
    activity.classroom.memberships.length > 0 && activity.classroom.memberships.every(({ userId }) =>
      activity.submissions.some((submission) => submission.studentId === userId && submission.submissionFeedback),
    ),
  );
  const dailyMissionsByStudent = new Map<string, { id: string; fullName: string; classrooms: { id: string; name: string }[]; assignments: typeof dailyQuestHistory }>();
  for (const assignment of dailyQuestHistory) {
    const student = dailyMissionsByStudent.get(assignment.user.id) ?? {
      id: assignment.user.id,
      fullName: assignment.user.fullName,
      classrooms: assignment.user.classroomMemberships.map(({ classroom }) => classroom),
      assignments: [],
    };
    student.assignments.push(assignment);
    dailyMissionsByStudent.set(student.id, student);
  }
  const studentOptions = [...new Map(selectableMemberships.map(({ userId, user }) => [userId, { id: userId, name: user.fullName }])).values()];
  const classLessonByClassAndDate = new Map<string, (typeof classLessons)[number]>();
  for (const classLesson of classLessons) {
    const key = `${classLesson.classroomId}:${classLesson.taughtAt.getTime()}`;
    if (!classLessonByClassAndDate.has(key)) classLessonByClassAndDate.set(key, classLesson);
  }

  const byMonth = new Map<string, { label: string; classes: typeof virtualClasses }>();
  for (const virtualClass of virtualClasses) {
    const monthKey = `${virtualClass.scheduledAt.getFullYear()}-${String(virtualClass.scheduledAt.getMonth() + 1).padStart(2, '0')}`;
    const month = byMonth.get(monthKey) ?? {
      label: virtualClass.scheduledAt.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      classes: [],
    };
    month.classes.push(virtualClass);
    byMonth.set(monthKey, month);
  }

  return (
    <div className="flex min-h-screen flex-col bg-speaking-white md:flex-row">
      <TeacherSidebarNav active="history" />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <PageHeader
            eyebrow="Panel del profesor"
            title="Historial docente"
            description={`${teacher?.fullName ?? 'Profesor'} · clases, actividades y misiones completadas`}
          />

          <section aria-label="Filtrar historial" className="rounded-2xl border border-speaking-cobalt/10 bg-gradient-to-br from-white to-speaking-background p-4 shadow-[0_8px_28px_rgba(16,52,105,0.06)] sm:p-5">
            <form method="get" action="/teacher/history#daily-mission-history" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
              <div>
                <label htmlFor="history-classroom" className="block font-body text-sm font-semibold text-speaking-cobalt">Aula</label>
                <select id="history-classroom" name="classroomId" defaultValue={selectedClassroomId ?? ''} className="mt-1 min-h-11 w-full border border-speaking-cobalt/15 bg-white px-3 font-body text-sm text-speaking-cobalt focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15">
                  <option value="">Todas mis aulas</option>
                  {ownedClassrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="history-student" className="block font-body text-sm font-semibold text-speaking-cobalt">Estudiante</label>
                <select id="history-student" name="studentId" defaultValue={selectedStudentId ?? ''} className="mt-1 min-h-11 w-full border border-speaking-cobalt/15 bg-white px-3 font-body text-sm text-speaking-cobalt focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15">
                  <option value="">Todos mis estudiantes</option>
                  {studentOptions.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </select>
              </div>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-5 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2">Filtrar historial</button>
              {(selectedClassroomId || selectedStudentId) && <Link href="/teacher/history" className="inline-flex min-h-11 items-center justify-center px-3 font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline">Limpiar</Link>}
            </form>
          </section>

          <div id="daily-mission-history" className="scroll-mt-6">
            <DashboardSection title="Misiones completadas" description="Historial agrupado por estudiante. Filtra por aula para ver solo la actividad de ese grupo.">
              {dailyQuestHistory.length === 0 ? (
                <EmptyState title="Aún no hay misiones completadas" description="Cuando tus estudiantes completen una misión, aparecerá aquí junto con su fecha y aula." />
              ) : (
                <div className="space-y-5">
                  {[...dailyMissionsByStudent.values()].map((student) => (
                    <section key={student.id} className="overflow-hidden rounded-xl border border-speaking-cobalt/10 bg-gradient-to-br from-white to-speaking-background/80">
                      <div className="flex flex-col gap-3 border-b border-speaking-cobalt/10 bg-speaking-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                          <h3 className="font-title text-lg text-speaking-cobalt">{student.fullName}</h3>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {student.classrooms.map((classroom) => <span key={classroom.id} className="inline-flex items-center rounded-full border border-speaking-cobalt/10 bg-white px-2.5 py-1 font-body text-xs font-medium text-speaking-cobalt/75">{classroom.name}</span>)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {student.classrooms.map((classroom) => <Link key={classroom.id} href={`/teacher/classrooms/${classroom.id}/students/${student.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-speaking-cobalt/15 bg-white px-3 font-body text-sm font-semibold text-speaking-cobalt transition-colors hover:border-speaking-king/30 hover:bg-speaking-white">Abrir en {classroom.name}</Link>)}
                        </div>
                      </div>
                      <ul className="divide-y divide-speaking-cobalt/10 px-4 sm:px-5">
                        {student.assignments.map((assignment) => (
                          <li key={assignment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-body text-sm font-bold text-speaking-cobalt">{assignment.quest.title}</h4>
                                <StatusBadge tone="success">Completada</StatusBadge>
                              </div>
                              <p className="mt-1 font-body text-sm leading-6 text-speaking-cobalt/75">{assignment.quest.description}</p>
                              <p className="mt-1 font-body text-sm font-medium text-speaking-king">{assignment.quest.activityType} · {assignment.quest.xpReward} XP · {assignment.quest.coinReward} monedas</p>
                            </div>
                            <time dateTime={assignment.completedAt?.toISOString() ?? assignment.assignedDate.toISOString()} className="shrink-0 font-body text-sm text-speaking-cobalt/70">
                              {assignment.completedAt?.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) ?? assignment.assignedDate.toLocaleDateString('es-ES', { timeZone: 'UTC', dateStyle: 'medium' })}
                            </time>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </DashboardSection>
          </div>

          {byMonth.size === 0 && closedActivities.length === 0 && dailyQuestHistory.length === 0 ? (
            <EmptyState
              title="Todavía no hay clases ni actividades completadas"
              description="Las clases dictadas y las actividades calificadas aparecerán aquí al aplicar el filtro seleccionado."
            />
          ) : (
            <div className="space-y-6">
              {[...byMonth.entries()].map(([monthKey, month]) => (
                <DashboardSection
                  key={monthKey}
                  title={month.label}
                  description={`${month.classes.length} ${month.classes.length === 1 ? 'clase dictada' : 'clases dictadas'}`}
                >
                  <ul className="divide-y divide-speaking-cobalt/10">
                    {month.classes.map((virtualClass) => (
                      (() => {
                        const followUp = classLessonByClassAndDate.get(`${virtualClass.classroomId}:${virtualClass.scheduledAt.getTime()}`);
                        const showFollowUp = followUp && (
                          displayableText(followUp.notes) ||
                          displayableText(followUp.improvementOpportunities) ||
                          displayableText(followUp.homework) ||
                          displayableText(followUp.practiceNode?.title) ||
                          followUp.recipients.length > 0
                        );
                        return (
                      <li key={virtualClass.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {displayableText(virtualClass.title) && <h3 className="font-title text-lg text-speaking-cobalt">{displayableText(virtualClass.title)}</h3>}
                              <StatusBadge tone="success">Clase dictada</StatusBadge>
                              <StatusBadge tone={followUp ? 'success' : 'warning'}>
                                {followUp ? 'Seguimiento registrado' : 'Pendiente de seguimiento'}
                              </StatusBadge>
                            </div>
                            {displayableText(virtualClass.classroom.name) && <p className="mt-2 font-body text-sm text-speaking-cobalt/70">{displayableText(virtualClass.classroom.name)}</p>}
                          </div>
                          <time dateTime={virtualClass.scheduledAt.toISOString()} className="shrink-0 font-body text-sm text-speaking-cobalt/65">
                            {virtualClass.scheduledAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                          </time>
                        </div>
                        {virtualClass.attendances.length > 0 && (
                          <section className="mt-4 border-t border-speaking-cobalt/10 pt-3" aria-label={`Asistencia: ${virtualClass.title}`}>
                            <h4 className="font-body text-xs font-semibold text-speaking-cobalt/75">Asistencia</h4>
                            <ul className="mt-2 divide-y divide-speaking-cobalt/10">
                              {virtualClass.attendances.map((attendance) => (
                                <li key={attendance.studentId} className="flex flex-col justify-between gap-2 py-2 sm:flex-row sm:items-center">
                                  <span className="font-body text-sm text-speaking-cobalt/80">{attendance.student.fullName}</span>
                                  <VirtualClassAttendanceControl
                                    classroomId={virtualClass.classroomId}
                                    virtualClassId={virtualClass.id}
                                    studentId={attendance.studentId}
                                    status={attendance.status}
                                  />
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                        {virtualClass.attendances.length === 0 && (
                          <p className="mt-4 border-t border-speaking-cobalt/10 pt-3 font-body text-sm text-speaking-cobalt/65">
                            No hay estudiantes registrados para esta clase.
                          </p>
                        )}
                        {showFollowUp && followUp && (
                          <section className="mt-4 space-y-3 border-t border-speaking-cobalt/10 pt-4" aria-label={`Seguimiento: ${virtualClass.title}`}>
                            {displayableText(followUp.notes) && <div>
                              <h4 className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Apuntes</h4>
                              <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(followUp.notes)}</p>
                            </div>}
                            {displayableText(followUp.improvementOpportunities) && (
                              <div>
                                <h4 className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Oportunidades de mejora</h4>
                                <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(followUp.improvementOpportunities)}</p>
                              </div>
                            )}
                            {displayableText(followUp.homework) && (
                              <div>
                                <h4 className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Tareas</h4>
                                <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(followUp.homework)}</p>
                              </div>
                            )}
                            {displayableText(followUp.practiceNode?.title) && <p className="font-body text-sm font-semibold text-speaking-cobalt">Práctica: {displayableText(followUp.practiceNode?.title)}</p>}
                            {followUp.recipients.length > 0 && <p className="font-body text-xs text-speaking-cobalt/60">Destinatarios: {followUp.recipients.map(({ student }) => student.fullName).join(', ')}</p>}
                          </section>
                        )}
                        <div className="mt-4 border-t border-speaking-cobalt/10 pt-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                            <Link
                              href={`/teacher/classrooms/${virtualClass.classroomId}?virtualClassId=${virtualClass.id}#class-lessons-heading`}
                              className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                            >
                              {followUp ? 'Ver/editar seguimiento' : 'Registrar seguimiento'}
                            </Link>
                          </div>
                        </div>
                      </li>
                        );
                      })()
                    ))}
                  </ul>
                </DashboardSection>
              ))}
            </div>
          )}
          {closedActivities.length > 0 && (
            <DashboardSection title="Actividades completadas" description="Historial de actividades con entregas calificadas para los estudiantes activos.">
              <ul className="divide-y divide-speaking-cobalt/10">
                {closedActivities.map((activity) => (
                  <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {displayableText(activity.title) && <h3 className="font-title text-base text-speaking-cobalt">{displayableText(activity.title)}</h3>}
                        <StatusBadge tone="success">Calificada</StatusBadge>
                      </div>
                      <p className="mt-1 font-body text-sm text-speaking-cobalt/70">{activity.classroom.name}</p>
                      {displayableText(activity.prompt) && <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(activity.prompt)}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                      <time dateTime={activity.createdAt.toISOString()} className="font-body text-xs text-speaking-cobalt/65">{activity.createdAt.toLocaleDateString('es-ES', { dateStyle: 'medium' })}</time>
                      <Link href={`/teacher/classrooms/${activity.classroom.id}`} className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">Abrir aula</Link>
                    </div>
                    </div>
                    <ul className="mt-4 divide-y divide-speaking-cobalt/10 border-t border-speaking-cobalt/10">
                      {activity.submissions.filter((submission) => submission.submissionFeedback).map((submission) => (
                        <li key={submission.studentId} className="py-3 first:pt-3 last:pb-0">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-body text-sm font-semibold text-speaking-cobalt">{submission.student.fullName}</p>
                            <time dateTime={submission.submittedAt.toISOString()} className="font-body text-xs text-speaking-cobalt/65">{submission.submittedAt.toLocaleDateString('es-ES', { dateStyle: 'medium' })}</time>
                          </div>
                          {displayableText(submission.responseText) && <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(submission.responseText)}</p>}
                          {submission.submissionFeedback?.score != null && <p className="mt-2 font-body text-sm font-semibold text-speaking-cobalt">Calificación: {submission.submissionFeedback.score}/20</p>}
                          {displayableText(submission.submissionFeedback?.comment) && <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(submission.submissionFeedback?.comment)}</p>}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}
        </div>
      </main>
    </div>
  );
}