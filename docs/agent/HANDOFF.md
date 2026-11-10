# Handoff

How to resume work on Alibi with zero prior context, written for the move from Claude Code Cloud project threads to a local multi-agent setup (Claude Code, Codex CLI, git worktrees, independent reviewers, GitHub CI).

## Read in this order

1. `docs/agent/PROJECT_STATE.md` — current snapshot.
2. `docs/agent/TASK_REGISTRY.md` — anything still open.
3. This file's "Migration-readiness audit" below.
4. The product docs under `docs/` as needed for the area you're touching (`docs/agent/ARCHITECTURE.md` has the map).

## How to resume

```bash
git clone https://github.com/Okkahai/Alibi.git
cd Alibi
npm install
npm run dev        # no DATABASE_URL or API key needed
npm test && npm run lint && npx next typegen && npx tsc --noEmit && npm run build
```

If all of that passes on a fresh clone of `main`, the repo is in the state this handoff describes. If it doesn't, something has changed since 2026-11-06 and this document (and `PROJECT_STATE.md`) needs re-verifying before you trust anything else in it.

Required environment variables: **none**, for development or testing. Optional ones (names only — see `.env.example` for what each does and its default):

- `DATABASE_URL` — only needed for cross-device save sync; the app works fully on localStorage without it.
- `COLDCASE_LLM_PROVIDER` — defaults to `mock`.
- `ANTHROPIC_API_KEY`, `COLDCASE_ANTHROPIC_MODEL` — only read if `COLDCASE_LLM_PROVIDER=anthropic`.
- `COLDCASE_OPENAI_BASE_URL`, `COLDCASE_OPENAI_MODEL`, `COLDCASE_OPENAI_API_KEY` — only read if `COLDCASE_LLM_PROVIDER=openai-compatible`.

None of these affect the daily puzzle, which never calls an LLM.

## Migration-readiness audit

### Missing context a new coordinator should know it doesn't have

- **No access to the original cloud project threads' full chat history from this session** — only what's in project memory and the docs committed to the repo. Project memory names three Cloud threads: "ALIBI master rebuild" (`cse_01EkSruiwNByfFX1a6RiVCtA`, marked done), "ColdCase AI design and first case" (`cse_01BKz1mF8EKDjto4MhzrSEo1`, marked done), "Daily case game design" (`cse_012S2H3Gmv4mxpBreWZNWmK8`, marked blocked since 2026-09-29 — this is the thread behind the still-open PR #9). If those threads hold reasoning not reflected in the repo's own docs or commit messages, it is not captured here.
- **No confirmed next-feature direction** past PR #22 — see `TASK_REGISTRY.md` T-004. Don't assume the old "deduction matrix / room content / loss-state variety" backlog is still live; it reads as shipped.
- **This session did not check the GitHub Actions run history** for `freeze-dailies.yml` (see `TASK_REGISTRY.md` T-002) or re-verify that https://alibi-lilac.vercel.app currently serves what `main` contains — both are quick to check and weren't re-confirmed here beyond what the docs/CI config claim.

### Contradictions found

- `docs/DEVELOPMENT_PROGRESS.md`'s "Open" list claims two items are outstanding ("a richer archive", "more varied culprit-elimination wording") that are in fact shipped, in PR #20 and #22. See `TASK_REGISTRY.md` T-003 for the fix.
- No other contradiction between docs, code, and GitHub state was found in this review. The `docs/` set is unusually well-maintained for an agent-driven repo — `docs/REBUILD_AUDIT.md`, `docs/CASE_GENERATION.md`, `docs/PUZZLE_MODEL.md`, and `docs/CONSTRAINT_SOLVER.md` each explicitly state what they supersede, which made this audit faster than it would otherwise have been.

### Work not to restart

- **Do not revive the original `case-generator.ts`/`case-validators.ts` pipeline** or the free-text-interrogation-only daily mode described in PR #9 — both are structurally superseded by the solver-based rebuild (`docs/REBUILD_AUDIT.md`, `docs/PUZZLE_MODEL.md`). If a specific idea from PR #9 (fixed multiple-choice questions, confrontation-by-evidence, per-move cost display) is wanted, re-implement it against current `main` rather than merging or rebasing that branch — see T-001.
- **Do not widen or further tune frequency-tell damping** in the generator — `docs/DECISIONS.md` #8 records that this was measured and found to only shift the tell, not remove it; the current 70%-redraw damping is an accepted, bounded imperfection.
- **Do not add a database-backed daily case cache.** `docs/DAILY_SYSTEM.md` explicitly says this was tried in concept (`docs/11-daily-mode.md`) and dropped — `generateCase()` is pure and deterministic, so no server-side cache is needed.

### Needs explicit approval from Gün before acting

- **Closing or superseding PR #9** (T-001) — this audit recommends closing it as stale, but that is this writer's judgment call, not an instruction received from Gün, and closing a PR is listed as an irreversible-enough action to check first per this project's own working agreement.
- **Deleting old merged branches** (`claude/alibi-archetypes-and-design`, `claude/case-generator`, `claude/case-picker-ui`, `claude/daily-mode-design`, `claude/deep-freeze-case-truth`, `claude/llm-providers`, `claude/postgres-saves`, `claude/project-thread-izpnl4`, `claude/alibi-rebuild-ukalgp`) — harmless clutter, not acted on without being asked.
- Gün's standing instruction to "merge and deploy once checks pass, don't ask" is recorded in project memory and in `AGENTS.md`, but a new session in a different tool (no shared memory with this one) should have that confirmed directly by Gün rather than taken on faith from a document, especially once this moves off the Cloud-project memory system where that instruction currently lives.

### What to verify, not assume, after the move to local/CI

- That whatever CI runs locally/in GitHub Actions post-migration still runs exactly `npx next typegen && npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, in that order — see `docs/agent/VERIFICATION.md`.
- That `freeze-dailies.yml`'s scheduled trigger still has write access to push to `main` from whatever GitHub App/token setup replaces the current one, if the migration changes how this repo's GitHub access is configured.
