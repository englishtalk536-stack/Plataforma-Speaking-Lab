type BadgeTone = 'neutral' | 'success' | 'warning' | 'info' | 'danger';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border border-speaking-cobalt/15 bg-speaking-cobalt/5 text-speaking-cobalt',
  success: 'border border-speaking-success/25 bg-speaking-success/10 text-speaking-success',
  warning: 'border border-speaking-mustard/30 bg-speaking-mustard/10 text-speaking-cobalt',
  info: 'border border-speaking-cobalt/15 bg-white text-speaking-cobalt',
  danger: 'border border-speaking-streak/20 bg-speaking-streak/10 text-speaking-streak',
};

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 py-1 font-body text-xs font-semibold uppercase tracking-[0.04em] ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
