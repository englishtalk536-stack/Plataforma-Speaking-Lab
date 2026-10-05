import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import { requireTeacherId } from '../../lib/teacher-auth';

export default async function TeacherPage() {
  const teacherId = await requireTeacherId();
  const classrooms = await prisma.classroom.findMany({
    where: { teacherId, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      description: true,
      level: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="flex min-h-screen flex-col bg-speaking-white md:flex-row">
      <aside className="flex shrink-0 flex-col bg-speaking-cobalt px-5 py-4 text-white md:min-h-screen md:w-60 md:px-6 md:py-8">
        <Link href="/teacher" className="font-title text-xl text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard">
          <span className="text-speaking-mustard">Speaking</span>Lab
        </Link>
        <nav aria-label="Navegación docente" className="mt-4 md:mt-12">
          <Link
            href="/teacher"
            aria-current="page"
            className="flex min-h-11 items-center border-l-2 border-speaking-mustard bg-white/10 px-3 font-body text-sm font-semibold text-white"
          >
            Aulas
          </Link>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="border-b border-speaking-cobalt/15 pb-6 sm:pb-8">
            <p className="font-body text-xs font-semibold uppercase text-speaking-cobalt/70">Espacio docente</p>
            <h1 className="mt-2 font-title text-3xl text-speaking-cobalt">Mis aulas</h1>
            <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-speaking-cobalt/70">
              Aulas activas asignadas a tu cuenta.
            </p>
          </header>

          {classrooms.length === 0 ? (
            <section
              aria-labelledby="empty-classrooms-heading"
              className="mt-8 flex min-h-56 flex-col items-center justify-center border border-dashed border-speaking-cobalt/25 bg-white px-6 py-12 text-center"
            >
              <h2 id="empty-classrooms-heading" className="font-title text-xl text-speaking-cobalt">
                No hay aulas activas
              </h2>
              <p className="mt-2 max-w-md font-body text-sm leading-6 text-speaking-cobalt/70">
                Las aulas activas asignadas a tu cuenta aparecerán aquí.
              </p>
            </section>
          ) : (
            <ul className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {classrooms.map((classroom) => (
                <li key={classroom.id}>
                  <Link
                    href={`/teacher/classrooms/${classroom.id}`}
                    className="group flex h-full min-h-52 flex-col border border-speaking-cobalt/15 border-t-4 border-t-speaking-cobalt bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-title text-xl text-speaking-cobalt group-hover:underline group-hover:underline-offset-4">
                        {classroom.name}
                      </h2>
                      {classroom.level && (
                        <span className="shrink-0 rounded-full bg-speaking-mustard/20 px-3 py-1 font-body text-xs font-semibold text-speaking-cobalt">
                          {classroom.level}
                        </span>
                      )}
                    </div>
                    {classroom.description && (
                      <p className="mt-4 line-clamp-3 font-body text-sm leading-6 text-speaking-cobalt/70">
                        {classroom.description}
                      </p>
                    )}
                    <span className="mt-auto pt-6 font-body text-sm font-semibold text-speaking-cobalt">
                      Abrir aula <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}