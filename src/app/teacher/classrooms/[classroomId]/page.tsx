import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { prisma } from '../../../../lib/prisma';
import { requireTeacherId } from '../../../../lib/teacher-auth';
import { ActivityForm } from './ActivityForm';
import { GradeSubmissionForm } from './GradeSubmissionForm';
import { VirtualClassForm } from './VirtualClassForm';
import { ClassLessonForm } from './ClassLessonForm';
import { MarkVirtualClassTaughtButton } from '../../MarkVirtualClassTaughtButton';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { DashboardSection } from '../../../../components/dashboard/DashboardSection';
import { PageHeader } from '../../../../components/dashboard/PageHeader';
import { displayableText } from '../../../../lib/presentation-content';
import { ClassroomNameEditor } from './ClassroomNameEditor';
import { GroupLearningAssignmentForm } from './GroupLearningAssignmentForm';

export default async function TeacherClassroomPage({
  params,
  searchParams,
}: {
  params: Promise<{ classroomId: string }>;
  searchParams: Promise<{ virtualClassId?: string }>;
}) {
  const teacherId = await requireTeacherId();
  const [{ classroomId }, { virtualClassId }] = await Promise.all([params, searchParams]);
  const classroom = await prisma.classroom.findFirst({
    where: {
      id: classroomId,
      teacherId,
      status: 'ACTIVE',
    },
    select: {
      name: true,
      level: true,
      memberships: {
        where: {
          user: { is: { role: 'STUDENT' } },
        },
        select: {
          id: true,
          status: true,
          englishLevel: true,
          user: {
            select: {
              id: true,
              fullName: true,
              accessStatus: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      writtenActivities: {
        select: {
          id: true,
          title: true,
          prompt: true,
          createdAt: true,
          submissions: {
            select: {
              id: true,
              studentId: true,
              responseText: true,
              submittedAt: true,
              student: { select: { fullName: true } },
              submissionFeedback: { select: { score: true, comment: true } },
            },
            orderBy: { submittedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      classLessons: {
        select: {
          id: true,
          title: true,
          taughtAt: true,
          notes: true,
          improvementOpportunities: true,
          homework: true,
          practiceNode: { select: { id: true, title: true } },
          recipients: { select: { student: { select: { id: true, fullName: true } } } },
        },
        orderBy: { taughtAt: 'desc' },
      },
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
    },
  });

  if (!classroom) notFound();
  const [practiceNodes, dailyQuests] = await Promise.all([
    prisma.skillNode.findMany({ select: { id: true, title: true, cefrLevel: true }, orderBy: { levelRequired: 'asc' } }),
    prisma.dailyQuest.findMany({ where: { isActive: true }, select: { id: true, title: true, activityType: true, xpReward: true }, orderBy: { title: 'asc' } }),
  ]);
  const learningOptions = [
    ...dailyQuests.map((quest) => ({ id: quest.id, title: quest.title, type: 'MISSION' as const, detail: `${quest.activityType} · ${quest.xpReward} XP` })),
    ...practiceNodes.map((node) => ({ id: node.id, title: node.title, type: 'PRACTICE' as const, detail: node.cefrLevel ?? 'Práctica oral' })),
  ];
  const activeStudents = classroom.memberships
    .filter((membership) => membership.status === 'ACTIVE' && membership.user.accessStatus === 'ACTIVE')
    .map((membership) => ({ id: membership.user.id, name: membership.user.fullName }));
  const selectedVirtualClass = virtualClassId
    ? await prisma.virtualClass.findFirst({
        where: {
          id: virtualClassId,
          classroomId,
          status: 'COMPLETED',
          scheduledAt: { lte: new Date() },
          classroom: { is: { teacherId, status: 'ACTIVE' } },
        },
        select: { id: true, title: true, scheduledAt: true },
      })
    : null;
  const selectedFollowUp = selectedVirtualClass
    ? classroom.classLessons.find((lesson) => lesson.taughtAt.getTime() === selectedVirtualClass.scheduledAt.getTime()) ?? null
    : null;
  const visibleClassLessons = classroom.classLessons.filter((lesson) =>
    [lesson.title, lesson.notes, lesson.improvementOpportunities, lesson.homework, lesson.practiceNode?.title].some((value) => displayableText(value)),
  );
  const activeVirtualClasses = classroom.virtualClasses.filter((virtualClass) => virtualClass.status === 'SCHEDULED');
  const activeLessons = visibleClassLessons.filter((lesson) =>
    !classroom.virtualClasses.some((virtualClass) => virtualClass.status === 'COMPLETED' && virtualClass.scheduledAt.getTime() === lesson.taughtAt.getTime()),
  );
  const pendingWrittenActivities = classroom.writtenActivities.filter((activity) => {
    if (activeStudents.length === 0) return true;
    return activeStudents.some((student) => {
      const submission = activity.submissions.find(({ studentId }) => studentId === student.id);
      return !submission?.submissionFeedback;
    });
  });
  const activitiesWithGradesToReview = pendingWrittenActivities.filter((activity) =>
    activity.submissions.some((submission) =>
      activeStudents.some((student) => student.id === submission.studentId) && !submission.submissionFeedback,
    ),
  );
  const activitiesAwaitingDelivery = pendingWrittenActivities.filter((activity) =>
    activeStudents.length === 0 || activeStudents.some((student) =>
      !activity.submissions.some((submission) => submission.studentId === student.id),
    ),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
      <Link href="/teacher" className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">
        Volver a mis aulas
      </Link>

      <PageHeader
        eyebrow="Aula del profesor"
        title={classroom.name}
        description={`${activeStudents.length} estudiantes activos`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ClassroomNameEditor classroomId={classroomId} currentName={classroom.name} />
            <Link href="/teacher/history" className="inline-flex min-h-11 items-center justify-center rounded-full border border-speaking-cobalt/15 px-4 py-2 font-body text-sm font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2">Historial</Link>
          </div>
        }
      />

      <DashboardSection title="Asignar al grupo" description="Planifica una misión diaria o práctica de escucha y habla para varios estudiantes a la vez.">
        <GroupLearningAssignmentForm classroomId={classroomId} students={activeStudents} learningOptions={learningOptions} />
      </DashboardSection>

      <DashboardSection title="Clases virtuales" description="Consulta y administra las sesiones programadas.">
          {activeVirtualClasses.length === 0 ? (
          <EmptyState title="No hay clases programadas" description="Las próximas sesiones de esta aula aparecerán aquí." />
        ) : (
          <ul className="divide-y divide-speaking-cobalt/10">
            {activeVirtualClasses.map((virtualClass) => (
              <li key={virtualClass.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-title text-lg text-speaking-cobalt">{displayableText(virtualClass.title) ?? 'Clase virtual'}</h3>
                    <StatusBadge tone="neutral">Programada</StatusBadge>
                  </div>
                  <time dateTime={virtualClass.scheduledAt.toISOString()} className="font-body text-sm text-speaking-cobalt/75">
                    {virtualClass.scheduledAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
                <div className="mt-3 flex flex-col gap-2 border-t border-speaking-cobalt/10 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                  <a
                    href={virtualClass.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                  >
                    Abrir enlace de la clase
                  </a>
                  <MarkVirtualClassTaughtButton
                    classroomId={classroomId}
                    virtualClassId={virtualClass.id}
                    canMark={virtualClass.scheduledAt <= new Date()}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 border-t border-speaking-cobalt/10 pt-5">
          <h3 className="font-title text-lg text-speaking-cobalt">Programar clase virtual</h3>
          <VirtualClassForm classroomId={classroomId} />
        </div>
      </DashboardSection>

      <DashboardSection title="Seguimiento pedagógico" description="Apuntes, recomendaciones y prácticas compartidas con estudiantes.">
        <section id="class-lessons-heading" className="scroll-mt-6" aria-labelledby="class-lessons-title">
          <h3 id="class-lessons-title" className="sr-only">Apuntes y seguimiento de clases</h3>
          {activeLessons.length === 0 ? (
            <EmptyState title="Todavía no hay seguimientos" description="Los registros compartidos aparecerán aquí." />
          ) : (
            <ul className="divide-y divide-speaking-cobalt/10">
              {activeLessons.map((lesson) => (
                <li key={lesson.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      {displayableText(lesson.title) && <h3 className="font-title text-lg text-speaking-cobalt">{displayableText(lesson.title)}</h3>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge tone="info">Seguimiento registrado</StatusBadge>
                      </div>
                    </div>
                    <time dateTime={lesson.taughtAt.toISOString()} className="font-body text-xs text-speaking-cobalt/65">
                      {lesson.taughtAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                  </div>
                  {lesson.recipients.length > 0 && <p className="mt-2 font-body text-xs text-speaking-cobalt/65">Compartido con: {lesson.recipients.map(({ student }) => student.fullName).join(', ')}</p>}
                  {displayableText(lesson.notes) && <p className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(lesson.notes)}</p>}
                  {displayableText(lesson.improvementOpportunities) && (
                    <div className="mt-3">
                      <h4 className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Oportunidades de mejora</h4>
                      <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(lesson.improvementOpportunities)}</p>
                    </div>
                  )}
                  {displayableText(lesson.homework) && (
                    <div className="mt-3">
                      <h4 className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Tareas</h4>
                      <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(lesson.homework)}</p>
                    </div>
                  )}
                  {displayableText(lesson.practiceNode?.title) && <p className="mt-3 font-body text-sm font-semibold text-speaking-cobalt">Práctica asignada: {displayableText(lesson.practiceNode?.title)}</p>}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-speaking-cobalt/10 pt-5">
            <h3 className="font-title text-lg text-speaking-cobalt">Registrar una clase dictada</h3>
            {activeStudents.length === 0 ? (
              <p className="mt-3 font-body text-sm text-speaking-cobalt/70">Añade estudiantes activos al aula para compartir apuntes y tareas.</p>
            ) : (
              <ClassLessonForm
                classroomId={classroomId}
                students={activeStudents}
                practiceNodes={practiceNodes}
                virtualClassId={selectedVirtualClass?.id}
                initialTitle={selectedFollowUp?.title ?? selectedVirtualClass?.title}
                initialTaughtAt={selectedVirtualClass?.scheduledAt.toISOString().slice(0, 16)}
                initialTaughtAtLabel={selectedVirtualClass?.scheduledAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                initialNotes={selectedFollowUp?.notes}
                initialImprovements={selectedFollowUp?.improvementOpportunities ?? ''}
                initialHomework={selectedFollowUp?.homework ?? ''}
                initialPracticeNodeId={selectedFollowUp?.practiceNode?.id ?? ''}
                initialRecipientIds={selectedFollowUp?.recipients.map(({ student }) => student.id)}
              />
            )}
          </div>
        </section>
      </DashboardSection>

      <DashboardSection title="Actividades escritas" description="Crea actividades, revisa entregas y consulta el trabajo pendiente.">
        <section aria-labelledby="create-written-activity-heading" className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center bg-speaking-mustard font-title text-sm text-speaking-cobalt">+</span>
            <h3 id="create-written-activity-heading" className="font-title text-lg text-speaking-cobalt">Crear actividad</h3>
          </div>
          <ActivityForm classroomId={classroomId} />
        </section>

        <section className="mt-6 border-t border-speaking-cobalt/10 pt-5" aria-labelledby="pending-written-activity-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id="pending-written-activity-heading" className="font-title text-lg text-speaking-cobalt">Entregas pendientes de calificar</h3>
              <p className="mt-1 font-body text-sm text-speaking-cobalt/65">Revisa la respuesta y deja una nota con feedback.</p>
            </div>
            {activitiesWithGradesToReview.length > 0 && <StatusBadge tone="warning">{activitiesWithGradesToReview.reduce((total, activity) => total + activity.submissions.filter((submission) => activeStudents.some((student) => student.id === submission.studentId) && !submission.submissionFeedback).length, 0)} por revisar</StatusBadge>}
          </div>
          {activitiesWithGradesToReview.length === 0 ? (
          <p className="mt-3 border-l-2 border-speaking-success/50 bg-speaking-success/5 px-3 py-3 font-body text-sm text-speaking-cobalt/75">Todo calificado por ahora.</p>
        ) : (
          <ul className="mt-3 divide-y divide-speaking-cobalt/10">
            {activitiesWithGradesToReview.map((activity) => (
              <li key={activity.id} className="border-l-2 border-speaking-streak/45 py-5 pl-4 first:pt-3 last:pb-0 sm:pl-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-title text-lg text-speaking-cobalt">{displayableText(activity.title) ?? 'Actividad'}</h4>
                      <StatusBadge tone="warning">Pendiente de calificar</StatusBadge>
                    </div>
                    <p className="mt-1 font-body text-xs text-speaking-cobalt/65">{activity.submissions.filter((submission) => activeStudents.some((student) => student.id === submission.studentId)).length} entregas recibidas · Sin fecha límite</p>
                  </div>
                  <time dateTime={activity.createdAt.toISOString()} className="shrink-0 font-body text-xs text-speaking-cobalt/65">
                    {activity.createdAt.toLocaleDateString('es')}
                  </time>
                </div>
                {displayableText(activity.prompt) && <p className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(activity.prompt)}</p>}
                <section className="mt-5 border-t border-speaking-cobalt/10 pt-4" aria-label={`Entregas de ${activity.title}`}>
                  <h4 className="font-body text-sm font-semibold text-speaking-cobalt">Entregas por revisar ({activity.submissions.filter((submission) => activeStudents.some((student) => student.id === submission.studentId) && !submission.submissionFeedback).length})</h4>
                  {
                    <ul className="mt-3 divide-y divide-speaking-cobalt/10">
                      {activity.submissions.filter((submission) => activeStudents.some((student) => student.id === submission.studentId) && !submission.submissionFeedback).map((submission) => (
                        <li key={submission.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-body text-sm font-semibold text-speaking-cobalt">{submission.student.fullName}</h5>
                              <StatusBadge tone="warning">Pendiente de calificar</StatusBadge>
                            </div>
                            <time dateTime={submission.submittedAt.toISOString()} className="font-body text-xs text-speaking-cobalt/65">
                              {submission.submittedAt.toLocaleDateString('es')}
                            </time>
                          </div>
                          <div className="mt-3 border-l-2 border-speaking-cobalt/20 bg-speaking-white px-3 py-3 sm:px-4">
                            <p className="whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/85">{submission.responseText}</p>
                          </div>
                          <div className="mt-4">
                            <GradeSubmissionForm
                              classroomId={classroomId}
                              submissionId={submission.id}
                              initialScore={submission.submissionFeedback?.score ?? null}
                              initialComment={submission.submissionFeedback?.comment ?? null}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  }
                </section>
              </li>
            ))}
          </ul>
        )}
        </section>

        <section className="mt-6 border-t border-speaking-cobalt/10 pt-5" aria-labelledby="active-written-activity-heading">
          <div>
            <h3 id="active-written-activity-heading" className="font-title text-lg text-speaking-cobalt">Actividades activas</h3>
            <p className="mt-1 font-body text-sm text-speaking-cobalt/65">Seguimiento de entregas y revisiones por actividad.</p>
          </div>
          {activitiesAwaitingDelivery.length === 0 ? (
            <EmptyState title="No hay actividades activas" description="Las actividades que requieran entregas o revisión aparecerán aquí." />
          ) : (
            <ul className="mt-3 divide-y divide-speaking-cobalt/10">
              {activitiesAwaitingDelivery.map((activity) => {
                const pendingSubmissions = activity.submissions.filter((submission) => activeStudents.some((student) => student.id === submission.studentId) && !submission.submissionFeedback).length;
                const pendingDeliveries = activeStudents.filter((student) => !activity.submissions.some((submission) => submission.studentId === student.id)).length;
                return (
                    <li key={activity.id} className="my-3 flex flex-col gap-3 border border-speaking-cobalt/10 border-l-4 border-l-speaking-king/70 bg-speaking-white p-4 first:mt-0 last:mb-0 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-title text-base text-speaking-cobalt">{displayableText(activity.title) ?? 'Actividad'}</h4>
                        <StatusBadge tone="info">Activa</StatusBadge>
                      </div>
                      {displayableText(activity.prompt) && <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(activity.prompt)}</p>}
                      <p className="mt-2 font-body text-xs text-speaking-cobalt/65">Creada {activity.createdAt.toLocaleDateString('es', { dateStyle: 'medium' })} · Sin fecha límite</p>
                    </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {pendingDeliveries > 0 && <StatusBadge tone="neutral">{pendingDeliveries} pendientes de entregar</StatusBadge>}
                        {pendingSubmissions > 0 && <StatusBadge tone="warning">{pendingSubmissions} pendientes de calificar</StatusBadge>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </DashboardSection>

      <DashboardSection title={`Gestionar estudiantes (${classroom.memberships.filter(({ status }) => status === 'ACTIVE').length} activos)`} description="Abre el progreso individual, actualiza el nivel y contacta al estudiante desde aquí.">
        {classroom.memberships.length === 0 ? (
          <EmptyState title="No hay estudiantes en el aula" description="Los estudiantes inscritos aparecerán aquí." />
        ) : (
          <ul className="divide-y divide-speaking-cobalt/10">
            {classroom.memberships.map((membership) => (
              <li key={membership.id} className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link
                    href={`/teacher/classrooms/${classroomId}/students/${membership.user.id}`}
                    className="inline-flex min-h-11 items-center font-body font-semibold text-speaking-cobalt underline-offset-4 hover:text-speaking-king hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                  >
                    {membership.user.fullName}
                  </Link>
                  <p className="font-body text-sm text-speaking-cobalt/70">
                    Nivel de inglés: <span className="font-semibold text-speaking-cobalt">{membership.englishLevel ?? 'Sin asignar'}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/teacher/classrooms/${classroomId}/students/${membership.user.id}#english-level`}
                    className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:text-speaking-king hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                  >
                    Actualizar nivel
                  </Link>
                  {membership.status === 'ACTIVE' && membership.user.accessStatus === 'ACTIVE' && <Link
                    href={`/teacher/messages?contact=${membership.user.id}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-speaking-cobalt/15 bg-white px-3 font-body text-sm font-semibold text-speaking-cobalt transition-colors hover:border-speaking-king/30 hover:bg-speaking-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
                  >
                    <MessageCircle className="h-4 w-4 text-speaking-king" aria-hidden="true" />Mensaje
                  </Link>}
                  {membership.status === 'INACTIVE' && <span className="font-body text-xs text-speaking-cobalt/60">Membresía inactiva</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </main>
  );
}