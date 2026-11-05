/**
 * Per-browser record of finished daily cases, for the archive's ledger and
 * stats. No account: it lives in localStorage like the saves.
 */
export interface DailyResult {
  percentage: number;
  culpritCorrect: boolean;
  /** UTC date the finding was filed; only same-day finds count toward the streak. */
  playedOn: string;
}

export type DailyResults = Record<string, DailyResult>;

export const RESULTS_KEY = "alibi:daily-results";

export function loadResults(): DailyResults {
  try {
    return JSON.parse(window.localStorage.getItem(RESULTS_KEY) ?? "{}") as DailyResults;
  } catch {
    return {};
  }
}

/** Keeps the first finding for a day: replays do not overwrite the record. */
export function recordResult(seed: string, result: DailyResult): void {
  try {
    const all = loadResults();
    if (all[seed]) return;
    window.localStorage.setItem(RESULTS_KEY, JSON.stringify({ ...all, [seed]: result }));
  } catch {
    // Storage unavailable (private mode): the ledger simply shows nothing.
  }
}

export interface DailyStats {
  played: number;
  solved: number;
  average: number | null;
  streak: number;
  longest: number;
}

const dayBefore = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

export function dailyStats(results: DailyResults, today: string): DailyStats {
  const entries = Object.entries(results);
  const onTime = new Set(entries.filter(([seed, r]) => r.playedOn === seed).map(([seed]) => seed));

  let longest = 0;
  for (const seed of onTime) {
    if (onTime.has(dayBefore(seed))) continue; // not the start of a run
    let run = 0;
    for (let d = seed; onTime.has(d); d = new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)) run++;
    longest = Math.max(longest, run);
  }

  // The current streak survives until today's case is missed, so it may end yesterday.
  let streak = 0;
  for (let d = onTime.has(today) ? today : dayBefore(today); onTime.has(d); d = dayBefore(d)) streak++;

  return {
    played: entries.length,
    solved: entries.filter(([, r]) => r.culpritCorrect).length,
    average: entries.length ? Math.round(entries.reduce((s, [, r]) => s + r.percentage, 0) / entries.length) : null,
    streak,
    longest,
  };
}
