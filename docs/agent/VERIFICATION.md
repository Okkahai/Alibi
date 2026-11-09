# Verification

What to run before calling a change finished, by kind of change. This is a checklist, not a new process — it names what `docs/TESTING.md` and CI already do, plus what "QA gate" has meant in practice on this project.

## Every change

```bash
npx next typegen && npx tsc --noEmit
npm run lint
npm test
npm run build
```

These are CI's exact steps (`.github/workflows/ci.yml`); if they pass locally they'll pass in CI. Generator-touching tests can take up to 60s each (`vitest.config.ts`'s `testTimeout`) — that's expected, not a hang.

## Changes to the generator or solver (`src/lib/engines/puzzle-generator.ts`, `solver.ts`, `narrative-generator.ts`, `case-validators.ts`)

In addition to the above:

- Run a seed sweep across difficulties (thousands of seeds at 3, 5, and 7 suspects — `docs/TESTING.md` "QA gates") and confirm every generated case still solves to exactly one answer.
- Confirm `__tests__/daily-window.test.ts` (365 days generate with a complete clue-only trace) still passes.
- Confirm `__tests__/daily-frozen.test.ts` still passes **without editing `src/data/daily-fingerprints.json`**. If it fails, the change altered a published day's output — date-gate the change instead (`docs/DAILY_SYSTEM.md`, "Changing the generator"); don't make the test pass by changing the fingerprint.
- Check for crime-room/answer leaks in presentation (`__tests__/crime-room-leak.test.ts` and `docs/REBUILD_AUDIT.md`'s "discoverability from clues alone" concern) — a case must not be solvable from layout, naming, or ordering alone.
- Get independent review from an agent other than the one who wrote the change, before merging.

## Changes to exhibit/clue wording or templates

- Re-verify the wording still means exactly its stated logical form (`docs/GAME_RULES.md`'s wording table) — "linked" is iff, "not-linked" is not-both, never a looser word like "suggests".
- Re-run the frequency-tell check from `docs/DECISIONS.md` #8 if the change could shift how often the answer is the most-named option.

## Changes to the UI/design system

- Follow `docs/DESIGN_SYSTEM.md`'s composition rules (one ink band per screen, record vs. engraving voice) rather than introducing a new visual pattern.
- Check both the mobile and desktop layout; prior PRs have used Playwright screenshots at both sizes for this.

## Changes to `docs/` itself

- Make sure you're updating the authoritative doc, not creating a duplicate — see `docs/agent/ARCHITECTURE.md` and `docs/agent/DECISIONS.md` for which doc owns which topic before adding a new file.
- If the change reflects newly shipped work, also update `docs/DEVELOPMENT_PROGRESS.md`'s PR table and "Open" list, and close the matching entry in `docs/agent/TASK_REGISTRY.md`.

## Before closing out any task

- Update `docs/agent/TASK_REGISTRY.md` (close the entry or update its status) and `docs/DEVELOPMENT_PROGRESS.md`.
- If the task touched something `docs/agent/PROJECT_STATE.md` describes, update that snapshot too — it's meant to stay current, not accumulate history.
