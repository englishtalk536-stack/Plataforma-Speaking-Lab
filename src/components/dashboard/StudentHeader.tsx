import Image from 'next/image';
import { XpProgressBar } from './XpProgressBar';
import { StreakFlame } from './StreakFlame';
import { CoinsBalance } from './CoinsBalance';

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
  return (
    <header className="flex flex-col gap-4 rounded-2xl bg-speaking-cobalt px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              sizes="56px"
              className="rounded-full border-2 border-speaking-mustard object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-speaking-mustard bg-speaking-king font-title text-lg text-speaking-white">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-speaking-cobalt bg-speaking-mustard font-title text-[11px] text-speaking-cobalt">
            {level}
          </span>
        </div>

        <div className="min-w-[180px]">
          <p className="font-title text-lg leading-tight text-speaking-white">{fullName}</p>
          <XpProgressBar
            className="mt-1.5 w-48"
            currentXp={currentXp}
            xpForCurrentLevel={xpForCurrentLevel}
            xpForNextLevel={xpForNextLevel}
            burstTrigger={rewardTrigger}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <StreakFlame currentStreak={currentStreak} />
        <CoinsBalance coins={coins} burstTrigger={rewardTrigger} />
      </div>
    </header>
  );
}
