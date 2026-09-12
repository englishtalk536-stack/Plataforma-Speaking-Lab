import { AlertTriangle } from 'lucide-react';

export interface DashboardErrorProps {
  message: string;
  onRetry: () => void;
}

export function DashboardError({ message, onRetry }: DashboardErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-speaking-white p-6">
      <div className="max-w-sm rounded-2xl border border-speaking-locked/20 bg-speaking-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-8 w-8 text-speaking-streak" aria-hidden="true" />
        <p className="mt-3 font-title text-lg text-speaking-cobalt">Couldn&apos;t load your dashboard</p>
        <p className="mt-1 font-body text-sm text-speaking-cobalt/70">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-speaking-king px-5 py-2 font-body text-sm font-semibold text-speaking-white transition-colors hover:bg-speaking-cobalt"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
