import Link from 'next/link';
import { prisma } from '../../../lib/prisma';
import { requireStudentId } from '../../../lib/student-auth';
import { StudentSidebarNav } from '../../../components/StudentSidebarNav';
import { CompletedClassHistory } from '../../../components/dashboard/CompletedClassHistory';
import { PageHeader } from '../../../components/dashboard/PageHeader';
import { displayableText } from '../../../lib/presentation-content';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SubmissionForm } from '../classrooms/[classroomId]/SubmissionForm';

export default async function StudentClassHistoryPage() {
  const studentId = await requireStudentId();
  const [virtualClasses, submissions, dailyQuests, completedSkillProgress, lessonProgress] = await Promise.all([
    prisma.virtualClass.findMany({
    where: {
      status: 'COMPLETED',
      classroom: {
        is: {
          status: 'ACTIVE',
          memberships: { some: { userId: studentId, status: 'ACTIVE' } },
        },
      },
    },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      classroomId: true,
      classroom: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'desc' },
    }),
    prisma.activitySubmission.findMany({
      where: { studentId },
      select: {
        id: true,
        responseText: true,
        submittedAt: true,
        submissionFeedback: { select: { score: true, comment: true } },
        activity: {
          select: {
            id: true,
            title: true,
            prompt: true,
            classroom: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.userDailyQuest.findMany({
      where: { userId: studentId, status: { in: ['COMPLETED', 'EXPIRED'] } },
      select: {
        id: true,
        status: true,
        completedAt: true,
        assignedDate: true,
        quest: { select: { title: true, description: true, activityType: true, resourceUrl: true } },
      },
      orderBy: { assignedDate: 'desc' },
    }),
    prisma.userSkillProgress.findMany({
      where: { userId: studentId, status: 'COMPLETED' },
      select: { id: true, nodeId: true, completedAt: true, node: { select: { title: true, description: true } } },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId: studentId, completedAt: { not: null } },
      select: { nodeId: true, completedAt: true, score: true, node: { select: { title: true, description: true } } },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  const classLessons = virtualClasses.length
    ? await prisma.classLesson.findMany({
        where: {
          classroomId: { in: [...new Set(virtualClasses.map((virtualClass) => virtualClass.classroomId))] },
          taughtAt: { in: virtualClasses.map((virtualClass) => virtualClass.scheduledAt) },
          recipients: { some: { studentId } },
        },
        select: {
          classroomId: true,
          taughtAt: true,
          notes: true,
          improvementOpportunities: true,
        },
      })
    : [];
  const classLessonByDate = new Map(
    classLessons.map((lesson) => [`${lesson.classroomId}:${lesson.taughtAt.getTime()}`, lesson]),
  );

  const classes = virtualClasses.map((virtualClass) => {
    const lesson = classLessonByDate.get(`${virtualClass.classroomId}:${virtualClass.scheduledAt.getTime()}`);
    return {
      id: virtualClass.id,
      title: virtualClass.title,
      taughtAt: virtualClass.scheduledAt.toISOString(),
      classroomId: virtualClass.classroomId,
      classroomName: virtualClass.classroom.name,
      notes: lesson?.notes ?? null,
      improvementOpportunities: lesson?.improvementOpportunities ?? null,
    };
  });
  const completedSkillNodeIds = new Set(completedSkillProgress.map(({ nodeId }) => nodeId));
  const additionalLessonProgress = lessonProgress.filter((progress) => !completedSkillNodeIds.has(progress.nodeId));

  return (
    <div className="flex min-h-screen flex-col bg-speaking-white md:flex-row">
      <StudentSidebarNav active="history" />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <PageHeader
            eyebrow="Espacio del estudiante"
            title="Historial del estudiante"
            description={`${classes.length} clases · ${submissions.length} entregas · ${dailyQuests.length} misiones · ${completedSkillProgress.length + additionalLessonProgress.length} prácticas y lecciones`}
          />
          {(classes.length > 0 || (submissions.length === 0 && dailyQuests.length === 0 && completedSkillProgress.length === 0 && additionalLessonProgress.length === 0)) && (
            <div><CompletedClassHistory classes={classes} /></div>
          )}
          {submissions.length > 0 && (
            <section aria-labelledby="student-submissions-history-heading" className="border border-speaking-cobalt/12 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-speaking-cobalt/10 pb-3">
                <div>
                  <h2 id="student-submissions-history-heading" className="font-title text-xl text-speaking-cobalt">Actividades escritas</h2>
                  <p className="mt-1 font-body text-sm text-speaking-cobalt/65">Tus respuestas y feedback del profesor.</p>
                </div>
                <StatusBadge tone="neutral">{submissions.length} entregas</StatusBadge>
              </div>
              <ul className="mt-4 space-y-3">
                {submissions.map((submission) => (
                  <li key={submission.id} className={`border border-speaking-cobalt/10 border-l-4 p-4 sm:p-5 ${submission.submissionFeedback ? 'border-l-speaking-success/70 bg-white' : 'border-l-speaking-king/70 bg-speaking-white'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-king">Actividad escrita</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {displayableText(submission.activity.title) && <h3 className="font-title text-lg text-speaking-cobalt">{displayableText(submission.activity.title)}</h3>}
                          <StatusBadge tone={submission.submissionFeedback ? 'success' : 'info'}>{submission.submissionFeedback ? 'Calificada' : 'Entregada'}</StatusBadge>
                        </div>
                        {displayableText(submission.activity.classroom.name) && <p className="mt-1 font-body text-xs font-medium text-speaking-cobalt/60">{displayableText(submission.activity.classroom.name)}</p>}
                      </div>
                      <time dateTime={submission.submittedAt.toISOString()} className="shrink-0 font-body text-xs text-speaking-cobalt/60">
                        {submission.submittedAt.toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                      </time>
                    </div>
                    {displayableText(submission.activity.prompt) && <p className="mt-4 border-l-2 border-speaking-cobalt/15 bg-white px-3 py-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(submission.activity.prompt)}</p>}
                    {displayableText(submission.responseText) && <p className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/85">{displayableText(submission.responseText)}</p>}
                    {submission.submissionFeedback?.score != null && <p className="mt-3 font-title text-lg text-speaking-king">{submission.submissionFeedback.score}<span className="font-body text-xs font-normal text-speaking-cobalt/60"> / 20</span></p>}
                    {displayableText(submission.submissionFeedback?.comment) && (
                      <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(submission.submissionFeedback?.comment)}</p>
                    )}
                    <Link href={`/student/classrooms/${submission.activity.classroom.id}#student-pending-tasks`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 sm:w-auto">Abrir actividad</Link>
                    <SubmissionForm
                      classroomId={submission.activity.classroom.id}
                      activityId={submission.activity.id}
                      initialResponse={submission.responseText}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(dailyQuests.length > 0 || completedSkillProgress.length > 0 || additionalLessonProgress.length > 0) && (
            <section aria-labelledby="student-learning-history-heading" className="rounded-2xl border border-speaking-cobalt/12 bg-white p-4 sm:p-5">
              <h2 id="student-learning-history-heading" className="font-title text-xl text-speaking-cobalt">Progreso y misiones</h2>
              <ul className="mt-4 divide-y divide-speaking-cobalt/10">
                {dailyQuests.map((quest) => (
                  <li key={quest.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {displayableText(quest.quest.title) && <h3 className="font-body text-sm font-semibold text-speaking-cobalt">{displayableText(quest.quest.title)}</h3>}
                      <p className="text-xs text-speaking-cobalt/65">{quest.quest.activityType} · {quest.status === 'COMPLETED' ? 'Completada' : 'Vencida'}</p>
                      {displayableText(quest.quest.description) && <p className="mt-1 font-body text-sm leading-5 text-speaking-cobalt/70">{displayableText(quest.quest.description)}</p>}
                      {quest.quest.resourceUrl?.startsWith('https://') ? (
                        <a href={quest.quest.resourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-8 items-center font-body text-xs font-semibold text-speaking-king underline-offset-4 hover:underline">Ver recurso asociado</a>
                      ) : quest.quest.resourceUrl?.startsWith('/') ? (
                        <Link href={quest.quest.resourceUrl} className="mt-1 inline-flex min-h-8 items-center font-body text-xs font-semibold text-speaking-king underline-offset-4 hover:underline">Ver recurso asociado</Link>
                      ) : null}
                    </div>
                    <time dateTime={(quest.completedAt ?? quest.assignedDate).toISOString()} className="font-body text-xs text-speaking-cobalt/65">
                      {(quest.completedAt ?? quest.assignedDate).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                    </time>
                  </li>
                ))}
                {completedSkillProgress.map((progress) => (
                  <li key={progress.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {displayableText(progress.node.title) && <h3 className="font-body text-sm font-semibold text-speaking-cobalt">{displayableText(progress.node.title)}</h3>}
                      <p className="text-xs text-speaking-cobalt/65">Práctica completada</p>
                    </div>
                    {progress.completedAt && <time dateTime={progress.completedAt.toISOString()} className="font-body text-xs text-speaking-cobalt/65">{progress.completedAt.toLocaleDateString('es-ES', { dateStyle: 'medium' })}</time>}
                  </li>
                ))}
                {additionalLessonProgress.map((progress) => (
                  <li key={progress.nodeId} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {displayableText(progress.node.title) && <h3 className="font-body text-sm font-semibold text-speaking-cobalt">{displayableText(progress.node.title)}</h3>}
                      <p className="text-xs text-speaking-cobalt/65">Lección completada</p>
                    </div>
                    {progress.completedAt && <time dateTime={progress.completedAt.toISOString()} className="font-body text-xs text-speaking-cobalt/65">{progress.completedAt.toLocaleDateString('es-ES', { dateStyle: 'medium' })}</time>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}