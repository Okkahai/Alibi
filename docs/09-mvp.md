# 09 — MVP Definition

## Scope (per the project brief, and what this PR delivers)

- [x] 1 case — "The Voss Manor Case" (`src/data/cases/the-voss-manor-case.ts`)
- [x] 4 suspects (Eleanor Voss, Marcus Reed, Daniel Voss, Priya Nair)
- [x] 5+ locations (6: Study, Main Hallway, Garden Terrace, Kitchen, Guest
      Room, Wine Cellar)
- [x] 20 evidence items (within the 15-25 target range)
- [x] Natural-language interrogation (mock LLM provider, no API key needed)
- [x] Evidence board (pin + connect suspects/evidence/locations/events,
      freeform notes)
- [x] Timeline (locked-until-unlocked reconstruction)
- [x] Accusation (culprit + motive + method + key evidence + timeline)
- [x] Final reveal (full timeline, all lies, red herrings, deterministic score)

## Difficulty: medium

4 suspects places the case at the bottom of the "medium" band (4-6 suspects
per `docs/10-roadmap.md`'s case-generation rules), which matches the MVP
brief's suspect count while exercising the medium-tier validator bound
(`difficulty-suspect-count` in `case-validators.ts`).

## What "done" means for the MVP, concretely

A case is playable end-to-end when:

1. `CaseTruthSchema.safeParse(case)` succeeds.
2. `validateCaseTruth(case).valid` is `true` (referential integrity,
   single culprit, solvability, difficulty bounds — 10 rule groups).
3. Every location has discoverable evidence, every suspect has at least one
   lie with a `brokenBy` evidence path, and the culprit has evidence
   directly implicating them that isn't a red herring.
4. An accusation naming the actual solution scores 100% via
   `evaluateAccusation()`.

All four are exercised by `__tests__/case-validators.test.ts` and
`__tests__/evaluation-engine.test.ts` against the shipped case, and were
additionally smoke-tested against the running dev server (see PR
description) — both `/api/npc/ask` and `/api/accusation` were hit directly
and returned correct, grounded responses.

## Explicitly NOT in MVP scope

- Procedural case generation (`docs/10-roadmap.md`, next major phase).
- A real LLM provider wired in (mock only — the abstraction is ready, see
  `docs/06` for why the mock provider is a legitimate reference
  implementation, not just a placeholder).
- Postgres-backed saves (schema exists, localStorage is the shipped save
  path — `docs/07`).
- Daily Case mode, multiplayer co-op (explicitly "Future" in the brief).
- Authentication / player accounts.
