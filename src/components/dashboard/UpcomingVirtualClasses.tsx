import { CalendarDays, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { UpcomingVirtualClassDto } from '../../lib/types/dashboard';

export function UpcomingVirtualClasses({
  classes,
  showEmptyState = true,
}: {
  classes: UpcomingVirtualClassDto[];
  showEmptyState?: boolean;
}) {
  if (classes.length === 0 && !showEmptyState) return null;

  return (
    <section aria-labelledby="upcoming-virtual-classes-heading">
      <h2 id="upcoming-virtual-classes-heading" className="font-title text-xl text-speaking-cobalt">
        Próximas clases virtuales
      </h2>
      {classes.length === 0 ? (
        <p className="mt-3 font-body text-sm text-speaking-cobalt/65">No tienes clases virtuales programadas próximamente.</p>
      ) : (
        <ul className="mt-3 divide-y divide-speaking-cobalt/10 border-y border-speaking-cobalt/10">
          {classes.map((virtualClass) => (
            <li key={virtualClass.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-body text-sm font-semibold text-speaking-cobalt">{virtualClass.title}</p>
                <Link
                  href={`/student/classrooms/${virtualClass.classroomId}`}
                  className="mt-1 inline-flex min-h-8 items-center font-body text-xs text-speaking-cobalt/70 underline-offset-4 hover:underline"
                >
                  {virtualClass.classroomName}
                </Link>
                <p className="mt-1 inline-flex items-center gap-1.5 font-body text-sm text-speaking-cobalt/75">
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <time dateTime={virtualClass.scheduledAt}>
                    {new Date(virtualClass.scheduledAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </p>
              </div>
              <a
                href={virtualClass.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-cobalt focus-visible:outline-offset-2"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Abrir clase
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}