import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import { requireTeacherId } from '../../../../lib/teacher-auth';

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