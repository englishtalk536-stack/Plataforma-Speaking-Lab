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
      className="min-h-11 bg-speaking-cobalt px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar nota'}
    </button>
  );
}

export function GradeSubmissionForm({
  classroomId,
  submissionId,
  initialScore,
  initialComment,
}: {
  classroomId: string;
  submissionId: string;
  initialScore: number | null;
  initialComment: string | null;
}) {
  const action = gradeActivitySubmission.bind(null, classroomId, submissionId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 border-l-2 border-speaking-king/50 bg-speaking-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md">
          <p className="font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-king">Revisión del profesor</p>
          <label htmlFor={`grade-${submissionId}`} className="mt-2 block font-body text-sm font-semibold text-speaking-cobalt">
            Calificación <span className="font-normal text-speaking-cobalt/60">· 1 a 20</span>
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            className="min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 font-body text-sm text-speaking-cobalt focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15 sm:w-28"
          />
          <SaveGradeButton />
        </div>
      </div>

      <div>
        <label htmlFor={`comment-${submissionId}`} className="block font-body text-sm font-semibold text-speaking-cobalt">
          Feedback para el estudiante
        </label>
        <textarea
          id={`comment-${submissionId}`}
          name="comment"
          required
          maxLength={2000}
          rows={4}
          defaultValue={initialComment ?? ''}
          aria-invalid={state.status === 'error'}
          placeholder="Reconoce sus avances y concreta el siguiente paso de aprendizaje."
          className="mt-1 min-h-28 w-full resize-y border border-speaking-cobalt/20 bg-white px-3 py-2.5 font-body text-sm leading-6 text-speaking-cobalt focus:border-speaking-king focus:outline-none focus:ring-2 focus:ring-speaking-king/15"
        />
      </div>

      {state.status !== 'idle' && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className={`border-l-2 px-3 py-2 font-body text-sm ${state.status === 'error' ? 'border-speaking-streak bg-speaking-streak/5 text-speaking-streak' : 'border-speaking-success bg-speaking-success/5 text-speaking-success'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}