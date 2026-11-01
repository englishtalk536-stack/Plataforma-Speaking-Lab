import type { ReactNode } from 'react';

export function DashboardSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-gradient-to-br from-white via-white to-speaking-background/80 p-4 shadow-[0_12px_32px_rgba(16,52,105,0.07)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-speaking-cobalt before:via-speaking-king before:to-speaking-mustard sm:p-5 lg:p-6">
      <div className="flex flex-col gap-3 border-b border-speaking-cobalt/10 pb-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-title text-xl text-speaking-cobalt sm:text-[1.35rem]">{title}</h2>
          {description ? <p className="mt-1.5 max-w-2xl font-body text-sm leading-6 text-speaking-cobalt/65">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
