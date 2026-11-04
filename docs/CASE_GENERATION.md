# Case Generation Pipeline — Phase 2c plan

Status: `generatePuzzleCase()` (logic layer, proven unique by `solve()`) is
done and tested. This document is the plan for §8 Steps 6–9: turning a
solved `PuzzleCase` into the narrative `CaseTruth` the app actually renders
(evidence descriptions, suspect profiles, timeline text), without losing
the uniqueness proof already established on the logic layer.

## Why this is its own phase, not folded into the last commit

The old `case-generator.ts` builds narrative content and logical
solvability in one pass, which is exactly what let the uniqueness gap
(`docs/REBUILD_AUDIT.md`) go unnoticed. Keeping them as two passes —
`generatePuzzleCase()` already merged, this phase strictly *renders* its
output — means the uniqueness guarantee can never regress because of a
narrative-content change; a narrative bug can make a clue's prose
misleading, but it can't make the published case ambiguous, because the
solver never looks at prose.

This phase also touches several existing call sites (`src/app/*` pages,
`src/lib/state`, the NPC dialogue `KnowledgePacket` builder) that all
assume today's `CaseTruth` shape and content conventions, which is enough
surface area that it deserves its own reviewed, tested increment per §24
rather than being rushed into the solver commit.

## Mapping, one clue at a time

For a solved `PuzzleCase { suspects, methods, locations, clues, solution }`:

1. **Identity mapping**: assign a narrative name to every abstract id —
   `suspect_i → "First Last"` (reuse `FIRST_NAMES`/`LAST_NAMES` from
   `src/data/generator-content.ts`), `method_i →` a method phrase pool
   entry, `location_i →` a location name pool entry, with the solution's
   `location` drawn from `CRIME_LOCATION_NAMES` and the rest from
   `OTHER_LOCATION_NAMES`. Driven by a `createRng(seed + ":narrative")`
   instance, separate from the puzzle-generation RNG so narrative content
   changes never perturb which clues were chosen.
2. **One `Evidence` item per `Clue`**: `hiddenInterpretation` is the clue
   itself (so the evidence-to-clue mapping is traceable and testable);
   `description` is template text rendered from the clue's `kind` and
   mapped names (e.g. a `not-linked` clue renders as a witness statement
   or forensic note ruling out a pairing). This directly satisfies
   `case-validators.ts` rule 4 ("every evidence item traces to a real
   event") once each clue also gets a backing `TimelineEvent`.
3. **Characters**: `solution.culprit` gets `actualLocation` = the crime
   location, a lie whose `conceals` is the crime event, and `brokenBy`
   pointing at the evidence items rendering the clues that pin them down.
   Every other suspect gets a corroborated alibi at a non-crime location,
   same as today's generator for the non-culprit branch — that part of
   the old generator's content logic is being reused, only the *selection*
   of who's guilty and why no one else could be stops coming from a fixed
   skeleton and starts coming from the already-proven-unique `PuzzleCase`.
4. **Re-validate twice**: `validateCaseTruth()` (existing referential
   checks) *and* re-run `solve()` against the rendered evidence's
   `hiddenInterpretation` clues to confirm the narrative pass didn't drop
   or duplicate a clue needed for uniqueness. Both must pass before a case
   is considered generated, matching `generatePuzzleCase()`'s
   throw-rather-than-ship discipline.

## Not yet decided (flagged rather than guessed)

- Whether `src/app` keeps consuming `CaseTruth` directly (today's shape)
  or whether the daily-mode UI should read a thinner `DailyPuzzleView`
  derived from `CaseTruth` + `PuzzleCase` together, once the deduction
  matrix (§10C) needs the raw axis/clue data `CaseTruth` doesn't carry.
  Likely the latter — tracked for the UI-architecture pass, not resolved
  here.
- Case archetypes (§9): this mapping produces one narrative "flavor" per
  clue kind. Multiple archetypes (impossible alibi, forged document,
  mistaken identification, …) are additional *rendering* choices for the
  same clue kinds, not new solver concepts — tracked as a follow-up to
  this phase, before the UI/visual-identity work.
