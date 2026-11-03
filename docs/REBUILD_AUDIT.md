# Rebuild Audit — 2026-11-03

Phase 1 of the "ALIBI master rebuild" instruction: what exists, what's
retained, and why the current validator cannot guarantee a fair,
uniquely-solvable puzzle. Written before any rebuild code is touched.

## What already exists (read in full for this audit)

- `src/lib/schema/case-truth.ts` — immutable `CaseTruth` Zod schema:
  locations, characters (knowledge/lies/alibi), timeline, evidence,
  contradictions, solution. Good primitive shapes; worth keeping as the
  base vocabulary for the new puzzle model, but it has no notion of a
  *constraint space* (see below).
- `src/lib/engines/case-generator.ts` — procedural generator. Deterministic,
  seeded, throws on self-invalid output. But structurally it always builds
  the *same* skeleton: 1 confrontation event → 1 crime event → body found;
  exactly 2 "implicating evidence" items always pointing at the one culprit;
  exactly 1 red herring; non-culprits get one corroborated alibi each. Only
  names/locations/method/personality vary per seed. This is template
  reskinning, not varied puzzle structure — exactly the weakness §9 of the
  instruction calls out.
- `src/lib/engines/case-validators.ts` — 10 deterministic rules: referential
  integrity (ids resolve), single culprit, knowledge/lies trace to real
  events/evidence, and rule 7 "solvable-implicating-evidence": *at least one
  reliable, non-red-herring evidence item implicates the culprit.*
- `src/lib/engines/prng.ts` — seeded RNG (`createRng`, `.int/.pick/.sample/.next`),
  fine to reuse as-is.
- `src/data/generator-content.ts` — flat word/phrase lists (names, flavor
  text templates). Reusable as raw content-pack material, not as the whole
  content system — no archetypes, no structural variety.
- `src/lib/engines/evaluation-engine.ts` — deterministic accusation scoring
  (id-set + loose substring match, weighted). Keep the "no LLM judgment
  where exact comparison is possible" pattern; the weighting/shape will need
  to grow to match the new accusation fields (location, false-alibi field).
- `src/app/globals.css` + `src/app/*` pages — current UI is a plain
  dark-dashboard skeleton (Case Desk, Crime Scene, Evidence, Suspects,
  Interrogation, Timeline, Evidence Board, Accusation). None of it reflects
  Forensic Modernism × Victorian Gothic yet; being rebuilt from scratch per
  §15–17, not incrementally recolored.
- `docs/06-anti-hallucination.md` — the LLM/NPC-dialogue anti-hallucination
  layering (KnowledgePacket filtering, groundedness check, deepFreeze) is
  solid and orthogonal to the puzzle-solver problem below. **Retained
  as-is** — the master instruction's "no runtime LLM" rule applies to the
  *daily puzzle* path, not necessarily to the existing single-case/LLM
  interrogation mode, which can remain available as a secondary mode.
- `docs/10-roadmap.md` — Phase 1/2 roadmap predates the daily-puzzle pivot;
  superseded by this document and the phase list in the master instruction.

## Why `validateCaseTruth()` is not a solver (the critical gap, §3)

The instruction's framing is exactly right. Walking through what rule 7
actually checks:

```ts
const implicatingEvidence = truth.evidence.filter(
  (e) => e.reliability !== "misleading" && !e.isRedHerring && e.relatedCharacterIds.includes(culpritId)
);
if (implicatingEvidence.length === 0) { /* reject */ }
```

This proves **"the culprit has at least one piece of evidence against
them."** It proves nothing about:

1. **Uniqueness.** No other suspect's evidence set is ever examined. A case
   where two different suspects each have a reliable, non-red-herring
   evidence item pointing at them passes validation today — the player
   could "solve" it by picking either and both would look evidenced. The
   generator happens to never produce this by construction, but the
   *validator* doesn't know that and couldn't catch it if a future
   generator path did.
2. **Discoverability from clues alone.** The validator reads `CaseTruth`
   fields directly (`relatedCharacterIds`, `reliability`, `isRedHerring`) —
   privileged, hidden-truth fields the player never sees. It never
   simulates "given only the evidence descriptions and testimony text a
   player can actually read, can the culprit be deduced, and only the
   culprit?" A case can satisfy rule 7 by citing hidden-truth metadata while
   being unsolvable or ambiguous from the player-visible text.
3. **No propagation/elimination model.** There's no representation of
   suspect × location × method × time as a constraint grid the way Murdle's
   logic puzzles work. The schema has no `PuzzleFact` type ("X was not in Y
   at time Z") that a solver can chain. Today's "deduction" is entirely
   narrative framing, not logic-grid elimination.
4. **No other-culprit elimination check.** Validation never asks "if I
   assume suspect B is the culprit instead, does any constraint forbid it?"
   That `n-1` falsification pass (or a real backtracking enumeration) is
   what proves uniqueness; it doesn't exist in any form here.

Net: the current pipeline guarantees *internal referential consistency*
(no dangling ids, no inconsistent authorship) but makes **no claim** about
unique logical solvability from player-visible information. That's the gap
§3 and §7 of the instruction require closing before any daily puzzle can be
published, and it's a game-engine-level gap, not a tuning issue — it needs
a real constraint representation + solver (§7), independent of today's
`CaseTruth`/validator pair.

## Retain vs. replace, going into Phase 2+

**Retain:** `prng.ts`; the KnowledgePacket/groundedness/deepFreeze
anti-hallucination layer (docs/06) for the existing LLM interrogation mode;
the broad shape of `Location`/`Character`/`Evidence` as content vocabulary;
the "validate or throw, never ship unvalidated" discipline in
`generateCase()`.

**Replace:** the single fixed generator skeleton → multiple archetypes
(§9); rule-7-style spot-checks → a real constraint solver over a formal
puzzle model with enumerable candidates, uniqueness counting, and a
player-visible-only solvability pass (§6–§7); the current dashboard UI →
Forensic Modernism × Victorian Gothic design system (§15–17); free-text
LLM interrogation as the *only* mode → structured topic/evidence-based
interrogation for the daily puzzle mode (§11), while optionally keeping the
existing LLM mode for the non-daily "single case" experience already in
the repo.

Next: Phase 2 formal puzzle model + solver design doc
(`docs/CONSTRAINT_SOLVER.md`, `docs/PUZZLE_MODEL.md`).
