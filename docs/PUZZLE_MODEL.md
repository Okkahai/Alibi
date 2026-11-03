# Puzzle Model — Phase 2

Formal model for a daily case, separate from the narrative `CaseTruth`
(`src/lib/schema/case-truth.ts`). `CaseTruth` stays as the narrative/content
layer (names, flavor text, NPC knowledge for the LLM interrogation mode).
This model is the **logic layer**: the thing the solver reasons over and
the thing that proves a puzzle has exactly one answer, from clues alone.

## Why a separate model (see `docs/REBUILD_AUDIT.md`)

`validateCaseTruth()` reads hidden-truth fields (`isCulprit`,
`relatedCharacterIds`, `reliability`) directly — it can't tell whether the
*player*, using only clue text, can reach the same answer. The puzzle model
fixes this by making "what the player can read" (`Clue[]`) and "what's
true" (`PuzzleSolution`) two separate, explicit values, so the solver can
be run against clues alone and compared to the true solution afterward.

## Variables

A case is a small CSP (constraint satisfaction problem) over 4 axes, each
a finite set of **distinct** values of equal size `N` (`N` = suspect count,
3–8 per difficulty, matching `SUSPECT_COUNT_BOUNDS`):

```ts
type Axis = "culprit" | "method" | "location" | "falseAlibi";

interface PuzzleCase {
  suspects: string[];      // N ids — also the domain for "culprit" and "falseAlibi"
  methods: string[];       // N ids
  locations: string[];     // N ids
  clues: Clue[];           // player-visible constraints
  solution: PuzzleSolution; // hidden ground truth, for grading + generation-time proof
}

interface PuzzleSolution {
  culprit: string;     // one of suspects
  method: string;      // one of methods
  location: string;     // one of locations
  falseAlibi: string;  // one of suspects whose claimed alibi is the one that breaks (usually === culprit, but modeled separately so an innocent suspect's unrelated lie can exist without becoming "the answer")
}
```

Note: `falseAlibi` is its own axis, not hard-coded to equal `culprit`, so
§10E's "innocent suspects may conceal unrelated facts" is representable:
a puzzle can assert `falseAlibi === culprit` (the common case) or leave it
as a distinct, separately-clued value when a design wants a genuine red
herring suspect with a lie that doesn't make them the killer.

## Clues

A clue is a predicate over the solution space, stated in a form that can
both (a) be rendered as flavor text and (b) be checked mechanically against
any candidate assignment:

```ts
type Clue =
  | { kind: "not"; axis: Axis; value: string }                         // "It wasn't Marcus."
  | { kind: "is"; axis: Axis; value: string }                          // "It happened in the Library." (rare — usually only used for a single given fact)
  | { kind: "linked"; axisA: Axis; valueA: string; axisB: Axis; valueB: string }   // "Whoever did it used the letter opener." (culprit <-> method)
  | { kind: "not-linked"; axisA: Axis; valueA: string; axisB: Axis; valueB: string } // "The person in the Study did not use poison."
  | { kind: "conditional"; ifAxis: Axis; ifValue: string; thenAxis: Axis; thenValue: string; thenNegated: boolean }; // "If it was Eleanor, it did not happen in the Garden."
```

Every clue is **true of the actual solution by construction** (the
generator derives clues from the solution, never the other way — §8 Step
3). A clue is also required to resolve to a real axis value (validated the
same way `case-validators.ts` already checks id references).

## Solving

`solve(puzzle: PuzzleCase): PuzzleSolution[]` (see `docs/CONSTRAINT_SOLVER.md`)
enumerates every assignment of `{culprit, method, location, falseAlibi}`
consistent with `clues`, stopping after 2 matches. A published case must
yield exactly 1.

**Fairness is encoded directly in the API**: `solve()` must be callable
with `puzzle.clues` alone — it never takes `puzzle.solution` as input. Any
code path that calls `solve()` with privileged fields in scope is a bug by
construction, not just convention, because the function's parameter type
only exposes `suspects/methods/locations/clues`.

## Relationship to `CaseTruth`

`PuzzleCase` is generated first (Phase 2 generator pipeline, §8 Steps 1–5)
and *then* used to drive the narrative `CaseTruth` build: each `Clue`
becomes one or more `Evidence`/testimony items whose `hiddenInterpretation`
literally is that clue, and `CaseTruth.solution` is filled in from
`PuzzleCase.solution`. This replaces today's `case-generator.ts`, which
builds narrative content first and only gets single-culprit solvability as
a side effect of its fixed skeleton.

Next: `docs/CONSTRAINT_SOLVER.md` for the actual solving algorithm, and
`src/lib/engines/solver.ts` implementing `solve()` against this model.
