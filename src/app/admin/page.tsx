import { requireAdminId } from '../../lib/admin-auth';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { StudentAccessControl } from '../../components/StudentAccessControl';
import { AdminDeleteUserControl } from '../../components/AdminDeleteUserControl';
import { AdminClassroomAssignmentForm } from '../../components/AdminClassroomAssignmentForm';
import { AdminExistingStudentAssignment } from '../../components/AdminExistingStudentAssignment';
import { AdminLogoutButton } from '../../components/AdminLogoutButton';
import { ShieldCheck, Users, UserRoundCog, School } from 'lucide-react';

export default async function AdminUsersPage() {
  const adminId = await requireAdminId();

  const [admin, users] = await Promise.all([prisma.user.findUnique({ where: { id: adminId }, select: { fullName: true, email: true, role: true } }), prisma.user.findMany({
    where: { role: { in: ['TEACHER', 'STUDENT'] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      accessStatus: true,
      classroomsAsTeacher: {
        select: { id: true, name: true, level: true, status: true },
        orderBy: { name: 'asc' },
      },
      classroomMemberships: {
        select: {
          id: true,
          status: true,
          classroom: { select: { id: true, name: true, status: true, teacherId: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  })]);
  const activeClassrooms = await prisma.classroom.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, teacher: { select: { fullName: true } } },
    orderBy: { name: 'asc' },
  });

  const teachers = users.filter((user) => user.role === 'TEACHER');
  const students = users.filter((user) => user.role === 'STUDENT');
  const assignmentTeachers = teachers
    .filter((teacher) => teacher.accessStatus === 'ACTIVE')
    .map((teacher) => ({
      id: teacher.id,
      name: teacher.fullName,
      classrooms: teacher.classroomsAsTeacher
        .filter((classroom) => classroom.status === 'ACTIVE')
        .map(({ id, name, level }) => ({ id, name, level })),
    }));
  const assignmentStudents = students
    .filter((student) => student.accessStatus === 'ACTIVE')
    .map((student) => ({
      id: student.id,
      name: student.fullName,
      classrooms: student.classroomMemberships
        .filter(({ status, classroom }) => status === 'ACTIVE' && classroom.status === 'ACTIVE')
        .map(({ classroom }) => classroom.id),
    }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header id="admin-overview" className="flex flex-col justify-between gap-5 rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_8px_30px_rgba(16,52,105,0.06)] sm:flex-row sm:items-start sm:p-6">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">Panel de control</p>
          <h1 className="mt-1 font-title text-3xl text-speaking-cobalt">Administración</h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-speaking-cobalt/75">
            Gestiona accesos, invitaciones y pertenencia a las aulas desde un único lugar.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-3 rounded-xl border border-speaking-cobalt/10 bg-speaking-white px-3.5 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking-king/10 text-speaking-king"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
            <div><p className="font-body text-sm font-semibold text-speaking-cobalt">{admin?.fullName ?? 'Administrador'}</p><p className="font-body text-sm text-speaking-cobalt/65">{admin?.email} · Cuenta administradora</p></div>
          </div>
          <AdminLogoutButton />
        </div>
      </header>

      <nav aria-label="Secciones de administración" className="sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto border-y border-speaking-cobalt/8 bg-speaking-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link href="/admin" className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-speaking-cobalt px-3 font-body text-sm font-semibold text-white">Usuarios y aulas</Link>
        <Link href="/admin/invitations" className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 font-body text-sm font-semibold text-speaking-cobalt/70 transition-colors hover:bg-white hover:text-speaking-cobalt">Invitaciones</Link>
      </nav>

      <section aria-label="Resumen de cuentas" className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_3px_14px_rgba(16,52,105,0.035)]"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-speaking-king/10 text-speaking-king"><UserRoundCog className="h-5 w-5" aria-hidden="true" /></span><div><p className="font-body text-sm text-speaking-cobalt/65">Profesores</p><p className="font-title text-2xl text-speaking-cobalt">{teachers.length}</p></div></div>
        <div className="flex items-center gap-3 rounded-xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_3px_14px_rgba(16,52,105,0.035)]"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-speaking-success/10 text-speaking-success"><Users className="h-5 w-5" aria-hidden="true" /></span><div><p className="font-body text-sm text-speaking-cobalt/65">Estudiantes</p><p className="font-title text-2xl text-speaking-cobalt">{students.length}</p></div></div>
        <div className="flex items-center gap-3 rounded-xl border border-speaking-cobalt/10 bg-white p-4 shadow-[0_3px_14px_rgba(16,52,105,0.035)]"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-speaking-mustard/20 text-speaking-cobalt"><School className="h-5 w-5" aria-hidden="true" /></span><div><p className="font-body text-sm text-speaking-cobalt/65">Aulas activas</p><p className="font-title text-2xl text-speaking-cobalt">{activeClassrooms.length}</p></div></div>
      </section>

      <section id="admin-directory" className="scroll-mt-24 space-y-8" aria-label="Directorio de usuarios">
      <section aria-labelledby="teachers-heading" className="rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_5px_22px_rgba(16,52,105,0.045)] sm:p-6">
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

      <section className="scroll-mt-24 rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_5px_22px_rgba(16,52,105,0.045)] sm:p-6" aria-labelledby="assign-students-heading">
        <h2 id="assign-students-heading" className="font-title text-xl text-speaking-cobalt">Asignar estudiantes a un profesor</h2>
        <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-speaking-cobalt/70">
          Elige un profesor, su aula o grupo y uno o varios estudiantes. Ambas partes recibirán un aviso dentro de Speaking Lab.
        </p>
        {assignmentTeachers.length === 0 || assignmentTeachers.every(({ classrooms }) => classrooms.length === 0) || assignmentStudents.length === 0 ? (
          <p className="mt-3 font-body text-sm text-speaking-cobalt/65">Se necesita al menos un profesor con aula activa y un estudiante con cuenta activa para asignar.</p>
        ) : (
          <AdminClassroomAssignmentForm teachers={assignmentTeachers} students={assignmentStudents} />
        )}
      </section>

      <AdminExistingStudentAssignment
        classrooms={activeClassrooms.map((classroom) => ({ id: classroom.id, name: classroom.name, teacherName: classroom.teacher.fullName }))}
        students={students.filter((student) => student.accessStatus === 'ACTIVE').map((student) => ({ id: student.id, name: student.fullName }))}
      />

      <section aria-labelledby="students-heading" className="rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_5px_22px_rgba(16,52,105,0.045)] sm:p-6">
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
      </section>
    </main>
  );
}
