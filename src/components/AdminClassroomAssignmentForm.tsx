'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { assignStudentsToClassroom, type ClassroomAssignmentState } from '../lib/classroom-assignment-actions';

type TeacherOption = {
  id: string;
  name: string;
  classrooms: { id: string; name: string; level: string | null }[];
};

const initialState: ClassroomAssignmentState = { status: 'idle', message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-5 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:opacity-60">
      {pending ? 'Asignando…' : 'Asignar estudiantes'}
    </button>
  );
}

export function AdminClassroomAssignmentForm({
  teachers,
  students,
}: {
  teachers: TeacherOption[];
  students: { id: string; name: string; classrooms: string[] }[];
}) {
  const [state, formAction] = useActionState(assignStudentsToClassroom, initialState);
  const [teacherId, setTeacherId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const teacher = teachers.find((candidate) => candidate.id === teacherId);
  const classroom = teacher?.classrooms.find((candidate) => candidate.id === classroomId);
  const eligibleStudents = students.filter((student) => !student.classrooms.includes(classroomId));

  return (
    <form action={formAction} className="mt-4 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="assignment-teacher" className="block font-body text-sm font-semibold text-speaking-cobalt">Profesor</label>
          <select id="assignment-teacher" required value={teacherId} onChange={(event) => { setTeacherId(event.target.value); setClassroomId(''); }} className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt">
            <option value="">Selecciona un profesor</option>
            {teachers.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="assignment-classroom" className="block font-body text-sm font-semibold text-speaking-cobalt">Aula o grupo</label>
          <select id="assignment-classroom" name="classroomId" required value={classroomId} onChange={(event) => setClassroomId(event.target.value)} disabled={!teacher || teacher.classrooms.length === 0} className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt disabled:opacity-60">
            <option value="">Selecciona un aula</option>
            {teacher?.classrooms.map((option) => <option key={option.id} value={option.id}>{option.name}{option.level ? ` · ${option.level}` : ''}</option>)}
          </select>
        </div>
      </div>

      {classroom && (
          <fieldset key={classroomId}>
          <legend className="font-body text-sm font-semibold text-speaking-cobalt">Estudiantes para {classroom.name}</legend>
          {eligibleStudents.length === 0 ? (
            <p className="mt-2 font-body text-sm text-speaking-cobalt/65">No hay estudiantes disponibles para asignar a esta aula.</p>
          ) : (
            <div className="mt-2 grid gap-x-5 sm:grid-cols-2">
              {eligibleStudents.map((student) => (
                <label key={student.id} className="inline-flex min-h-10 items-center gap-2 font-body text-sm text-speaking-cobalt">
                  <input type="checkbox" name="studentIds" value={student.id} />
                  {student.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {state.status !== 'idle' && <p role={state.status === 'error' ? 'alert' : 'status'} className="font-body text-sm text-speaking-cobalt">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}