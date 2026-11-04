/**
 * Generates a PuzzleCase (docs/PUZZLE_MODEL.md) by picking a true solution
 * first, then growing a random subset of clues that are true of that
 * solution until solve() proves uniqueness — see docs/CONSTRAINT_SOLVER.md
 * "Generation-time use". Every clue in the pool is true by construction
 * (derived from `solution`), so adding clues can only shrink the solver's
 * candidate set, never introduce a false one; stopping at the first unique
 * result and asserting it equals the intended solution is what proves the
 * generator and the solver agree.
 */
import type { Axis, Clue, PuzzleCase, PuzzleSolution } from "@/lib/schema/puzzle-case";
import { solve } from "./solver";
import { createRng } from "./prng";

export interface GeneratePuzzleCaseOptions {
  seed: string;
  suspectCount: number;
  /** Drop every clue the unique answer does not need (anchors stay), so the player must chain deductions. */
  minimal?: boolean;
}

function otherValues(all: string[], value: string): string[] {
  return all.filter((v) => v !== value);
}

/** Every clue that is true of `solution` — the candidate pool to draw from. */
function buildTrueCluePool(
  solution: PuzzleSolution,
  suspects: string[],
  methods: string[],
  locations: string[]
): Clue[] {
  const pool: Clue[] = [];

  const axisValues: Record<Axis, { all: string[]; value: string }> = {
    culprit: { all: suspects, value: solution.culprit },
    method: { all: methods, value: solution.method },
    location: { all: locations, value: solution.location },
    falseAlibi: { all: suspects, value: solution.falseAlibi },
  };

  for (const axis of Object.keys(axisValues) as Axis[]) {
    const { all, value } = axisValues[axis];
    for (const wrong of otherValues(all, value)) {
      pool.push({ kind: "not", axis, value: wrong });
    }
  }

  // No culprit/falseAlibi pairs: the solver's standing rule (the liar is the killer) makes them empty.
  const axisPairs: [Axis, Axis][] = [
    ["culprit", "method"],
    ["culprit", "location"],
    ["method", "location"],
  ];
  for (const [axisA, axisB] of axisPairs) {
    const valueA = axisValues[axisA].value;
    const valueB = axisValues[axisB].value;
    pool.push({ kind: "linked", axisA, valueA, axisB, valueB });
    for (const wrongB of otherValues(axisValues[axisB].all, valueB)) {
      pool.push({ kind: "not-linked", axisA, valueA, axisB, valueB: wrongB });
    }
    pool.push({ kind: "conditional", ifAxis: axisA, ifValue: valueA, thenAxis: axisB, thenValue: valueB, thenNegated: false });
  }

  return pool;
}

export function generatePuzzleCase({ seed, suspectCount, minimal = false }: GeneratePuzzleCaseOptions): PuzzleCase {
  const rng = createRng(seed);
  const suspects = Array.from({ length: suspectCount }, (_, i) => `suspect_${i}`);
  const methods = Array.from({ length: suspectCount }, (_, i) => `method_${i}`);
  const locations = Array.from({ length: suspectCount }, (_, i) => `location_${i}`);

  const culprit = rng.pick(suspects);
  const solution: PuzzleSolution = {
    culprit,
    method: rng.pick(methods),
    location: rng.pick(locations),
    falseAlibi: culprit,
  };

  const pool = buildTrueCluePool(solution, suspects, methods, locations);

  // Always include the two clues that directly tie the culprit to a method/location
  // (not merely eliminate everyone else) — the deduction should end on a positive
  // link, not pure elimination, and downstream narrative rendering needs at least
  // one clue that names the culprit to build the accusation's key evidence from.
  // Minimal mode keeps no forced anchors and no "is" clues (those state an answer outright), so the answer has to be chained.
  const usable = minimal ? pool.filter((c) => c.kind !== "is") : pool;
  const anchorClues = minimal ? [] : pool.filter(
    (c): c is Extract<Clue, { kind: "linked" }> =>
      c.kind === "linked" && c.axisA === "culprit" && (c.axisB === "method" || c.axisB === "location")
  );
  const restPool = usable.filter((c) => !anchorClues.includes(c as never));
  const shuffledPool = [...anchorClues, ...rng.sample(restPool, restPool.length)];

  const clues: Clue[] = [];
  for (const clue of shuffledPool) {
    clues.push(clue);
    if (clues.length >= anchorClues.length && solve({ suspects, methods, locations, clues }).isUnique) break;
  }

  if (minimal) {
    // Try removing each non-anchor clue, in seeded order; keep the removal when uniqueness survives.
    for (const clue of rng.sample(clues.slice(anchorClues.length), clues.length - anchorClues.length)) {
      const without = clues.filter((c) => c !== clue);
      if (solve({ suspects, methods, locations, clues: without }).isUnique) clues.splice(clues.indexOf(clue), 1);
    }
  }

  const result = solve({ suspects, methods, locations, clues });
  if (!result.isUnique || JSON.stringify(result.solutions[0]) !== JSON.stringify(solution)) {
    throw new Error(
      `generatePuzzleCase: seed "${seed}" did not converge to the intended unique solution (got ${JSON.stringify(result)}).`
    );
  }

  return { suspects, methods, locations, clues, solution };
}
