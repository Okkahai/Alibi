import type { CaseTruth } from "@/lib/schema/case-truth";
import { CASE_SELECTION_KEY, type CaseSelection } from "@/lib/state/case-select";
import { dailyCaseNumber } from "@/lib/engines/daily-case";

export interface CaseMeta {
  number: string | null;
  kicker: string;
}

export function formatCaseDate(seed: string): string {
  return new Date(`${seed}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function caseMeta(selection: CaseSelection | null): CaseMeta {
  if (!selection) return { number: null, kicker: "Case file" };
  if (selection.kind === "static") return { number: "H-01", kicker: "Handcrafted file" };
  const daily = dailyCaseNumber(selection.seed);
  if (daily) return { number: daily, kicker: `Daily case · ${formatCaseDate(selection.seed)}` };
  return { number: `P-${selection.seed.slice(0, 3).toUpperCase()}`, kicker: `Practice file · ${selection.difficulty}` };
}

/** Client-only: the selection the AppShell hydrated from. */
export function readSelection(): CaseSelection | null {
  try {
    const raw = window.localStorage.getItem(CASE_SELECTION_KEY);
    return raw ? (JSON.parse(raw) as CaseSelection) : null;
  } catch {
    return null;
  }
}

/** Open a case file: persist the choice and reload so GameProvider starts clean. */
export function openCase(selection: CaseSelection, href = "/") {
  window.localStorage.setItem(CASE_SELECTION_KEY, JSON.stringify(selection));
  window.location.href = href;
}

/** The time the engraving's watch shows: when the body was found, else the last recorded event. */
export function plateTime(truth: CaseTruth): string {
  const found = truth.timeline.find((e) => /body|found|discover/i.test(e.description));
  const sorted = [...truth.timeline].sort((a, b) => a.time.localeCompare(b.time));
  return found?.time ?? sorted.at(-1)?.time ?? "22:15";
}
