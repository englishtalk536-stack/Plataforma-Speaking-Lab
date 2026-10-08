import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import { requireStudentId } from '../../../../lib/student-auth';
import { SubmissionForm } from './SubmissionForm';

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
      classroom: {
        select: {
          name: true,
          description: true,
          level: true,
          writtenActivities: {
            select: {
              id: true,
              title: true,
              prompt: true,
              createdAt: true,
              submissions: {
                where: { studentId },
                select: {
                  responseText: true,
                  submissionFeedback: { select: { score: true } },
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
      >
        Volver al dashboard
      </Link>

      <header className="mt-5 border-b border-speaking-cobalt/15 pb-5 sm:mt-6">
        <h1 className="font-title text-3xl text-speaking-cobalt">{classroom.name}</h1>
        {classroom.level && <p className="mt-2 font-body text-sm text-speaking-cobalt/70">Nivel {classroom.level}</p>}
        {classroom.description && (
          <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">
            {classroom.description}
          </p>
        )}
      </header>

      <section className="mt-8" aria-labelledby="activities-heading">
        <h2 id="activities-heading" className="font-title text-xl text-speaking-cobalt">
          Actividades escritas
        </h2>
        {classroom.writtenActivities.length === 0 ? (
          <p className="mt-3 text-sm text-speaking-cobalt/70">Todavía no hay actividades en esta aula.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {classroom.writtenActivities.map((activity) => (
              <li key={activity.id} className="border border-speaking-cobalt/15 bg-white p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <h3 className="font-title text-lg text-speaking-cobalt">{activity.title}</h3>
                  <time
                    dateTime={activity.createdAt.toISOString()}
                    className="shrink-0 font-body text-xs text-speaking-cobalt/65"
                  >
                    {activity.createdAt.toLocaleDateString('es')}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">
                  {activity.prompt}
                </p>
                <SubmissionForm
                  classroomId={classroomId}
                  activityId={activity.id}
                  initialResponse={activity.submissions[0]?.responseText ?? ''}
                />
                {activity.submissions[0]?.submissionFeedback?.score != null && (
                  <p className="mt-4 border-t border-speaking-cobalt/10 pt-3 font-body text-sm font-semibold text-speaking-cobalt">
                    Calificación del profesor: {activity.submissions[0].submissionFeedback.score}/20 puntos
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}