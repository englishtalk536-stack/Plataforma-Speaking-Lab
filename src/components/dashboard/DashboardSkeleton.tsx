function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-speaking-cobalt/10 ${className}`} />;
}

/** Mirrors the real dashboard's layout regions so the page doesn't jump when data arrives. */
export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen gap-4 bg-speaking-white p-4 sm:p-6" aria-busy="true" aria-live="polite">
      <Pulse className="w-16 shrink-0 bg-speaking-cobalt/20" />

      <main className="flex-1 space-y-6">
        <Pulse className="h-24 bg-speaking-cobalt/20" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <Pulse className="h-6 w-32" />
            <Pulse className="mt-4 h-80" />
          </div>
          <div className="space-y-6">
            <div>
              <Pulse className="h-6 w-40" />
              <Pulse className="mt-4 h-56" />
            </div>
            <Pulse className="h-40" />
          </div>
        </div>
      </main>
    </div>
  );
}
