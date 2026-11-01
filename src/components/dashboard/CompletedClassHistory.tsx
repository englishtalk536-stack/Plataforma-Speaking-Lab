import Link from 'next/link';
import type { CompletedClassDto } from '../../lib/types/dashboard';
import { displayableText } from '../../lib/presentation-content';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { DashboardSection } from './DashboardSection';

export function CompletedClassHistory({ classes }: { classes: CompletedClassDto[] }) {
  const byMonth = new Map<string, { label: string; classes: CompletedClassDto[] }>();
  for (const classItem of classes) {
    const date = new Date(classItem.taughtAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const month = byMonth.get(monthKey) ?? {
      label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      classes: [],
    };
    month.classes.push(classItem);
    byMonth.set(monthKey, month);
  }

  return (
    <DashboardSection title="Clases dictadas" description="Tus clases completadas, organizadas por fecha.">
      {byMonth.size === 0 ? (
        <EmptyState
          title="Aún no tienes clases en tu historial."
          description="Las clases aparecerán aquí cuando tu profesor las marque como dictadas."
        />
      ) : (
        <div className="mt-3 space-y-6">
          {[...byMonth.entries()].map(([monthKey, month]) => (
            <section key={monthKey} aria-labelledby={`student-class-history-${monthKey}`}>
              <h3 id={`student-class-history-${monthKey}`} className="flex flex-wrap justify-between gap-2 border-b border-speaking-cobalt/15 pb-2 font-body text-sm font-semibold capitalize text-speaking-cobalt">
                <span>{month.label}</span>
                <span>{month.classes.length} {month.classes.length === 1 ? 'clase vista' : 'clases vistas'}</span>
              </h3>
              <ul className="mt-3 space-y-3">
                {month.classes.map((classItem) => (
                  <li id={`class-${classItem.classroomId}-${new Date(classItem.taughtAt).getTime()}`} key={classItem.id} className="scroll-mt-6 rounded-xl border border-speaking-cobalt/12 bg-white p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {displayableText(classItem.title) && <p className="font-title text-base text-speaking-cobalt">{displayableText(classItem.title)}</p>}
                          <StatusBadge tone="success">Clase dictada</StatusBadge>
                        </div>
                        {displayableText(classItem.classroomName) && (
                          <p className="mt-2 font-body text-sm text-speaking-cobalt/70">{displayableText(classItem.classroomName)}</p>
                        )}
                      </div>
                      <time dateTime={classItem.taughtAt} className="shrink-0 font-body text-sm text-speaking-cobalt/65">
                        {new Date(classItem.taughtAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </time>
                    </div>
                    {displayableText(classItem.notes) && (
                      <div className="mt-4 border-t border-speaking-cobalt/10 pt-3">
                        <h4 className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Apuntes</h4>
                        <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/80">{displayableText(classItem.notes)}</p>
                      </div>
                    )}
                    {displayableText(classItem.improvementOpportunities) && (
                      <div className="mt-4 border-t border-speaking-cobalt/10 pt-3">
                        <h4 className="font-body text-xs font-semibold uppercase text-speaking-cobalt/65">Oportunidades de mejora</h4>
                        <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-6 text-speaking-cobalt/75">{displayableText(classItem.improvementOpportunities)}</p>
                      </div>
                    )}
                    <Link href={`/student/classrooms/${classItem.classroomId}#class-lesson-notes-heading`} className="mt-3 inline-flex min-h-11 items-center font-body text-sm font-semibold text-speaking-cobalt underline-offset-4 hover:underline">Abrir aula</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}