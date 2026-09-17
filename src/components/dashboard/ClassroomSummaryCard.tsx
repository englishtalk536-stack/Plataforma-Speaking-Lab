import { CalendarDays, GraduationCap } from 'lucide-react';
import type { ClassroomSummaryDto } from '../../lib/types/dashboard';

export interface ClassroomSummaryCardProps {
  classroom: ClassroomSummaryDto;
}

export function ClassroomSummaryCard({ classroom }: ClassroomSummaryCardProps) {
  const joinedAt = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(classroom.joinedAt));

  return (
    <article className="border border-speaking-cobalt/10 bg-speaking-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-title text-lg text-speaking-cobalt">{classroom.name}</p>
          {classroom.level && <p className="mt-1 font-body text-xs font-semibold text-speaking-king">Level {classroom.level}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-speaking-success/10 px-2.5 py-1 font-body text-xs font-semibold text-speaking-success">
          {classroom.membershipStatus}
        </span>
      </div>

      {classroom.description && <p className="mt-3 font-body text-sm text-speaking-cobalt/70">{classroom.description}</p>}

      <dl className="mt-4 space-y-2 border-t border-speaking-cobalt/10 pt-3 font-body text-sm text-speaking-cobalt/70">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-speaking-king" aria-hidden="true" />
          <dt className="sr-only">Teacher</dt>
          <dd>{classroom.teacher.name}</dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-speaking-king" aria-hidden="true" />
          <dt className="sr-only">Joined</dt>
          <dd>Joined {joinedAt}</dd>
        </div>
      </dl>
    </article>
  );
}
