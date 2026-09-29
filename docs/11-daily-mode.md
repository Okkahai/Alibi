# 11 — Daily Mode (Wordle-style)

Turns ColdCase AI into a public, one-case-per-day web game: every player
gets the same case on the same UTC date, with a limited number of moves and
a shareable, spoiler-free result — the same shape as Wordle/Krillion. This
doc covers the design only; `docs/10-roadmap.md` Phase 3 already anticipated
this ("Daily Case: a deterministic seed derived from the date, generated
once server-side and shared by all players that day").

## Case selection

The date *is* the seed. `generateCase({ seed: "2026-09-29", difficulty: "medium" })`
already exists (`src/lib/engines/case-generator.ts`) and is pure/deterministic,
so no new generation logic is needed — only a lookup/cache layer:

- `id = "daily-YYYY-MM-DD"` (UTC).
- On first request for a date, generate the case, validate it (already done
  inside `generateCase`), and persist it to the `cases` table under that id.
- Every later request for the same date reads the cached row — same
  `CaseTruth` for every player, generated once.
- **Hand-curated override**: a `daily_overrides` table (or a checked-in
  `src/data/daily-overrides.ts` map from date to a specific `CaseTruth` id)
  takes priority over the generator for a given date, for quality control or
  featured cases. Checked first; falls through to the generator.
- Difficulty defaults to `medium`; a fixed weekly rotation (e.g. harder on
  weekends) is a easy follow-up, not required for launch.

## Moves and scoring

`GameState` gets a `movesUsed` counter (evidence examined + questions asked
+ accusation attempts, each +1) and daily mode caps it (proposed: **20
moves**, tunable). Running out doesn't block finishing the current
accusation, it just stops new investigation actions.

Result reuses the existing deterministic `evaluateAccusation()`
(`src/lib/engines/evaluation-engine.ts`) — no new scoring logic — converted
to a Wordle-style share string:

```
ColdCase AI #142 (2026-09-29)
🟩🟩⬛🟨🟩  82%
coldcase.ai/daily
```

One square per `ScoreBreakdown` category (culprit, motive, method,
keyEvidence, timeline): 🟩 correct, 🟨 partial (evidence/timeline ratio
between 0 and 1), ⬛ wrong. Copies to clipboard, no spoilers (no suspect
names or facts, matching Wordle's own convention).

## No accounts, local-first

Same pattern already shipped for saves (`docs/07-database-schema.md`):
`localStorage` keyed by date (`daily-2026-09-29`) holds today's `GameState`,
`movesUsed`, and a running streak (`{ current, longest, lastPlayedDate }`).
No login required to play. Optional accounts (to sync streaks across
devices) are a later phase — `game_saves.player_id` is already a free-text
field with no auth behind it, so this doesn't need a schema change today,
only an actual auth provider whenever it's prioritized.

## LLM cost control

Interrogation dialogue for the daily case is **pre-generated once at
case-build time**, not per-player:

- When the daily case is generated/cached (see above), also run a fixed set
  of "expected" player questions per NPC (or accept the mock provider's
  deterministic phrasing) and cache the `NpcReplyResult`s alongside the case.
- At play time, `askNpc()` first checks this cache by
  `(characterId, normalizedQuestion)`; a cache hit skips the LLM call
  entirely. A cache miss (an unanticipated phrasing) can still fall through
  to a live call under `openai-compatible`/`anthropic`, or to the `mock`
  provider's keyword-overlap phrasing — same fallback behavior that already
  exists today (`COLDCASE_LLM_PROVIDER=mock` needs no key at all).
- Net effect: LLM spend is roughly flat per case-day, not per player,
  regardless of daily traffic. `mock` remains a fully free option if real
  LLM cost isn't wanted at all for launch.

## Pages

- **Home** (`/`): today's case entry point, countdown to next UTC
  midnight, current streak, "play today's case" CTA. Replaces the current
  case-picker as the default landing surface; the picker moves to
  `/practice` or similar for non-daily play.
- **Archive** (`/archive`): grid of past dates, each cell showing
  solved/unsolved/not-played, linking to a replay of that date's case
  (same generator, same seed, so past cases stay reproducible without
  storing every one forever if the `cases` row expires — regenerating from
  `id` is deterministic).

Neither page's visual design is decided here — that's the next
conversation, once this structural design is agreed.

## Deployment

Vercel (already Next.js) + Postgres (Drizzle is already wired for saves,
`docs/07`). The only new operational piece is a way to trigger "build
today's case" once per UTC day — a Vercel Cron Job hitting an internal
`/api/daily/build` route is the natural fit (idempotent: if today's row
already exists, no-op), rather than building it lazily on first request,
so the first player of the day isn't stuck waiting on cache-miss generation
+ pre-generation of dialogue.

## Open items for a later pass

- Exact moves budget and whether it varies by difficulty.
- Weekly difficulty rotation.
- Archive replay UX once cases are regenerated on demand vs. kept forever.
- Account system for cross-device streaks.
