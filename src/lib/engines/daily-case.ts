/**
 * Daily Mode — docs/11-daily-mode.md. The date itself is the seed: no new
 * generation logic needed, just deterministic id/selection derivation on
 * top of the existing `generateCase()` (src/lib/engines/narrative-generator.ts).
 */
import type { CaseSelection } from "@/lib/state/case-select";
import type { ScoreBreakdown } from "./evaluation-engine";

export const DAILY_DIFFICULTY = "medium" as const;
export const DAILY_MOVES_BUDGET = 20;

/** UTC calendar date as "YYYY-MM-DD", so every player gets the same day regardless of timezone. */
export function getUtcDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyCaseId(date: Date = new Date()): string {
  return `daily-${getUtcDateString(date)}`;
}

export function getDailySelection(date: Date = new Date()): CaseSelection {
  return { kind: "generated", seed: getUtcDateString(date), difficulty: DAILY_DIFFICULTY };
}

/** Sequential day number since launch, for the share text's "#142" — mirrors Wordle's puzzle numbering. */
export function getDailyDayNumber(date: Date, launchDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayMs = Date.parse(`${getUtcDateString(date)}T00:00:00Z`);
  const launchMs = Date.parse(`${getUtcDateString(launchDate)}T00:00:00Z`);
  return Math.floor((dayMs - launchMs) / msPerDay) + 1;
}

/**
 * No spoilers: verdicts as ✓/✗ against field names, never a name or fact.
 * A ledger line, in the dossier's own voice, rather than a coloured grid.
 */
export function formatDailyShareText(breakdown: ScoreBreakdown, date: Date, dayNumber: number): string {
  const mark = (ok: boolean) => (ok ? "✓" : "✗");
  const fields = [
    `Culprit ${mark(breakdown.culprit.correct)}`,
    `Method ${mark(breakdown.method.correct)}`,
    ...(breakdown.location ? [`Room ${mark(breakdown.location.correct)}`] : []),
  ].join("  ");
  const exhibits = `Exhibits ${breakdown.keyEvidence.matched.length}/${breakdown.keyEvidence.matched.length + breakdown.keyEvidence.missed.length}`;
  const hints = breakdown.hints.used === 0 ? "No hints" : `${breakdown.hints.used} hint${breakdown.hints.used === 1 ? "" : "s"}`;
  return [
    `ALIBI · Case Nº ${String(dayNumber).padStart(3, "0")} · ${getUtcDateString(date)}`,
    fields,
    `${exhibits} · ${hints}`,
    `Finding: ${breakdown.totalPoints}/${breakdown.maxPoints}`,
  ].join("\n");
}

/** Day one of the published daily series; case numbers count from here. */
export const DAILY_LAUNCH_DATE = new Date("2026-11-01T00:00:00Z");

/** "004"-style case number for a daily date seed ("YYYY-MM-DD"), or null for non-daily cases. */
export function dailyCaseNumber(seed: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(seed)) return null;
  const n = getDailyDayNumber(new Date(`${seed}T00:00:00Z`), DAILY_LAUNCH_DATE);
  return n > 0 ? String(n).padStart(3, "0") : null;
}
