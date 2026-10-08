import { requireAdminId } from '../../lib/admin-auth';
import { prisma } from '../../lib/prisma';
import { StudentAccessControl } from '../../components/StudentAccessControl';
import { AdminDeleteUserControl } from '../../components/AdminDeleteUserControl';

export default async function AdminUsersPage() {
  await requireAdminId();

  const users = await prisma.user.findMany({
    where: { role: { in: ['TEACHER', 'STUDENT'] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      accessStatus: true,
      classroomsAsTeacher: {
        select: { id: true, name: true, status: true },
        orderBy: { name: 'asc' },
      },
      classroomMemberships: {
        select: {
          id: true,
          status: true,
          classroom: { select: { id: true, name: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  const teachers = users.filter((user) => user.role === 'TEACHER');
  const students = users.filter((user) => user.role === 'STUDENT');

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="border-b border-speaking-cobalt/15 pb-5">
        <p className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Administración</p>
        <h1 className="mt-2 font-title text-3xl text-speaking-cobalt">Usuarios</h1>
        <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-speaking-cobalt/70">
          Consulta cuentas, pausa o reactiva estudiantes y elimina usuarios cuando sea necesario. Para conservar cursos y respuestas, primero transfiere las aulas de un profesor.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="teachers-heading">
        <h2 id="teachers-heading" className="font-title text-xl text-speaking-cobalt">
          Profesores ({teachers.length})
        </h2>
        {teachers.length === 0 ? (
          <p className="mt-3 font-body text-sm text-speaking-cobalt/70">No hay profesores registrados.</p>
        ) : (
          <ul className="mt-3 divide-y divide-speaking-cobalt/10">
            {teachers.map((teacher) => (
              <li key={teacher.id} className="flex flex-col justify-between gap-4 py-4 lg:flex-row lg:items-start">
                <div>
                  <p className="font-body text-sm font-semibold text-speaking-cobalt">{teacher.fullName}</p>
                  <p className="mt-1 font-body text-sm text-speaking-cobalt/65">{teacher.email}</p>
                  <p className="mt-2 font-body text-xs text-speaking-cobalt/65">
                    Aulas asignadas: {teacher.classroomsAsTeacher.map((classroom) => `${classroom.name}${classroom.status === 'ARCHIVED' ? ' (archivada)' : ''}`).join(', ') || 'Ninguna'}
                  </p>
                </div>
                <AdminDeleteUserControl
                  userId={teacher.id}
                  fullName={teacher.fullName}
                  email={teacher.email}
                  role="TEACHER"
                  hasOwnedClassrooms={teacher.classroomsAsTeacher.length > 0}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="students-heading">
        <h2 id="students-heading" className="font-title text-xl text-speaking-cobalt">
          Estudiantes ({students.length})
        </h2>
        {students.length === 0 ? (
          <p className="mt-3 font-body text-sm text-speaking-cobalt/70">No hay estudiantes registrados.</p>
        ) : (
          <ul className="mt-3 divide-y divide-speaking-cobalt/10">
            {students.map((student) => (
              <li key={student.id} className="py-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="font-body text-sm font-semibold text-speaking-cobalt">{student.fullName}</p>
                    <p className="mt-1 font-body text-sm text-speaking-cobalt/65">{student.email}</p>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <StudentAccessControl studentId={student.id} initialStatus={student.accessStatus} />
                    <AdminDeleteUserControl
                      userId={student.id}
                      fullName={student.fullName}
                      email={student.email}
                      role="STUDENT"
                    />
                  </div>
                </div>

                {student.classroomMemberships.length === 0 ? (
                  <p className="mt-3 font-body text-sm text-speaking-cobalt/65">Sin membresías de aula.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {student.classroomMemberships.map((membership) => (
                      <li
                        key={membership.id}
                        className="flex flex-col justify-between gap-3 border border-speaking-cobalt/10 bg-speaking-white p-3 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-body text-sm font-medium text-speaking-cobalt">{membership.classroom.name}</p>
                          <p className="mt-1 font-body text-xs text-speaking-cobalt/60">
                            {membership.classroom.status === 'ACTIVE' ? 'Aula activa' : 'Aula archivada'}
                            {' · '}
                            Membresía {membership.status === 'ACTIVE' ? 'activa' : 'inactiva'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
