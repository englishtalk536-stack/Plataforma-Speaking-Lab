import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { XpProgressBar } from './XpProgressBar';
import { StreakFlame } from './StreakFlame';
import { CoinsBalance } from './CoinsBalance';
import { roleLabels, type AppRole } from '../../lib/auth';

export interface StudentHeaderProps {
  fullName: string;
  avatarUrl?: string | null;
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  coins: number;
  /** Bump to play the reward-burst animation on the XP bar and coins chip. */
  rewardTrigger?: number;
}

/**
 * The dashboard's HUD row: who the student is, their level and progress
 * toward the next one, and their two "always-on" gamified stats (streak,
 * coins) as standalone chips — deliberately not boxed into a generic card,
 * so it reads as a status bar rather than another dashboard widget.
 */
export function StudentHeader({
  fullName,
  avatarUrl,
  level,
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
  currentStreak,
  coins,
  rewardTrigger = 0,
}: StudentHeaderProps) {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? fullName;
  const displayRole = roleLabels[(session?.user?.role ?? 'STUDENT') as AppRole];

  return (
    <header className="relative isolate flex flex-col gap-4 overflow-hidden rounded-2xl border border-speaking-cobalt/20 bg-speaking-cobalt px-5 py-5 shadow-[0_12px_32px_rgba(16,52,105,0.18)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 bg-gradient-to-l from-speaking-king/45 to-transparent" />
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="56px"
              className="rounded-full border-2 border-speaking-mustard object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-speaking-mustard bg-speaking-king font-title text-lg text-speaking-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-speaking-cobalt bg-speaking-mustard font-title text-xs text-speaking-cobalt">
            {level}
          </span>
        </div>

        <div className="min-w-0 flex-1 sm:min-w-[220px]">
          <p className="font-title text-lg leading-tight text-speaking-white">{displayName}</p>
          <p className="font-body text-xs uppercase tracking-wide text-speaking-white/60">{displayRole}</p>
          <XpProgressBar
            className="mt-2.5 w-full max-w-xs"
            currentXp={currentXp}
            xpForCurrentLevel={xpForCurrentLevel}
            xpForNextLevel={xpForNextLevel}
            burstTrigger={rewardTrigger}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto sm:gap-3">
        <StreakFlame currentStreak={currentStreak} />
        <CoinsBalance coins={coins} burstTrigger={rewardTrigger} />
      </div>
    </header>
  );
}
