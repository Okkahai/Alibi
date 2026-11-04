/**
 * Progressive hints (§13), read off the case's deduction trace and the
 * player's own grid. Level 1 points, level 2 explains, level 3 names the mark.
 * Every hint restates a published exhibit; none adds a fact.
 */
import type { CaseTruth } from "@/lib/schema/case-truth";
import type { Cells } from "@/lib/state/matrix";

export interface HintState {
  used: number;
  last: { step: number; level: 1 | 2 | 3 } | null;
  log: string[];
}
export const EMPTY_HINTS: HintState = { used: 0, last: null, log: [] };

const GRID_KEY = { culprit: "person", method: "method", location: "room" } as const;
const PLURAL = { culprit: "persons", method: "methods", location: "rooms" } as const;

/** Grid cells are keyed "axis:id|axis:id" (matrix.ts cellKey). */
function marksOn(cells: Cells, axisKey: string, id: string) {
  const tag = `${axisKey}:${id}`;
  return Object.entries(cells).filter(([k]) => k.split("|").includes(tag)).map(([, m]) => m);
}

function confirmedOther(cells: Cells, axisKey: string, id: string) {
  return Object.entries(cells).some(([k, m]) => m === "o" && k.split("|").some((p) => p.startsWith(`${axisKey}:`) && p !== `${axisKey}:${id}`));
}

/** Has the player's grid already recorded this step? `slots` = cells the value has in the grid. */
function reflected(step: CaseTruth["deduction"][number], cells: Cells, slots: number): boolean {
  const key = GRID_KEY[step.axis];
  const marks = marksOn(cells, key, step.value);
  if (step.kind === "confirm") return marks.includes("o");
  return confirmedOther(cells, key, step.value) || (marks.length === slots && marks.every((m) => m === "x"));
}

export function nextHint(truth: CaseTruth, cells: Cells, discovered: string[], state: HintState): { state: HintState; text: string } | null {
  const steps = truth.deduction;
  if (!steps.length) return null;
  const count = { person: truth.characters.filter((c) => c.role === "suspect").length, method: truth.methods.length, room: truth.locations.length };
  const slotsFor = (axis: keyof typeof GRID_KEY) => {
    const k = GRID_KEY[axis];
    // Blocks: person×method, person×room, room×method (deduction/page.tsx).
    return k === "person" ? count.method + count.room : k === "method" ? count.person + count.room : count.person + count.method;
  };
  // A mark that contradicts the exhibits poisons every later step, so it comes first (step -1).
  const answer = new Map(steps.filter((s) => s.kind === "confirm").map((s) => [`${GRID_KEY[s.axis]}:${s.value}`, true]));
  const wrong = Object.entries(cells).find(([k, m]) => {
    const parts = k.split("|");
    return m === "o" ? parts.some((p) => !answer.has(p)) : parts.every((p) => answer.has(p));
  });
  if (wrong) {
    const level = state.last?.step === -1 ? (Math.min(state.last.level + 1, 3) as 1 | 2 | 3) : 1;
    const [k, m] = wrong;
    const label = (part: string) => {
      const [axis, id] = part.split(":");
      return axis === "person" ? truth.characters.find((c) => c.id === id)?.name : axis === "method" ? truth.methods.find((x) => x.id === id)?.name : truth.locations.find((l) => l.id === id)?.name;
    };
    const text = [
      "One of the marks already in your grid contradicts the exhibits.",
      `Re-check your ${m === "o" ? "✓" : "✕"} marks: one of them cannot be right.`,
      `Your ${m === "o" ? "✓" : "✕"} at ${k.split("|").map(label).join(" × ")} contradicts the exhibits.`,
    ][level - 1];
    const repeat = state.last?.step === -1 && state.last.level === level;
    return { text, state: repeat ? state : { used: state.used + 1, last: { step: -1, level }, log: [...state.log, text] } };
  }

  const index = steps.findIndex((s) => !reflected(s, cells, slotsFor(s.axis)));
  if (index === -1) return { state, text: "Your grid already records every deduction the exhibits allow. Proceed to the conclusion." };

  const level = state.last?.step === index ? (Math.min(state.last.level + 1, 3) as 1 | 2 | 3) : 1;
  const repeat = state.last?.step === index && state.last.level === level;
  const step = steps[index];
  const name =
    step.axis === "culprit"
      ? truth.characters.find((c) => c.id === step.value)?.name
      : step.axis === "method"
        ? truth.methods.find((m) => m.id === step.value)?.name
        : truth.locations.find((l) => l.id === step.value)?.name;
  const exNo = (id: string) => `EX-${String(truth.evidence.findIndex((e) => e.id === id) + 1).padStart(2, "0")}`;
  const exs = step.evidenceIds.map(exNo).join(" with ");
  const unseen = step.evidenceIds.filter((id) => !discovered.includes(id));
  const roomOf = (id: string) => truth.locations.find((l) => l.id === truth.evidence.find((e) => e.id === id)?.locationId)?.name;
  const plural = PLURAL[step.axis];

  let text: string;
  if (step.kind === "confirm") {
    text = [
      `Look at the ${plural} you have not yet ruled out.`,
      `Only one of the ${plural} survives what the exhibits have ruled out so far.`,
      `${name} is the only one of the ${plural} left: mark it ✓.`,
    ][level - 1];
  } else if (level === 1) {
    text = unseen.length ? `A marker you have not examined, in ${roomOf(unseen[0])}, bears on the ${plural}.` : `Read ${exs} against the ${plural}.`;
  } else if (level === 2) {
    text = `${exs} ${step.evidenceIds.length > 1 ? "together are" : "on its own is"} enough to rule out one of the ${plural}.`;
  } else {
    text = `${exs} rules out ${name}. Cross out every cell for it.`;
  }
  return {
    text,
    state: repeat ? state : { used: state.used + 1, last: { step: index, level }, log: [...state.log, text] },
  };
}

export const hintKey = (caseId: string) => `coldcase:hints:${caseId}`;

export function loadHints(caseId: string): HintState {
  try {
    const raw = window.localStorage.getItem(hintKey(caseId));
    if (raw) return { ...EMPTY_HINTS, ...JSON.parse(raw) };
  } catch {
    // unreadable storage: no hints recorded
  }
  return EMPTY_HINTS;
}
