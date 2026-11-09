<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Alibi — notes for coding agents

This section is provider-neutral: it applies the same whether the agent at the keyboard is Claude Code, Codex CLI, or a human.

## Start here

Read `docs/agent/PROJECT_STATE.md` first — the current snapshot of what's shipped, what's in flight, and what's next. From there:

- `docs/agent/TASK_REGISTRY.md` — unfinished tasks, with status, acceptance criteria, and the next concrete step for each.
- `docs/agent/HANDOFF.md` — how to pick this project back up with no prior context, plus a migration-readiness audit noting gaps and stale info.
- `docs/agent/ARCHITECTURE.md`, `docs/agent/DECISIONS.md` — short indexes into the fuller product docs under `docs/`.
- `docs/agent/VERIFICATION.md` — what to check before calling a change finished.

The product spec, game rules, puzzle model, solver, design system, and testing docs live under `docs/` (mapped in `docs/agent/ARCHITECTURE.md`). This repo already has that writing done; read the relevant doc for the area being touched instead of re-deriving it from the code.

## Project conventions observed so far

- The project owner (Gün) has repeatedly asked to move through planned work step by step without pausing to check in, for anything short of a destructive production action — merging and deploying once CI is green and QA has passed is the pattern seen across PRs #10–#22. A new session should confirm this is still current with Gün before relying on it for anything irreversible.
- Every feature has gone through review by an agent other than its author before merge (`docs/TESTING.md`, "QA gates"). Generator changes additionally get a seed sweep (thousands of seeds across difficulties) before merge.
- A daily puzzle is only published if it has exactly one logically reachable answer from its clues alone — enforced by `src/lib/engines/solver.ts` and `__tests__/solver.test.ts` / `daily-window.test.ts`. Changes touching the generator or solver should keep those passing.
- Published days are frozen: `src/data/daily-fingerprints.json` plus `__tests__/daily-frozen.test.ts` guard against a generator change silently altering a case players already saw. The fix for a failing frozen test is to date-gate the change (`docs/DAILY_SYSTEM.md`, "Changing the generator"), not to edit the fingerprint file.
- The daily puzzle path makes no runtime LLM or API calls — it is deterministic from the UTC date alone and free to serve. The LLM interrogation providers (mock/openai-compatible/anthropic) remain a separate, optional mode for the handcrafted/non-daily case (`docs/06-anti-hallucination.md`).
- Changes have stayed small and reused existing engines/content rather than adding parallel ones; a known shortcut gets a one-line `shortcut:` comment rather than being left undocumented.
- Before calling a task finished, this repo's practice has been to run what `docs/agent/VERIFICATION.md` lists for that kind of change, and to update `docs/agent/TASK_REGISTRY.md` and `docs/DEVELOPMENT_PROGRESS.md`.

## Commands

```bash
npm install
npm run dev                              # local dev, no DB/API key required (mock LLM provider)
npx next typegen && npx tsc --noEmit     # route types, then typecheck
npm run lint
npm test                                 # vitest; generator sweeps can take up to 60s/test
npm run build
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, test, and build on every PR and every push to `main`. `.github/workflows/freeze-dailies.yml` runs daily at 00:10 UTC to fingerprint the newly-published day — see `docs/DAILY_SYSTEM.md`.

## Environment variables

See `.env.example` for the full, current list with comments. None are required to run or test the app — every provider/feature degrades to a working default (mock LLM, localStorage-only saves) when its variable is unset. Never commit real values.
