import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-speaking-cobalt/10 bg-gradient-to-br from-white to-speaking-white px-5 py-6 shadow-[0_4px_16px_rgba(16,52,105,0.035)] sm:flex-row sm:items-center sm:px-6 sm:py-7">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-speaking-mustard/20 text-speaking-king ring-1 ring-speaking-mustard/25">
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-title text-lg text-speaking-cobalt">{title}</h3>
        <p className="mt-1 max-w-xl font-body text-sm leading-6 text-speaking-cobalt/70">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
