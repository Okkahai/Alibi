# Project state — Alibi

Snapshot as of 2026-11-06. This file is meant to be re-read and re-written each time a new agent/session picks the project up — keep it short and current, and push detail down into `TASK_REGISTRY.md` or the `docs/` product docs instead of growing this file.

Every fact below is tagged **[verified]** (checked against the repo or GitHub during this writing), **[decision]** (a recorded past choice, from docs or memory), or **[unresolved]** (open question, no authoritative answer found).

## What this is

Alibi (formerly "ColdCase AI") is a daily deduction puzzle game, Wordle-style: one shared case per day, generated deterministically from the UTC date, solvable by logic alone from in-game clues, no account needed. **[decision]** An earlier, broader concept (free-text LLM interrogation of NPCs with a hidden immutable "Case Truth", described in `docs/01-*.md`–`docs/10-*.md`) was narrowed by the 2026-11-03 "ALIBI master rebuild" instruction into this Murdle-style deduction game; see "What was superseded" below.

- **Live:** https://alibi-lilac.vercel.app — **[verified]** Vercel auto-deploys `main` (`docs/TESTING.md`, CI config); not independently re-checked by loading the URL in this session.
- **Repo:** `Okkahai/Alibi`, default branch `main`. **[verified]**
- **Stack:** Next.js 16 (App Router) + TypeScript + Zod, Tailwind v4, Postgres via Drizzle (optional), Vitest. **[verified]** from `package.json`.

## What's shipped

**[verified]** against `git log` / merged PR list on GitHub (2026-11-06):

- PRs #1–#9: original prototype (Voss Manor handcrafted case, Postgres saves, procedural generator v1, frozen `CaseTruth`, pluggable LLM providers, case picker, first daily-mode attempt). **PR #9 is the exception — see "Needs a decision" below; it never merged.**
- PR #10: rebuild phase 1–2 — repo audit (`docs/REBUILD_AUDIT.md`) + formal `PuzzleCase` model and real constraint solver (`docs/PUZZLE_MODEL.md`, `docs/CONSTRAINT_SOLVER.md`).
- PR #11: editorial visual redesign (Forensic Modernism × Victorian Gothic), clue phrasing variety.
- PR #12–#18: deduction matrix UI, crime-room leak fix, hints/scoring/share/reveal, interactive tutorial, frozen-daily fingerprinting + CI, "rules v2" minimal clue sets with decoys, frequency-tell damping, verdict variants.
- PR #19: the current `docs/` set (`GAME_RULES.md`, `GAME_DESIGN.md`, `ARCHITECTURE.md`, `TESTING.md`, `DECISIONS.md`, `DEVELOPMENT_PROGRESS.md`, plus the Phase 2 design docs).
- PR #20: full paged archive of past dailies with per-device stats; mobile hint panel moved above the grid.
- PR #21: varied daily case titles (effective for dailies from 2026-11-07; published days keep their original title).
- PR #22: varied suspect-clearing wording (effective from 2026-11-07).

Net effect: the daily game is a solver-backed logic puzzle today, not an LLM roleplay game. The solver, generator, and narrative layers are split on purpose (`docs/CASE_GENERATION.md`) so a content/wording bug can't make a published case ambiguous.

## What was superseded (don't resurrect without checking first)

- **Free-text LLM interrogation as the primary interaction.** Still present in the code (`src/lib/llm/*`, `src/app/api/npc/ask/`) and documented (`docs/01-*.md` through `docs/06-anti-hallucination.md`), but it is now a secondary mode for the handcrafted/non-daily case, not the daily puzzle. **[decision]**
- **The original `case-generator.ts`/`case-validators.ts` pipeline** (template-reskinning, spot-check validation). Replaced by `puzzle-generator.ts` + `solver.ts` + `narrative-generator.ts`, per `docs/REBUILD_AUDIT.md`. **[decision]**
- **`docs/10-roadmap.md` and `docs/11-daily-mode.md`** predate the rebuild and the solver-based daily system; `docs/DAILY_SYSTEM.md` and `docs/GAME_DESIGN.md` are the current versions of that plan. **[verified]** (stated explicitly in both newer docs).

## In flight / open

**[verified]** from `docs/DEVELOPMENT_PROGRESS.md` "Open" section plus this session's own GitHub check:

- Confirm the `freeze-dailies.yml` cron fires on its own without manual `workflow_dispatch` — it ran late or had to be triggered by hand at least twice in the first week (2026-11-05, 2026-11-06).
- Culprit-elimination wording variety and a richer archive were both still "open" in that doc, but were actually shipped by PR #21/#22 and #20 — the doc is stale on those two lines. **[unresolved → now resolved by this handoff; update `docs/DEVELOPMENT_PROGRESS.md`'s "Open" list to drop them.]**
- The client self-reports its hint count for scoring — accepted as fine for a no-account game, not treated as a bug.
- PR #9 (`claude/project-thread-ot5qgu`, opened 2026-09-29) is still open on GitHub and conflicts with `main` (`mergeable_state: dirty`). Its base commit predates the entire rebuild (#10–#22); its content (old `case-generator.ts`, choice-based interrogation) has been structurally replaced. **Needs a decision — see `HANDOFF.md`.** **[verified]**
- Old now-merged branches (`claude/alibi-archetypes-and-design`, `claude/case-generator`, `claude/case-picker-ui`, `claude/daily-mode-design`, `claude/deep-freeze-case-truth`, `claude/llm-providers`, `claude/postgres-saves`, `claude/project-thread-izpnl4`, `claude/alibi-rebuild-ukalgp`) remain undeleted on the remote. Harmless, just clutter. **[verified]**
- No other unmerged feature work was found in this session beyond PR #9. The "deduction matrix + vertical slice, room/evidence content, loss-state variety" item from earlier project memory reads as already done (matrix: PR #12; room/evidence content exists in the generator/narrative layer; loss-state/verdict variety: PR #18). **[unresolved]** — no explicit confirmation from Gün that this backlog is considered closed; flagged in `HANDOFF.md`.

## Where to look next

- `TASK_REGISTRY.md` for anything still actionable.
- `HANDOFF.md` for the full migration-readiness audit (gaps, contradictions, required approvals).
- `docs/DECISIONS.md` (product) and `docs/agent/DECISIONS.md` (index) for *why* things are built the way they are.
