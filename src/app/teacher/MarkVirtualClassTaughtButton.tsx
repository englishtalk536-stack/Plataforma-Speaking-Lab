'use client';

import { markVirtualClassTaught } from './classrooms/[classroomId]/actions';

export function MarkVirtualClassTaughtButton({
  classroomId,
  virtualClassId,
  canMark,
}: {
  classroomId: string;
  virtualClassId: string;
  canMark: boolean;
}) {
  const action = markVirtualClassTaught.bind(null, classroomId, virtualClassId);

  return (
    <form action={action}>
      <div className="flex flex-col items-start gap-1">
        <button
          type="submit"
          disabled={!canMark}
          className="inline-flex min-h-11 items-center justify-center bg-speaking-cobalt px-4 py-2 font-body text-sm font-semibold text-white hover:bg-speaking-cobalt/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-speaking-cobalt/15 disabled:text-speaking-cobalt/60"
        >
          Marcar como clase dictada
        </button>
        {!canMark && <span className="font-body text-xs text-speaking-cobalt/60">Disponible cuando llegue la fecha y hora programadas.</span>}
      </div>
    </form>
  );
}