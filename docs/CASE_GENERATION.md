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

## Answer fields stay hidden in presentation (2026-11-04)

The crime room is something the player must deduce, so nothing rendered before the reveal may single it out. Before this fix, five things gave it away:

- the case title;
- the victim note;
- a separate name pool for crime rooms;
- exhibits piling up in the crime room;
- innocents' whereabouts covering every other room.

The current rules:

- **Room names.** Rooms draw names from one pool (`LOCATION_NAMES`) and descriptions from one neutral pool.
- **Title.** The title uses the victim's surname.
- **Victim note.** It says the body was moved.
- **Exhibit placement.** An exhibit sits in the room its clue names. If the clue names no room, the exhibit goes in a seeded random room.
- **Innocent whereabouts.** These are "earlier in the evening", and any room is allowed, the crime room included.

`__tests__/crime-room-leak.test.ts` checks this over 300 seeds.

Daily cases from 2026-11-01 to 2026-11-04 render differently after this change. Their puzzles (clues and solution) are the same, because only the narrative layer changed. No snapshots had been published yet.

## Deduction trace, hints and the reveal (2026-11-04)

`deduction-trace.ts` replays a case using only its clues. It reads the game's stated rule ("the one lying about their alibi is the killer") as falseAlibi = culprit. At each step it takes the smallest group of clues that rules out a value, trying single clues first, then pairs, then all clues together. When an axis is down to one value, the trace confirms it.

Across 1,000 generated puzzles, every elimination needed only one clue (about 10 eliminations per case). The trace is stored on `CaseTruth.deduction` as exhibit ids. A handcrafted case leaves it empty, and that disables hints for that case.

`src/lib/state/hints.ts` walks the trace against the player's own grid:

- **Contradicting marks first.** A mark that contradicts the exhibits is flagged before anything else.
- **Next step.** Otherwise the hint covers the first step the grid does not yet record.
- **Escalation.** Each further request on the same step escalates: direction, then deduction, then the exact mark.
- **Unexamined exhibits.** If the exhibit has not been examined yet, the hint points to its room instead of quoting it.

Each hint shown costs 3 points on the finding, up to 15. The verdict itself is never changed.

The reveal lists the full trace under "How the exhibits decide it". Daily cases also get a share block that names no person, method or room.
