'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { gradeActivitySubmission, type GradeFormState } from './grading-actions';

const initialState: GradeFormState = { status: 'idle', message: '' };

function SaveGradeButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-10 bg-speaking-cobalt px-4 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar nota'}
    </button>
  );
}

export function GradeSubmissionForm({
  classroomId,
  submissionId,
  initialScore,
}: {
  classroomId: string;
  submissionId: string;
  initialScore: number | null;
}) {
  const action = gradeActivitySubmission.bind(null, classroomId, submissionId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor={`grade-${submissionId}`} className="block font-body text-sm font-semibold text-speaking-cobalt">
          Nota (1–20 puntos)
        </label>
        <input
          id={`grade-${submissionId}`}
          name="score"
          type="number"
          min={1}
          max={20}
          step={1}
          required
          defaultValue={initialScore ?? ''}
          aria-invalid={state.status === 'error'}
          className="mt-1 h-10 w-28 border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt focus:border-speaking-cobalt focus:outline-none focus:ring-2 focus:ring-speaking-cobalt/15"
        />
      </div>
      <SaveGradeButton />
      {state.status !== 'idle' && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="basis-full font-body text-sm text-speaking-cobalt">
          {state.message}
        </p>
      )}
    </form>
  );
}