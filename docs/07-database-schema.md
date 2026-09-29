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

The MVP ships **without** requiring Postgres to run at all: the client-side
`GameProvider` (`src/lib/state/game-context.tsx`) persists `GameState` to
`localStorage`, keyed by case id. This satisfies "players should be able to
leave and resume later" with zero setup. The Drizzle schema and client exist
and are tested to compile/typecheck, but nothing in the current UI writes to
Postgres yet — wiring the API routes to `game_saves` (for multi-device saves
and, eventually, multiplayer co-op board sharing) is the first item in
`docs/10-roadmap.md`.

## Migrations

`drizzle-kit` is configured (`drizzle.config.ts`, pointed at
`src/lib/db/schema.ts`) with `npm run db:generate` / `db:migrate` /
`db:studio` scripts. No migrations are checked in yet since no code path
writes to the database — the first PR that adds Postgres-backed saves should
also add the initial migration.
