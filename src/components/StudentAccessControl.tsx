'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toggleStudentAccess } from '../lib/student-access-actions';

type AccessStatus = 'ACTIVE' | 'PAUSED';
type AccessActionState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  accessStatus: AccessStatus | null;
};

function AccessButton({ status }: { status: AccessStatus }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-10 border border-speaking-cobalt/20 px-3 py-2 font-body text-xs font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Actualizando…' : status === 'ACTIVE' ? 'Pausar cuenta' : 'Reactivar cuenta'}
    </button>
  );
}

export function StudentAccessControl({
  studentId,
  initialStatus,
  classroomId = null,
}: {
  studentId: string;
  initialStatus: AccessStatus;
  classroomId?: string | null;
}) {
  const action = toggleStudentAccess.bind(null, studentId, classroomId);
  const initialState: AccessActionState = {
    status: 'idle',
    message: '',
    accessStatus: initialStatus,
  };
  const [state, formAction] = useActionState(action, initialState);
  const currentStatus = state.accessStatus ?? initialStatus;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <span
        className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${
          currentStatus === 'ACTIVE'
            ? 'bg-speaking-success/10 text-speaking-success'
            : 'bg-speaking-streak/10 text-speaking-streak'
        }`}
      >
        {currentStatus === 'ACTIVE' ? 'Cuenta activa' : 'Cuenta pausada'}
      </span>
      <form action={formAction}>
        <AccessButton status={currentStatus} />
      </form>
      {state.message && (
        <p role={state.status === 'error' ? 'alert' : 'status'} className="max-w-xs font-body text-xs text-speaking-cobalt/75">
          {state.message}
        </p>
      )}
    </div>
  );
}
