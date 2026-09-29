/**
 * Daily Mode — docs/11-daily-mode.md. The date itself is the seed: no new
 * generation logic needed, just deterministic id/selection derivation on
 * top of the existing `generateCase()` (src/lib/engines/case-generator.ts).
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

const CATEGORY_ORDER = ["culprit", "motive", "method", "keyEvidence", "timeline"] as const;

function squareFor(breakdown: ScoreBreakdown, category: (typeof CATEGORY_ORDER)[number]): string {
  const entry = breakdown[category];
  if ("correct" in entry) return entry.correct ? "🟩" : "⬛";
  // keyEvidence / timeline: partial credit by ratio of matched to total.
  const total = "matched" in entry ? entry.matched.length + entry.missed.length : 0;
  if (total === 0) return "⬛";
  const ratio = entry.matched.length / total;
  if (ratio >= 1) return "🟩";
  if (ratio > 0) return "🟨";
  return "⬛";
}

/** No spoilers: only the emoji grid and percentage, never suspect names or facts. */
export function formatDailyShareText(breakdown: ScoreBreakdown, date: Date, dayNumber: number): string {
  const grid = CATEGORY_ORDER.map((c) => squareFor(breakdown, c)).join("");
  return `ColdCase AI #${dayNumber} (${getUtcDateString(date)})\n${grid}  ${breakdown.percentage}%`;
}
