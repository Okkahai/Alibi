/**
 * Real constraint solver for the PuzzleCase logic model (docs/PUZZLE_MODEL.md,
 * docs/CONSTRAINT_SOLVER.md). Backtracking search with fail-fast constraint
 * checking at every partial assignment — no SAT/CSP dependency, justified in
 * the design doc: the search space is at most 8^4 = 4096 nodes.
 *
 * `solve()`'s parameter type (SolvablePuzzle) excludes `solution` so a caller
 * cannot accidentally hand the solver privileged truth — only player-visible
 * clues are ever checked.
 */
import type { Axis, Clue, PuzzleSolution, SolvablePuzzle } from "@/lib/schema/puzzle-case";

export interface SolveResult {
  solutions: PuzzleSolution[];
  isUnique: boolean;
  stepsTried: number;
}

type Assignment = Partial<Record<Axis, string>>;

function axisValue(assignment: Assignment, axis: Axis): string | undefined {
  return assignment[axis];
}

/** True if `clue` is violated by `assignment`. Unassigned axes it references make it unevaluable (treated as not-yet-violated). */
function isViolated(clue: Clue, assignment: Assignment): boolean {
  switch (clue.kind) {
    case "not":
      return axisValue(assignment, clue.axis) === clue.value;
    case "is":
      return axisValue(assignment, clue.axis) !== undefined && axisValue(assignment, clue.axis) !== clue.value;
    case "linked": {
      const a = axisValue(assignment, clue.axisA);
      const b = axisValue(assignment, clue.axisB);
      if (a === undefined || b === undefined) return false;
      if (a === clue.valueA) return b !== clue.valueB;
      if (b === clue.valueB) return a !== clue.valueA;
      return false;
    }
    case "not-linked": {
      const a = axisValue(assignment, clue.axisA);
      const b = axisValue(assignment, clue.axisB);
      if (a === undefined || b === undefined) return false;
      return a === clue.valueA && b === clue.valueB;
    }
    case "conditional": {
      const ifVal = axisValue(assignment, clue.ifAxis);
      const thenVal = axisValue(assignment, clue.thenAxis);
      if (ifVal !== clue.ifValue || thenVal === undefined) return false;
      const thenHolds = thenVal === clue.thenValue;
      return clue.thenNegated ? thenHolds : !thenHolds;
    }
  }
}

function domainFor(axis: Axis, puzzle: SolvablePuzzle): string[] {
  const base = axis === "method" ? puzzle.methods : axis === "location" ? puzzle.locations : puzzle.suspects;
  const unaryExcluded = new Set(
    puzzle.clues.filter((c) => c.kind === "not" && c.axis === axis).map((c) => (c as { value: string }).value)
  );
  const unaryRequired = puzzle.clues.find((c) => c.kind === "is" && c.axis === axis) as
    | { value: string }
    | undefined;
  const filtered = base.filter((v) => !unaryExcluded.has(v));
  return unaryRequired ? filtered.filter((v) => v === unaryRequired.value) : filtered;
}

const AXIS_ORDER: Axis[] = ["culprit", "method", "location", "falseAlibi"];

export function solve(puzzle: SolvablePuzzle): SolveResult {
  const domains = AXIS_ORDER.map((axis) => domainFor(axis, puzzle));
  const solutions: PuzzleSolution[] = [];
  let stepsTried = 0;

  function backtrack(axisIndex: number, assignment: Assignment): boolean {
    if (solutions.length >= 2) return true; // stop early — uniqueness already disproved
    if (axisIndex === AXIS_ORDER.length) {
      solutions.push({
        culprit: assignment.culprit!,
        method: assignment.method!,
        location: assignment.location!,
        falseAlibi: assignment.falseAlibi!,
      });
      return solutions.length >= 2;
    }
    const axis = AXIS_ORDER[axisIndex];
    for (const value of domains[axisIndex]) {
      stepsTried++;
      const next: Assignment = { ...assignment, [axis]: value };
      if (puzzle.clues.some((c) => isViolated(c, next))) continue;
      if (backtrack(axisIndex + 1, next)) return true;
    }
    return false;
  }

  backtrack(0, {});
  return { solutions, isUnique: solutions.length === 1, stepsTried };
}
