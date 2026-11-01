'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createVirtualClass, type VirtualClassFormState } from './actions';

const initialState: VirtualClassFormState = { status: 'idle', message: '', resetKey: 0 };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-5 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Programando…' : 'Programar clase'}
    </button>
  );
}

export function VirtualClassForm({ classroomId }: { classroomId: string }) {
  const action = createVirtualClass.bind(null, classroomId);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <VirtualClassFields key={state.resetKey} />
      {state.status !== 'idle' && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="font-body text-sm text-speaking-cobalt">
          {state.message}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

function VirtualClassFields() {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="virtual-class-title" className="block font-body text-sm font-semibold text-speaking-cobalt">
          Título
        </label>
        <input
          id="virtual-class-title"
          name="title"
          type="text"
          required
          maxLength={120}
          className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
        />
      </div>

      <div>
        <label htmlFor="virtual-class-scheduled-at" className="block font-body text-sm font-semibold text-speaking-cobalt">
          Fecha y hora
        </label>
        <input
          id="virtual-class-scheduled-at"
          name="scheduledAt"
          type="datetime-local"
          required
          className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
        />
      </div>

      <div>
        <label htmlFor="virtual-class-join-url" className="block font-body text-sm font-semibold text-speaking-cobalt">
          Enlace externo HTTPS
        </label>
        <input
          id="virtual-class-join-url"
          name="joinUrl"
          type="url"
          required
          pattern="https://.+"
          placeholder="https://..."
          className="mt-1 min-h-11 w-full border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
        />
      </div>
    </div>
  );
}