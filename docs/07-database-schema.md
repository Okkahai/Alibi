# 07 — Database Schema

ORM: Drizzle, targeting PostgreSQL. Schema source of truth:
`src/lib/db/schema.ts`. Connection: `src/lib/db/client.ts`, lazily
constructed so importing it never requires `DATABASE_URL` to be set (tests
and the mock-provider game loop don't touch the database at all).

## Why JSON columns for the game data, not fully normalized tables

```sql
cases        (id, seed, difficulty, truth jsonb, created_at)
game_saves   (id, case_id, player_id, state jsonb, created_at, updated_at)
```

`CaseTruth` and `GameState` are owned by their Zod schemas
(`src/lib/schema/*.ts`), not by SQL DDL. Storing them as validated JSON
blobs means:

- The schema can evolve (new fields on `Character`, a new evidence type)
  without a migration for every change — only structural changes to *how
  cases/saves are queried* (e.g. "list all cases by difficulty") need a
  migration, and `difficulty`/`seed` are already broken out as indexable
  columns for exactly that reason.
- There's exactly one place (`case-truth.ts` / `game-state.ts`) that defines
  validity, and it's enforced with `.parse()` before every write — never by
  trusting the database's column types.

This is a deliberate MVP tradeoff, not a permanent one. If query patterns
emerge that need indexing into specific fields (e.g. "find all saves with
status=accused"), those fields get promoted to real columns alongside the
jsonb blob, the same way `difficulty` and `seed` already are.

## Tables

### `cases`

One row per generated/handcrafted `CaseTruth`. `id` matches
`CaseTruth.id` (e.g. `"the-voss-manor-case"`) so `src/data/cases/*.ts` and
the database can reference the same case by the same key during the
transition from handcrafted, code-defined cases (MVP) to database-stored,
procedurally generated ones (post-MVP, see `docs/10-roadmap.md`).

### `game_saves`

One row per (case, player) save slot. `player_id` is a free-text field in
the MVP schema — there's no auth system yet (see roadmap). `state` is a
validated `GameState` blob. Multiple saves per case/player aren't
deduplicated at the schema level; that's an application-layer concern once
there's a real save-slot UI.

## Current persistence reality

The MVP still runs **without** requiring Postgres: the client-side
`GameProvider` (`src/lib/state/game-context.tsx`) persists `GameState` to
`localStorage`, keyed by case id, with zero setup. On top of that,
`GameProvider` now also best-effort syncs to `/api/saves` (`src/app/api/saves/route.ts`),
which reads/writes `game_saves` via Drizzle:

- On mount, it fetches the server save (keyed by a per-browser `playerId`
  stored in `localStorage`, not an account system) and the local save, and
  keeps whichever has the newer `updatedAt`.
- On every state change, it PUTs the new state to the server (debounced
  800ms so rapid changes like typing notes don't fire a request per
  keystroke).
- Every server call is wrapped so a failure (no `DATABASE_URL`, network
  error, `cases` row not seeded for a foreign-key match) falls back to
  localStorage silently — server sync is additive, never required.

This gives multi-device resume when Postgres is configured, while keeping
the zero-setup path fully intact. `npm run db:seed` populates the `cases`
table from `src/data/cases` (required before `game_saves` writes will
succeed, since `game_saves.case_id` has a foreign key into `cases.id`).

## Migrations

`drizzle-kit` is configured (`drizzle.config.ts`, pointed at
`src/lib/db/schema.ts`) with `npm run db:generate` / `db:migrate` /
`db:studio` scripts. No migrations are checked in yet since no code path
writes to the database — the first PR that adds Postgres-backed saves should
also add the initial migration.
