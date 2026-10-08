import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import { requireTeacherId } from '../../../../lib/teacher-auth';
import { ActivityForm } from './ActivityForm';
import { GradeSubmissionForm } from './GradeSubmissionForm';

export default async function TeacherClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classroomId } = await params;
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
          status: 'ACTIVE',
          user: { is: { role: 'STUDENT' } },
        },
        select: {
          user: {
            select: {
              id: true,
              fullName: true,
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
              responseText: true,
              submittedAt: true,
              student: { select: { fullName: true } },
              submissionFeedback: { select: { score: true } },
            },
            orderBy: { submittedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!classroom) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <Link href="/teacher" className="text-sm text-speaking-cobalt underline-offset-4 hover:underline">
        Volver a mis aulas
      </Link>

      <header className="mt-6 border-b border-speaking-cobalt/15 pb-5">
        <h1 className="font-title text-3xl text-speaking-cobalt">{classroom.name}</h1>
        {classroom.level && <p className="mt-1 text-speaking-cobalt/70">Nivel {classroom.level}</p>}
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
                <section className="mt-5 border-t border-speaking-cobalt/10 pt-4" aria-label={`Respuestas: ${activity.title}`}>
                  <h4 className="font-body text-sm font-semibold text-speaking-cobalt">
                    Respuestas ({activity.submissions.length})
                  </h4>
                  {activity.submissions.length === 0 ? (
                    <p className="mt-2 font-body text-sm text-speaking-cobalt/65">Todavía no hay respuestas.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {activity.submissions.map((submission) => (
                        <li key={submission.id} className="bg-speaking-white p-4">
                          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                            <h5 className="font-body text-sm font-semibold text-speaking-cobalt">
                              {submission.student.fullName}
                            </h5>
                            <time
                              dateTime={submission.submittedAt.toISOString()}
                              className="font-body text-xs text-speaking-cobalt/65"
                            >
                              {submission.submittedAt.toLocaleDateString('es')}
                            </time>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">
                            {submission.responseText}
                          </p>
                          <div className="mt-4">
                            <GradeSubmissionForm
                              classroomId={classroomId}
                              submissionId={submission.id}
                              initialScore={submission.submissionFeedback?.score ?? null}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 border border-speaking-cobalt/15 bg-speaking-white p-4 sm:p-6">
          <h3 className="font-title text-lg text-speaking-cobalt">Crear actividad</h3>
          <ActivityForm classroomId={classroomId} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="students-heading">
        <h2 id="students-heading" className="font-title text-xl text-speaking-cobalt">
          Estudiantes activos ({classroom.memberships.length})
        </h2>
        {classroom.memberships.length === 0 ? (
          <p className="mt-4 text-speaking-cobalt/70">No hay estudiantes activos.</p>
        ) : (
          <ul className="mt-4 divide-y divide-speaking-cobalt/15">
            {classroom.memberships.map(({ user }) => (
              <li key={user.id} className="py-3 text-speaking-cobalt">
                {user.fullName}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}