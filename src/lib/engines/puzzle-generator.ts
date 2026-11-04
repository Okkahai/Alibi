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
import { buildDeductionTrace } from "./deduction-trace";

export interface GeneratePuzzleCaseOptions {
  seed: string;
  suspectCount: number;
  /** Rules v2: a minimal clue set drawn from all true clues (decoys included), with no forced anchors or "is" clues. */
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

const PAIR_AXES: [Axis, Axis][] = [
  ["culprit", "method"],
  ["culprit", "location"],
  ["method", "location"],
];

/**
 * Rules v2 pool: every true clue, including pair clues about wrong values
 * ("if Bram did it, it was the cellar" is true when Bram is innocent). Without
 * these, merely being named in an if/either clue gives the answer away.
 */
function buildFullTruePool(solution: PuzzleSolution, suspects: string[], methods: string[], locations: string[]): Clue[] {
  const domain: Record<Axis, string[]> = { culprit: suspects, method: methods, location: locations, falseAlibi: suspects };
  const answer: Record<Axis, string> = { culprit: solution.culprit, method: solution.method, location: solution.location, falseAlibi: solution.falseAlibi };
  const pool: Clue[] = [];
  for (const axis of ["culprit", "method", "location", "falseAlibi"] as Axis[]) {
    for (const value of otherValues(domain[axis], answer[axis])) pool.push({ kind: "not", axis, value });
  }
  for (const [axisA, axisB] of PAIR_AXES) {
    for (const valueA of domain[axisA]) {
      for (const valueB of domain[axisB]) {
        const a = valueA === answer[axisA];
        const b = valueB === answer[axisB];
        if (a === b) pool.push({ kind: "linked", axisA, valueA, axisB, valueB });
        if (!(a && b)) pool.push({ kind: "not-linked", axisA, valueA, axisB, valueB });
        if (!a || b) pool.push({ kind: "conditional", ifAxis: axisA, ifValue: valueA, thenAxis: axisB, thenValue: valueB, thenNegated: false });
      }
    }
  }
  return pool;
}

/**
 * The "who gets named" shortcut: if the if/either/not-both exhibits mention
 * only the answer, or every option but the answer — or the exhibits as a whole
 * mention every option but the answer — a player can read it off without
 * deducing anything.
 */
export function namesGiveAnswerAway({ suspects, methods, locations, clues, solution }: PuzzleCase): boolean {
  const named: Record<string, Set<string>> = { culprit: new Set(), method: new Set(), location: new Set() };
  const add = (axis: Axis, value: string) => named[axis === "falseAlibi" ? "culprit" : axis].add(value);
  for (const c of clues) {
    if (c.kind === "linked" || c.kind === "not-linked") {
      add(c.axisA, c.valueA);
      add(c.axisB, c.valueB);
    } else if (c.kind === "conditional") {
      add(c.ifAxis, c.ifValue);
      add(c.thenAxis, c.thenValue);
    }
  }
  const answer: Record<string, string> = { culprit: solution.culprit, method: solution.method, location: solution.location };
  const size: Record<string, number> = { culprit: suspects.length, method: methods.length, location: locations.length };
  // Counting "not" exhibits too: the one option no exhibit ever mentions (e.g. the one suspect with no Chronology entry).
  const mentioned: Record<string, Set<string>> = { culprit: new Set(named.culprit), method: new Set(named.method), location: new Set(named.location) };
  for (const c of clues) if (c.kind === "not" || c.kind === "is") mentioned[c.axis === "falseAlibi" ? "culprit" : c.axis].add(c.value);
  return Object.keys(named).some(
    (axis) =>
      (named[axis].has(answer[axis]) ? named[axis].size === 1 : named[axis].size === size[axis] - 1) ||
      (!mentioned[axis].has(answer[axis]) && mentioned[axis].size === size[axis] - 1)
  );
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

  if (minimal) return generateMinimal(rng, seed, suspects, methods, locations, solution);

  const pool = buildTrueCluePool(solution, suspects, methods, locations);

  // Always include the two clues that directly tie the culprit to a method/location
  // (not merely eliminate everyone else) — the deduction should end on a positive
  // link, not pure elimination, and downstream narrative rendering needs at least
  // one clue that names the culprit to build the accusation's key evidence from.
  const anchorClues = pool.filter(
    (c): c is Extract<Clue, { kind: "linked" }> =>
      c.kind === "linked" && c.axisA === "culprit" && (c.axisB === "method" || c.axisB === "location")
  );
  const restPool = pool.filter((c) => !anchorClues.includes(c as never));
  const shuffledPool = [...anchorClues, ...rng.sample(restPool, restPool.length)];

  const clues: Clue[] = [];
  for (const clue of shuffledPool) {
    clues.push(clue);
    if (clues.length >= anchorClues.length && solve({ suspects, methods, locations, clues }).isUnique) break;
  }

  const result = solve({ suspects, methods, locations, clues });
  if (!result.isUnique || JSON.stringify(result.solutions[0]) !== JSON.stringify(solution)) {
    throw new Error(
      `generatePuzzleCase: seed "${seed}" did not converge to the intended unique solution (got ${JSON.stringify(result)}).`
    );
  }

  return { suspects, methods, locations, clues, solution };
}

/** Rules v2: grow from the full true pool, prune to a minimal set, and redraw if the names give the answer away. */
function generateMinimal(
  rng: ReturnType<typeof createRng>,
  seed: string,
  suspects: string[],
  methods: string[],
  locations: string[],
  solution: PuzzleSolution
): PuzzleCase {
  const pool = buildFullTruePool(solution, suspects, methods, locations);
  const isUnique = (clues: Clue[]) => solve({ suspects, methods, locations, clues }).isUnique;
  let clues: Clue[] = [];
  for (let attempt = 0; attempt < 400; attempt++) {
    clues = [];
    for (const clue of rng.sample(pool, pool.length)) {
      clues.push(clue);
      if (isUnique(clues)) break;
    }
    // Drop each clue, in seeded order, whenever uniqueness survives without it.
    for (const clue of rng.sample(clues, clues.length)) {
      const without = clues.filter((c) => c !== clue);
      if (isUnique(without)) clues = without;
    }
    if (namesGiveAnswerAway({ suspects, methods, locations, clues, solution })) continue;
    // Redraw sets whose deduction needs more than three exhibits at once: no hint could explain that step.
    if (buildDeductionTrace({ suspects, methods, locations, clues }).every((step) => step.clues.length <= 3)) break;
  }
  const result = solve({ suspects, methods, locations, clues });
  if (!result.isUnique || JSON.stringify(result.solutions[0]) !== JSON.stringify(solution) || namesGiveAnswerAway({ suspects, methods, locations, clues, solution })) {
    throw new Error(`generatePuzzleCase: seed "${seed}" found no fair minimal clue set.`);
  }
  // Shuffle the exhibit order: otherwise the last exhibit is the one that made the answer unique.
  return { suspects, methods, locations, clues: rng.sample(clues, clues.length), solution };
}
