import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { DailyQuestStatusDto } from '../../lib/types/dashboard';

export interface DailyQuestCardProps {
  questTitle: string;
  questDescription: string;
  xpReward: number;
  coinReward: number;
  activityType: string;
  resourceUrl: string | null;
  status: DailyQuestStatusDto;
  isSubmitting?: boolean;
  onStart: () => void;
  className?: string;
}

/** CTA panel prompting the student toward today's voice quest. */
export function DailyQuestCard({
  questTitle,
  questDescription,
  xpReward,
  coinReward,
  activityType,
  resourceUrl,
  status,
  isSubmitting = false,
  onStart,
  className = '',
}: DailyQuestCardProps) {
  const isCompleted = status === 'COMPLETED';
  const activityLabels: Record<string, string> = {
    SPEAKING: 'Speaking', LISTENING: 'Listening', PRACTICE: 'Práctica', VIDEO: 'Vídeo',
    GAME: 'Juego', TOPIC: 'Tema', VOCABULARY: 'Vocabulario',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-speaking-mustard/35 bg-gradient-to-br from-speaking-mustard/20 via-white to-speaking-white p-5 shadow-[0_5px_18px_rgba(16,52,105,0.05)] transition duration-200 hover:shadow-[0_10px_26px_rgba(16,52,105,0.10)] sm:p-6 ${className}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-speaking-mustard" aria-hidden="true" />
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-speaking-mustard/25 text-speaking-cobalt ring-1 ring-speaking-mustard/25">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-body text-xs font-bold uppercase tracking-[0.1em] text-speaking-king">{activityLabels[activityType] ?? 'Reto diario'}</span>
            {isCompleted && <span className="inline-flex items-center gap-1 font-body text-xs font-bold uppercase tracking-[0.06em] text-speaking-success"><Check className="h-3.5 w-3.5" aria-hidden="true" />Hecho</span>}
          </div>
          <p className="font-title text-lg text-speaking-cobalt">{questTitle}</p>
          <p className="mt-1.5 font-body text-sm leading-6 text-speaking-cobalt/70">{questDescription}</p>
        </div>
      </div>

      {resourceUrl && !isCompleted && (resourceUrl.startsWith('http') ? (
        <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-10 items-center justify-center border border-speaking-cobalt/15 bg-white px-3 font-body text-xs font-semibold text-speaking-cobalt transition-colors hover:border-speaking-king/35 hover:bg-speaking-cobalt/[0.03]">
          Abrir recurso
        </a>
      ) : (
        <Link href={resourceUrl} className="mt-4 inline-flex min-h-10 items-center justify-center border border-speaking-cobalt/15 bg-white px-3 font-body text-xs font-semibold text-speaking-cobalt transition-colors hover:border-speaking-king/35 hover:bg-speaking-cobalt/[0.03]">
          Abrir práctica
        </Link>
      ))}

      <button
        type="button"
        onClick={onStart}
        disabled={isCompleted || isSubmitting}
        className={`mt-5 flex min-h-12 w-full flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-body text-sm font-semibold transition duration-200 ${
          isCompleted
            ? 'cursor-default bg-speaking-success/10 text-speaking-success ring-1 ring-speaking-success/20'
            : 'bg-speaking-cobalt text-speaking-white shadow-[0_4px_12px_rgba(16,52,105,0.16)] hover:-translate-y-0.5 hover:bg-speaking-king hover:shadow-[0_7px_18px_rgba(16,52,105,0.22)] disabled:cursor-wait disabled:opacity-70'
        }`}
      >
        {isCompleted ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>Completada hoy</span>
          </>
        ) : (
          <>
            <span>{isSubmitting ? 'Abriendo…' : 'Realizar misión'}</span>
            <span className="rounded-lg bg-speaking-white/15 px-2 py-1 text-xs">+{xpReward} XP</span>
            <span className="rounded-lg bg-speaking-white/15 px-2 py-1 text-xs">+{coinReward} monedas</span>
          </>
        )}
      </button>
    </div>
  );
}
