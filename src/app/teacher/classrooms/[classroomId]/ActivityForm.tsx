'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createWrittenActivity, type ActivityFormState } from './actions';

const initialState: ActivityFormState = { status: 'idle', message: '', resetKey: 0 };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-5 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Crear actividad'}
    </button>
  );
}

export function ActivityForm({ classroomId }: { classroomId: string }) {
  const action = createWrittenActivity.bind(null, classroomId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-4 border-l-4 border-speaking-mustard bg-speaking-white p-4 sm:p-5">
      <ActivityFields key={state.resetKey} state={state} />
    </form>
  );
}

function ActivityFields({ state }: { state: ActivityFormState }) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-7 items-center bg-speaking-mustard/25 px-2.5 font-body text-xs font-bold uppercase tracking-[0.08em] text-speaking-cobalt">Nueva actividad</span>
        <span className="font-body text-xs text-speaking-cobalt/60">Se compartirá con los estudiantes activos de esta aula</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <label htmlFor="activity-title" className="block font-body text-sm font-semibold text-speaking-cobalt">
          Título
        </label>
        <input
          id="activity-title"
          name="title"
          type="text"
          required
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={state.status === 'error'}
          placeholder="Ej. Describe tu fin de semana"
          className="mt-1 min-h-12 w-full border border-speaking-cobalt/20 bg-white px-3.5 py-2.5 font-body text-sm text-speaking-cobalt outline-none transition focus:border-speaking-king focus:ring-2 focus:ring-speaking-king/15"
        />
        <p className="mt-1 font-body text-xs text-speaking-cobalt/60">Hasta 120 caracteres.</p>
      </div>

      <div>
        <label htmlFor="activity-prompt" className="block font-body text-sm font-semibold text-speaking-cobalt">
          Consigna
        </label>
        <textarea
          id="activity-prompt"
          name="prompt"
          required
          maxLength={2000}
          rows={5}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          aria-invalid={state.status === 'error'}
          placeholder="Escribe pasos claros, preguntas guía o vocabulario que puedan usar."
          className="mt-1 min-h-36 w-full resize-y border border-speaking-cobalt/20 bg-white px-3.5 py-3 font-body text-sm leading-6 text-speaking-cobalt outline-none transition focus:border-speaking-king focus:ring-2 focus:ring-speaking-king/15"
        />
        <p className="mt-1 font-body text-xs text-speaking-cobalt/60">Hasta 2000 caracteres · Sin fecha límite</p>
      </div>
      </div>

      {state.status !== 'idle' && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className={`border-l-2 px-3 py-2 font-body text-sm ${state.status === 'error' ? 'border-speaking-streak bg-speaking-streak/5 text-speaking-streak' : 'border-speaking-success bg-speaking-success/5 text-speaking-success'}`}>
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-speaking-cobalt/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-xs text-speaking-cobalt/60">Revisa la consigna antes de compartirla.</p>
        <SubmitButton />
      </div>
    </div>
  );
}