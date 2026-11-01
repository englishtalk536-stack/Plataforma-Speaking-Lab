'use client';

import { validateVirtualClassAttendance } from './classrooms/[classroomId]/actions';

export function VirtualClassAttendanceControl({
  classroomId,
  virtualClassId,
  studentId,
  status,
}: {
  classroomId: string;
  virtualClassId: string;
  studentId: string;
  status: 'NOT_REQUESTED' | 'PENDING_VALIDATION' | 'ATTENDED' | 'ABSENT';
}) {
  const markAttended = validateVirtualClassAttendance.bind(null, classroomId, virtualClassId, studentId, 'ATTENDED');
  const markAbsent = validateVirtualClassAttendance.bind(null, classroomId, virtualClassId, studentId, 'ABSENT');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-20 font-body text-xs text-speaking-cobalt/65">
        {status === 'ATTENDED' ? 'Asistió' : status === 'ABSENT' ? 'Ausente' : 'Sin validar'}
      </span>
      <form action={markAttended}>
        <button type="submit" disabled={status === 'ATTENDED'} className="min-h-9 border border-speaking-cobalt/20 px-2.5 font-body text-xs font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 disabled:cursor-default disabled:bg-speaking-success/10 disabled:text-speaking-success">
          Asistió
        </button>
      </form>
      <form action={markAbsent}>
        <button type="submit" disabled={status === 'ABSENT'} className="min-h-9 border border-speaking-cobalt/20 px-2.5 font-body text-xs font-semibold text-speaking-cobalt hover:bg-speaking-cobalt/5 disabled:cursor-default disabled:bg-speaking-cobalt/5 disabled:text-speaking-cobalt/70">
          Ausente
        </button>
      </form>
    </div>
  );
}