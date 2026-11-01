'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { assignLearningToGroup, type GroupAssignmentState } from './group-assignment-actions';

type LearningOption = { id: string; title: string; type: 'PRACTICE' | 'MISSION'; detail: string };

const initialState: GroupAssignmentState = { status: 'idle', message: '' };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-5 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55">
      {pending ? 'Asignando…' : 'Asignar al grupo'}
    </button>
  );
}

export function GroupLearningAssignmentForm({
  classroomId,
  students,
  learningOptions,
}: {
  classroomId: string;
  students: { id: string; name: string }[];
  learningOptions: LearningOption[];
}) {
  const action = assignLearningToGroup.bind(null, classroomId);
  const [state, formAction] = useActionState(action, initialState);

  if (students.length === 0) {
    return <p className="mt-3 font-body text-sm text-speaking-cobalt/65">Añade estudiantes activos al aula para planificar una actividad grupal.</p>;
  }

  return (
    <form action={formAction} className="mt-4 space-y-4 border-l-4 border-speaking-king/55 bg-speaking-white p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <label htmlFor="group-learning-item" className="block font-body text-sm font-semibold text-speaking-cobalt">Misión o práctica</label>
          <select id="group-learning-item" name="learningItem" required defaultValue="" className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15">
            <option value="" disabled>Selecciona una actividad</option>
            {(['MISSION', 'PRACTICE'] as const).map((type) => {
              const options = learningOptions.filter((option) => option.type === type);
              if (options.length === 0) return null;
              return <optgroup key={type} label={type === 'MISSION' ? 'Misiones diarias' : 'Prácticas de escucha y habla'}>
                {options.map((option) => <option key={option.id} value={`${option.type}:${option.id}`}>{option.title} · {option.detail}</option>)}
              </optgroup>;
            })}
          </select>
        </div>
        <fieldset>
          <legend className="font-body text-sm font-semibold text-speaking-cobalt">Asignar a estudiantes</legend>
          <div className="mt-1 grid max-h-40 gap-x-4 overflow-y-auto border border-speaking-cobalt/10 bg-white p-2 sm:grid-cols-2">
            {students.map((student) => (
              <label key={student.id} className="inline-flex min-h-10 items-center gap-2 px-1 font-body text-sm text-speaking-cobalt">
                <input type="checkbox" name="studentIds" value={student.id} className="h-4 w-4 accent-speaking-cobalt" />
                <span className="truncate">{student.name}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 font-body text-xs text-speaking-cobalt/70">Puedes seleccionar uno, varios o todo el grupo.</p>
        </fieldset>
      </div>
      {state.status !== 'idle' && <p role={state.status === 'error' ? 'alert' : 'status'} className={`font-body text-sm ${state.status === 'error' ? 'text-speaking-streak' : 'text-speaking-success'}`}>{state.message}</p>}
      <SubmitButton disabled={learningOptions.length === 0} />
    </form>
  );
}