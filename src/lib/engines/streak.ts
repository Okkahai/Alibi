/**
 * Daily-mode streak tracking — docs/11-daily-mode.md. Pure and storage-agnostic:
 * the caller persists the returned DailyStreak (localStorage, per docs/11).
 */
export interface DailyStreak {
  current: number;
  longest: number;
  lastPlayedDate: string | null; // "YYYY-MM-DD", UTC
}

export const EMPTY_STREAK: DailyStreak = { current: 0, longest: 0, lastPlayedDate: null };

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / msPerDay);
}

/**
 * Records a completed daily case for `playedDate` (UTC "YYYY-MM-DD").
 * Same-day replays are a no-op (idempotent). A gap of more than one day
 * resets the streak to 1 rather than continuing it.
 */
export function recordDailyPlay(prev: DailyStreak, playedDate: string): DailyStreak {
  if (prev.lastPlayedDate === playedDate) return prev;

  const gap = prev.lastPlayedDate ? daysBetween(prev.lastPlayedDate, playedDate) : null;
  const current = gap === 1 ? prev.current + 1 : 1;

  return {
    current,
    longest: Math.max(prev.longest, current),
    lastPlayedDate: playedDate,
  };
}
