'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { assignExistingStudentToClassroom, type ExistingStudentAssignmentState } from '../lib/assign-existing-student-action';

type ClassroomOption = { id: string; name: string; teacherName: string };

function AssignmentSubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-4 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 disabled:opacity-60">
      {pending ? 'Asignando…' : 'Asignar a aula'}
    </button>
  );
}

export function AdminExistingStudentAssignment({
  classrooms,
  students,
}: {
  classrooms: ClassroomOption[];
  students: { id: string; name: string }[];
}) {
  const initialState: ExistingStudentAssignmentState = { status: 'idle', message: '' };
  const [state, action] = useActionState(assignExistingStudentToClassroom, initialState);

  return (
    <section aria-labelledby="existing-assignment-heading" className="space-y-4 rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_6px_24px_rgba(16,52,105,0.05)] sm:p-6">
      <div>
        <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">Matrículas</p>
        <h2 id="existing-assignment-heading" className="mt-1 font-title text-xl text-speaking-cobalt">Asignar estudiante existente</h2>
        <p className="mt-1 font-body text-sm leading-6 text-speaking-cobalt/70">Añade una matrícula activa sin crear otra cuenta.</p>
      </div>
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="existing-student" className="block font-body text-sm font-semibold text-speaking-cobalt">Estudiante</label>
            <select id="existing-student" name="studentId" required defaultValue="" className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt">
              <option value="" disabled>Selecciona un estudiante</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="existing-classroom" className="block font-body text-sm font-semibold text-speaking-cobalt">Aula</label>
            <select id="existing-classroom" name="classroomId" required defaultValue="" className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt">
              <option value="" disabled>Selecciona un aula activa</option>
              {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.teacherName}</option>)}
            </select>
          </div>
        </div>
        {state.status !== 'idle' && <p role={state.status === 'error' ? 'alert' : 'status'} className={`font-body text-sm ${state.status === 'error' ? 'text-speaking-streak' : 'text-speaking-success'}`}>{state.message}</p>}
        <AssignmentSubmitButton disabled={students.length === 0 || classrooms.length === 0} />
      </form>
    </section>
  );
}
