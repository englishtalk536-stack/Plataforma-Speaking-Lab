import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="rounded-2xl border border-speaking-cobalt/12 bg-white px-4 py-4 shadow-[0_1px_0_rgba(19,39,67,0.03)] sm:px-5 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-speaking-cobalt/75">{eyebrow}</p> : null}
          <h1 className="mt-1 font-title text-2xl text-speaking-cobalt sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-speaking-cobalt/70">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
