'use client';

import { useActionState, type FormEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteManagedUser, type DeleteUserState } from '../lib/admin-user-actions';

const initialState: DeleteUserState = { status: 'idle', message: '' };

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="min-h-10 border border-speaking-streak/35 px-3 py-2 font-body text-xs font-semibold text-speaking-streak hover:bg-speaking-streak/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-streak focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {pending ? 'Eliminando…' : 'Eliminar cuenta'}
    </button>
  );
}

export function AdminDeleteUserControl({
  userId,
  fullName,
  email,
  role,
  hasOwnedClassrooms = false,
}: {
  userId: string;
  fullName: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  hasOwnedClassrooms?: boolean;
}) {
  const action = deleteManagedUser.bind(null, userId);
  const [state, formAction] = useActionState(action, initialState);

  function confirmDeletion(event: FormEvent<HTMLFormElement>) {
    const associatedDataWarning =
      role === 'STUDENT'
        ? ' También se eliminarán sus membresías, respuestas, progreso y demás datos asociados.'
        : ' También se eliminarán sus datos asociados, como reservas y feedback.';
    if (!window.confirm(`¿Eliminar permanentemente la cuenta de ${fullName} (${email})?${associatedDataWarning}`)) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={formAction} onSubmit={confirmDeletion}>
        <DeleteButton disabled={hasOwnedClassrooms} />
      </form>
      {hasOwnedClassrooms && (
        <p className="max-w-xs text-left font-body text-xs text-speaking-cobalt/65 sm:text-right">
          No se puede eliminar mientras conserve aulas; transfiérelas primero para proteger actividades y respuestas.
        </p>
      )}
      {state.message && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="max-w-xs text-left font-body text-xs text-speaking-cobalt/75 sm:text-right">
          {state.message}
        </p>
      )}
    </div>
  );
}
