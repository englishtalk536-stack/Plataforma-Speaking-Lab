'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { rescheduleVirtualClass, type RescheduleVirtualClassState } from './classrooms/[classroomId]/actions';

const initialState: RescheduleVirtualClassState = { status: 'idle', message: '', resetKey: 0 };

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function SaveScheduleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center justify-center bg-speaking-cobalt px-4 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar horario'}
    </button>
  );
}

export function EditVirtualClassScheduleForm({
  classroomId,
  virtualClassId,
  scheduledAt,
}: {
  classroomId: string;
  virtualClassId: string;
  scheduledAt: string;
}) {
  const action = rescheduleVirtualClass.bind(null, classroomId, virtualClassId);
  const [state, formAction] = useActionState(action, initialState);
  const [timeZoneOffset] = useState(() => new Date().getTimezoneOffset());

  return (
    <details className="group">
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
        Editar fecha y hora
      </summary>
      <form action={formAction} className="mt-3 space-y-3 border-l-2 border-speaking-cobalt/15 pl-3">
        <input type="hidden" name="timeZoneOffset" value={timeZoneOffset} />
        <ScheduleFields key={state.resetKey} initialValue={formatLocalDateTime(scheduledAt)} />
        {state.status !== 'idle' && (
          <p role={state.status === 'error' ? 'alert' : 'status'} className={`font-body text-sm ${state.status === 'error' ? 'text-speaking-streak' : 'text-speaking-success'}`}>
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}

function ScheduleFields({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div>
      <label htmlFor="reschedule-virtual-class" className="block font-body text-xs font-semibold text-speaking-cobalt/75">
        Nueva fecha y hora
      </label>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id="reschedule-virtual-class"
          name="scheduledAt"
          type="datetime-local"
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-10 border border-speaking-cobalt/20 bg-white px-3 py-2 font-body text-sm text-speaking-cobalt outline-none focus:border-speaking-cobalt focus:ring-2 focus:ring-speaking-cobalt/15"
        />
        <SaveScheduleButton />
      </div>
    </div>
  );
}