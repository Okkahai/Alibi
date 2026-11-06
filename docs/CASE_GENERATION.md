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

### QA fixes (2026-11-04)

- **Clue text now matches the solver exactly.**
  - A "linked" clue is rendered as an *if-and-only-if* that names both values. Before, "Whoever did it used X" asserted only one direction, and in 11 of 120 dailies the text alone left two culprits possible.
  - A "not-linked" clue is rendered as "not both".
  - `NOT_LINKED_TEMPLATES` in `narrative-generator.ts` covers these, and every template must keep this exact meaning.
- **The liar is the killer.** This is now a standing rule enforced in `solver.ts`. The homepage briefing and the matrix intro tell the player. Clue pairs between culprit and false alibi are no longer generated, because under the rule they say nothing.
- **Hints only use exhibits the player has examined.**
  - A hint flags a contradicting mark only when the examined exhibits already prove it.
  - A step whose exhibit is still unexamined stays at level 1, and the hint names no room. This stops hints acting as an oracle or leaking a room.
  - Hints cost 3 points each, with no cap.
- **Year-long check.** `__tests__/daily-window.test.ts` generates 365 dailies from launch and checks that the clue-only trace confirms the true culprit and room.
- **Difficulty**: addressed by rules v2 below.

## Rules v2: minimal clue sets (dailies from 2026-11-06, every practice seed)

Under v1, every case shipped about 20 exhibits. Two of them were forced "anchors" that tied the culprit to the method and the room, and most of the rest were redundant. The answer fell out of the first two exhibits plus a list of alibis.

Rules v2 (`RULES_V2_FROM` in `narrative-generator.ts`, `generateMinimal` in `puzzle-generator.ts`) changes four things:

- **No forced anchors and no `is` clues.** No exhibit states an answer outright.
- **Decoys.** The clue pool holds every true clue, including if/either/not-both clues about wrong values. For example, "if Bram did it, it was the cellar" is true whenever Bram is innocent. Without these, being named in such an exhibit meant being the answer (QA found this in 97–100% of cases).
- **Pruning.** After the set first becomes unique, each clue is tried for removal in seeded order. It is dropped if the answer stays unique, so every exhibit is needed. Typical counts: easy 5–8, medium 7–15, hard 9–21. Many steps now need two or more exhibits together.
- **Shortcut check.** `namesGiveAnswerAway` rejects a set, and the generator redraws it, in two cases. The first is when the if/either exhibits name only the answer, or every option except the answer, on any axis. The second is when the exhibits as a whole mention every option except the answer, which would make it the one suspect with no Chronology entry.
- **Explainable steps.** A set is redrawn if some deduction step needs more than three exhibits at once. The trace tries single exhibits, then pairs, then triples. The exhibit order is shuffled, so the last exhibit is not the one that made the answer unique.
- **Chronology.** Every suspect, the culprit included, has an "earlier in the evening" whereabouts entry, unlocked by any exhibit that names them. The culprit's entry is true: their lie is "the entire evening".

v2 wording: room names take an article inside sentences ("the Kitchen"). The "not" templates for method and room never assume wounds, a struggle or a crime scene the body never left.

Names are also drawn separately for first and last names, so no two people in a case share either one.

Key exhibits are the ones the deduction trace uses to settle the culprit, and the culprit's contradiction says so ("once the exhibits clear everyone else…"). The old "some exhibit names the culprit" validator rule is waived when the trace confirms the culprit.

Known v2 limits:

- Frequency tells remain. The measure is how often the answer is the single most- or least-named option in one slot kind (if, then, then-not, either, not-both), among options not already cleared. Undamped, the worst was 2.9× chance (the culprit was most-named in not-both clues at 7 suspects). `frequencyTells` redraws 70% of the sets where the answer is the single most-named option in "then" or "not-both" slots, which brings the worst down to about 2× and most others to 1.3–1.6×. Damping more slot kinds, damping "least-named", or redrawing more often was measured and only moved the tells around or inverted them. A minimal clue set carries some statistical shape by nature, and no single count picks the answer reliably.
- "Exhibits relied upon" does not penalise ticking extras.

Published dailies (2026-11-01 to 11-05) keep v1, and `daily-frozen.test.ts` enforces that.

## Titles (dailies from 2026-11-07, every practice file)

Until 2026-11-06 a title was "The {victim surname} Case". With only 20 surnames, titles repeated within days. From `TITLES_FROM` a title is a phrasing ("Death at …", "The … Affair", and four more) applied to an estate name from `ESTATE_NAMES`.

- **Dailies** walk a fixed shuffle of the 24 estates by day number, so no title repeats for 24 days.
- **Practice files** draw at random from their own `:title` RNG.

Estate names never name a room, a method or a person, so a title hints at nothing. Published titles are unchanged.
