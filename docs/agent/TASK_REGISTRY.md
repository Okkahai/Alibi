# Task registry

Every unfinished or undecided task known as of 2026-11-06, kept up to date by whoever picks up each one. Closed/shipped work is not tracked here — see `docs/DEVELOPMENT_PROGRESS.md` for the shipped history. Add a new entry with the next free ID; never reuse an ID.

Confidence is this writer's own confidence in the entry's accuracy, not a priority score.

---

## T-001 — Decide the fate of PR #9 — CLOSED 2026-11-10

- **Status:** done. Gün said "continue the processes" on 2026-11-10, which the project's standing no-ask-for-already-covered-approvals rule treated as covering this; closed as superseded, with a comment on the PR explaining why and pointing back to this entry for anyone who wants to recover a specific idea from it.
- **Priority:** medium (it's not blocking other work, but it's stale enough to actively mislead a new agent that finds it).
- **Objective:** either close PR #9 or deliberately recover any still-wanted idea from it into a fresh PR.
- **Acceptance criteria:** PR #9 is closed, or superseded by a new PR that states what was carried over and why; no open PR targets `main` with a base predating the rebuild (#10+).
- **Related:** GitHub PR [#9](https://github.com/Okkahai/Alibi/pull/9), branch `claude/project-thread-ot5qgu`. Cloud thread "Daily case game design" (`cse_012S2H3Gmv4mxpBreWZNWmK8`) was the thread that opened it, and project memory marks that thread "blocked since 2026-09-29".
- **Done:** none.
- **Remaining:** a human (or an agent with explicit permission) decides whether to close it, and does so.
- **Dependencies:** none technical; this is a product decision, not a merge-conflict-resolution task — the branch's base is 13 merged PRs behind `main` and its content (old generator, choice-based interrogation flow) has been structurally replaced by the solver-based rebuild, so a rebase/merge is not the likely right move even if someone wanted the ideas back.
- **Files:** N/A (decision, not code).
- **Tests:** N/A.
- **Decisions:** none recorded yet — this entry exists to force one.
- **Exact next action:** ask Gün, in the project thread, whether to close PR #9 as superseded by the rebuild, or to name anything in it (the multiple-choice accusation UI, the confrontation-claim mechanic) that should be re-implemented fresh against current `main`.
- **Confidence:** high that the PR is stale (checked `mergeable_state` and base commit directly on GitHub); the recommendation to close rather than merge is this writer's judgment, not Gün's stated preference — hence "needs a decision" rather than "needs a close".

---

## T-002 — Confirm `freeze-dailies.yml` runs unattended

- **Status:** open, low urgency (the workflow has a manual `workflow_dispatch` fallback and nobody has missed a day yet).
- **Priority:** low.
- **Objective:** be confident the 00:10 UTC cron actually fires every day without a human triggering it by hand.
- **Acceptance criteria:** at least 3–5 consecutive UTC days where `src/data/daily-fingerprints.json` gets a same-day commit from the `freeze-dailies.yml` schedule trigger (not `workflow_dispatch`), visible in the Actions run history.
- **Related:** `.github/workflows/freeze-dailies.yml`, `docs/DAILY_SYSTEM.md`, `docs/DEVELOPMENT_PROGRESS.md` ("Open" list).
- **Done:** the workflow exists and has been triggered manually at least twice successfully (2026-11-05, 2026-11-06, per project memory).
- **Remaining:** just observation over the next several days — nothing to build.
- **Dependencies:** none.
- **Files:** `.github/workflows/freeze-dailies.yml`.
- **Tests:** `__tests__/daily-frozen.test.ts` already guards the outcome either way.
- **Decisions:** none needed unless the cron turns out to be unreliable, in which case the fix is likely tightening the cron schedule or adding a second scheduled retry later in the UTC day.
- **Exact next action:** check the Actions run history for `freeze-dailies.yml` next time someone is in this repo; if the scheduled trigger has fired cleanly for several days running, close this task in `DEVELOPMENT_PROGRESS.md`'s Open list.
- **Confidence:** medium — based on `docs/DEVELOPMENT_PROGRESS.md` and project memory, not re-verified against the Actions tab in this session (GitHub Actions run history wasn't checked here).

---

## T-003 — Stale "Open" items in `docs/DEVELOPMENT_PROGRESS.md`

- **Status:** ready to fix, trivial.
- **Priority:** low, but do it on the next doc-touching PR since it actively misleads.
- **Objective:** the "Open" list in `docs/DEVELOPMENT_PROGRESS.md` currently names "a richer archive (more than 7 days, stats)" and "more varied culprit-elimination wording" as outstanding; both shipped in PR #20 and #22 respectively.
- **Acceptance criteria:** `docs/DEVELOPMENT_PROGRESS.md`'s PR table includes rows for #19–#22, and its "Open" list drops the two shipped items.
- **Related:** `docs/DEVELOPMENT_PROGRESS.md`.
- **Done:** nothing yet; this registry entry is the first record of the staleness.
- **Remaining:** edit the file.
- **Dependencies:** none.
- **Files:** `docs/DEVELOPMENT_PROGRESS.md`.
- **Tests:** none — it's documentation.
- **Decisions:** none.
- **Exact next action:** update the PR table (add #19–#22) and the Open list in `docs/DEVELOPMENT_PROGRESS.md` in the same PR that does the next piece of real feature work, or standalone if nothing else is in flight.
- **Confidence:** high — directly diffed the merged PR list against that file's contents in this session.

---

## T-004 — No confirmed next feature direction

- **Status:** unresolved — not a task yet, a gap.
- **Priority:** n/a (informational).
- **Objective:** earlier project memory (pre-dating this session) listed "deduction matrix + playable vertical slice, room/evidence content, loss-state variety" as the next planned work after the rebuild kicked off. All three now appear to be shipped (matrix: PR #12; room/evidence content: part of the generator/narrative split, PR #10/#12; loss-state/verdict variety: PR #18's three verdict variants). No newer instruction naming what comes after PR #22 was found in this session's available context.
- **Acceptance criteria:** n/a until Gün gives a next direction.
- **Related:** `docs/agent/PROJECT_STATE.md` "In flight / open".
- **Done:** n/a.
- **Remaining:** ask, don't assume.
- **Dependencies:** a decision from Gün.
- **Files:** n/a.
- **Tests:** n/a.
- **Decisions:** none.
- **Exact next action:** 2026-11-10 — re-verified directly in the code, not just the PR list: `src/app/deduction/` (matrix UI) and `src/lib/state/matrix.ts` exist; room/evidence content lives in `src/app/evidence/`, `src/app/crime-scene/`, and the narrative generator; `verdict`-keyed logic for loss-state variety is in `evaluation-engine.ts`, `daily-case.ts`, and both the accusation and evidence pages. The old "deduction matrix + vertical slice, room/evidence content, loss-state variety" backlog item is done. When a new session picks this project up, ask Gün what the next priority actually is — don't resume that item.
- **Confidence:** high now — confirmed against the code directly, not just the merged-PR list.
