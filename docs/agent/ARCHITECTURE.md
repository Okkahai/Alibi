# Architecture — index

This is a map into the authoritative architecture docs under `docs/`, not a parallel description of them — update those files, not this one, when the architecture changes. This file exists so an agent can find the right doc in one hop instead of reading all of `docs/`.

## Current system (daily puzzle)

Read `docs/ARCHITECTURE.md` for the full pipeline diagram. Short version: a UTC date seeds `puzzle-generator.ts`, which grows a true-clue pool to uniqueness and has `solver.ts` prove exactly one answer by backtracking search over a 4-axis CSP (culprit × method × location × falseAlibi — see `docs/PUZZLE_MODEL.md`, `docs/CONSTRAINT_SOLVER.md`). `narrative-generator.ts` then renders that solved abstract puzzle into names, rooms, exhibit text, and the chronology (`docs/CASE_GENERATION.md`), `deduction-trace.ts` computes the clue-only elimination order hints use, and `case-validators.ts` does structural checks before the result is deep-frozen into `CaseTruth` and sent to the browser. No model runs at play time for a daily.

| Doc | Covers |
|---|---|
| `docs/ARCHITECTURE.md` | The pipeline above, module table |
| `docs/PUZZLE_MODEL.md` | The formal `PuzzleCase` CSP model the solver reasons over |
| `docs/CONSTRAINT_SOLVER.md` | The backtracking solver algorithm |
| `docs/CASE_GENERATION.md` | Mapping a solved abstract puzzle to narrative `CaseTruth` content |
| `docs/DAILY_SYSTEM.md` | Date seeding, fingerprint-freezing, the daily/practice rules-version split |
| `docs/GAME_RULES.md` | What the player is told, exhibit wording ↔ logical meaning |
| `docs/GAME_DESIGN.md` | The loop, fairness goals, difficulty bands |
| `docs/DESIGN_SYSTEM.md`, `docs/DESIGN_RESEARCH.md` | Visual language (Forensic Modernism × Victorian Gothic) and its sourcing |
| `docs/TESTING.md` | What each test file guards, CI commands, QA-gate process |

## Earlier system (handcrafted / LLM-interrogation mode), still present

This mode is not the daily puzzle and is unaffected by the solver rebuild. It's what `docs/01-*.md`–`docs/06-anti-hallucination.md` describe: an immutable, schema-validated `CaseTruth` (`src/lib/schema/case-truth.ts`), NPC knowledge filtering, and the anti-hallucination contract for free-text interrogation against a pluggable LLM provider (`mock` / `openai-compatible` / `anthropic`, `src/lib/llm/`).

| Doc | Covers |
|---|---|
| `docs/01-architecture.md`–`docs/05-interrogation-architecture.md` | Original design: case truth schema, NPC knowledge, evidence, interrogation |
| `docs/06-anti-hallucination.md` | The contract that still governs this mode today — KnowledgePacket filtering, groundedness check, deep-freeze |
| `docs/07-database-schema.md` | Postgres schema for saves (optional; localStorage is the default) |

## Superseded — kept for history, not a guide to current behavior

`docs/08-ui-ux.md`, `docs/09-mvp.md`, `docs/10-roadmap.md`, `docs/11-daily-mode.md` predate the visual redesign (PR #11) and the solver-based daily rebuild respectively; `docs/REBUILD_AUDIT.md` is the write-up of exactly what in the pre-rebuild code they describe was replaced, and why.
