/**
 * Deduction trace (§13, §22): the order in which a player can rule things out
 * using only the published clues. Feeds the hint system. The game's stated
 * rule "the liar is the killer" is applied by reading falseAlibi as culprit.
 */
import type { Axis, Clue, SolvablePuzzle } from "@/lib/schema/puzzle-case";

export type TraceAxis = "culprit" | "method" | "location";
export interface TraceStep {
  kind: "eliminate" | "confirm";
  axis: TraceAxis;
  value: string;
  /** Indexes into puzzle.clues that justify the step; empty for a confirm by exhaustion. */
  clues: number[];
}

type Combo = Record<TraceAxis, string>;
const AXES: TraceAxis[] = ["culprit", "method", "location"];
const asTrace = (a: Axis): TraceAxis => (a === "falseAlibi" ? "culprit" : a);

function holds(clue: Clue, c: Combo): boolean {
  switch (clue.kind) {
    case "not":
      return c[asTrace(clue.axis)] !== clue.value;
    case "is":
      return c[asTrace(clue.axis)] === clue.value;
    case "linked":
      return (c[asTrace(clue.axisA)] === clue.valueA) === (c[asTrace(clue.axisB)] === clue.valueB);
    case "not-linked":
      return !(c[asTrace(clue.axisA)] === clue.valueA && c[asTrace(clue.axisB)] === clue.valueB);
    case "conditional": {
      if (c[asTrace(clue.ifAxis)] !== clue.ifValue) return true;
      return (c[asTrace(clue.thenAxis)] === clue.thenValue) !== clue.thenNegated;
    }
  }
}

export function buildDeductionTrace(puzzle: SolvablePuzzle): TraceStep[] {
  const domains: Record<TraceAxis, string[]> = { culprit: [...puzzle.suspects], method: [...puzzle.methods], location: [...puzzle.locations] };
  const steps: TraceStep[] = [];
  const combos = () =>
    domains.culprit.flatMap((culprit) => domains.method.flatMap((method) => domains.location.map((location) => ({ culprit, method, location }))));
  const confirmed = new Set<TraceAxis>();

  // Smallest group of clues first: one clue alone, then pairs, then triples, then everything together.
  const idx = puzzle.clues.map((_, i) => i);
  const pairs = idx.flatMap((i) => idx.filter((j) => j > i).map((j) => [i, j]));
  const triples = pairs.flatMap(([i, j]) => idx.filter((k) => k > j).map((k) => [i, j, k]));
  const allGroups = [...idx.map((i) => [i]), ...pairs, ...triples, idx];
  const groups = () => allGroups;

  for (;;) {
    for (const axis of AXES) {
      if (domains[axis].length === 1 && !confirmed.has(axis)) {
        confirmed.add(axis);
        steps.push({ kind: "confirm", axis, value: domains[axis][0], clues: [] });
      }
    }
    if (confirmed.size === AXES.length) return steps;
    let found: TraceStep | null = null;
    outer: for (const group of groups()) {
      const live = combos().filter((c) => group.every((i) => holds(puzzle.clues[i], c)));
      for (const axis of AXES) {
        for (const value of domains[axis]) {
          if (!live.some((c) => c[axis] === value)) {
            found = { kind: "eliminate", axis, value, clues: group };
            break outer;
          }
        }
      }
    }
    if (!found) throw new Error("deduction trace stalled: the clues do not determine a unique answer");
    domains[found.axis] = domains[found.axis].filter((v) => v !== found!.value);
    steps.push(found);
  }
}
