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
    <form action={formAction} className="mt-5 space-y-4">
      <ActivityFields key={state.resetKey} state={state} />
    </form>
  );
}

function ActivityFields({ state }: { state: ActivityFormState }) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');

  return (
    <div className="space-y-4">
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
          className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
        />
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
          className="mt-1 w-full resize-y border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm leading-6 text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
        />
      </div>

      {state.status !== 'idle' && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="font-body text-sm text-speaking-cobalt">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </div>
  );
}