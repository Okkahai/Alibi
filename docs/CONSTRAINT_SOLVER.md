# Constraint Solver — Phase 2

Implements §7's non-negotiable solver requirement for the `PuzzleCase`
model in `docs/PUZZLE_MODEL.md`. Lives in `src/lib/engines/solver.ts`.

## Approach: backtracking + constraint propagation, no dependency

4 axes (`culprit`, `method`, `location`, `falseAlibi`) × up to 8 values
each is a search space of at most 8⁴ = 4096 full assignments — small
enough that a plain backtracking search with per-step constraint
filtering is both correct and fast (sub-millisecond), with no justification
for pulling in a general-purpose CSP/SAT library (ponytail rule 4: use a
dependency only when a few lines can't do it — a few hundred lines of
backtracking over a 4096-node space is the "few lines" case already).

## Algorithm

1. Start with each axis's domain = full candidate list (`suspects` for
   `culprit`/`falseAlibi`, `methods` for `method`, `locations` for
   `location`).
2. **Propagate unary clues first** (`is`, `not`): shrink the relevant
   axis's domain directly. Cheap, done once.
3. **Backtrack over the remaining axes** in a fixed order
   (`culprit → method → location → falseAlibi`), trying each remaining
   domain value per axis. At each partial assignment, check every clue
   whose referenced axes are all assigned so far (`linked`, `not-linked`,
   `conditional`) — reject the branch immediately if any checked clue is
   violated, rather than completing a full assignment and discarding it.
   This is the "propagation" half: failing fast on the first violated
   constraint is what keeps the search well under the full 4096-node
   enumeration in practice.
4. Collect full assignments that satisfy all clues. **Stop as soon as a
   second solution is found** — §7.5 only requires counting up to 2 when
   the only question is uniqueness.
5. Return every solution found (0, 1, or 2 — "2" meaning "not unique,
   reject").

## Interface

```ts
export interface SolveResult {
  solutions: PuzzleSolution[];     // 0, 1, or 2 (capped)
  isUnique: boolean;               // solutions.length === 1
}

export function solve(puzzle: Pick<PuzzleCase, "suspects" | "methods" | "locations" | "clues">): SolveResult;
```

Taking a `Pick<...>` (never the full `PuzzleCase`) is the mechanism that
makes "the solver only sees player-visible clues" a type-level guarantee,
not a convention someone can forget — `puzzle.solution` doesn't type-check
as an argument.

## Generation-time use

`generatePuzzleCase()` (next: wiring into `case-generator.ts`) must call
`solve()` on every candidate puzzle's `clues` and reject (regenerate with a
different clue subset, or add a clue) unless `isUnique` is true **and**
the single returned solution equals the generator's own intended
`PuzzleSolution`. The second check matters: a solver that returns exactly
one solution that isn't the one the generator meant is still a bug — it
would publish a case whose "correct" answer (for scoring) doesn't match
what the clues actually prove.

## Difficulty / explain-ability

Because step 3 fails fast per-clue, the order and count of clue checks
during the one successful search path is itself a cheap difficulty/trace
signal: `solve()` additionally returns `stepsTried` (count of
partial-assignment attempts before success) for `docs/CASE_GENERATION.md`'s
difficulty estimation and for building a human-readable deduction trace —
without needing a second, separate "explain" algorithm.

## Testing

`__tests__/solver.test.ts` (next) must cover: a puzzle with 0 valid
solutions (over-constrained — rejected), exactly 1 (accepted), 2+ (rejected
as ambiguous), and a regression case asserting `solve()`'s type signature
cannot accept a `solution` field (compile-time check via `// @ts-expect-error`).
