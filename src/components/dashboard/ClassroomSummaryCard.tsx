import { CalendarDays, GraduationCap } from 'lucide-react';
import Link from 'next/link';
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
    <Link
      href={`/student/classrooms/${classroom.id}`}
      className="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
    >
      <article className="relative h-full overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-white p-5 shadow-[0_4px_18px_rgba(16,52,105,0.045)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-speaking-king/25 group-hover:shadow-[0_12px_28px_rgba(16,52,105,0.11)] sm:p-6">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-speaking-king via-speaking-cobalt to-speaking-mustard" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div>
              <p className="font-title text-lg text-speaking-cobalt transition-colors group-hover:text-speaking-king">
              {classroom.name}
            </p>
            {classroom.englishLevel ? (
              <p className="mt-1 font-body text-xs font-semibold text-speaking-king">Tu nivel: {classroom.englishLevel}</p>
            ) : null}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-speaking-success/10 px-2.5 py-1 font-body text-xs font-bold uppercase tracking-[0.04em] text-speaking-success">
            <span className="h-1.5 w-1.5 rounded-full bg-speaking-success" aria-hidden="true" />
            Activa
          </span>
        </div>

        {classroom.description && <p className="mt-3 font-body text-sm text-speaking-cobalt/70">{classroom.description}</p>}

        <dl className="mt-5 space-y-2.5 border-t border-speaking-cobalt/10 pt-4 font-body text-sm text-speaking-cobalt/70">
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
    </Link>
  );
}
