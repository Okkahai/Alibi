# ColdCase AI

An AI-powered detective investigation game. The player investigates a
procedurally-generated (MVP: handcrafted) murder mystery by examining
evidence, interviewing suspects, catching contradictions, and building a
case — all against a **Case Truth that is generated once, before play
begins, and never changes**. See `docs/06-anti-hallucination.md` for the
full contract behind that rule.

## Design docs

Read these in order before touching the code — they explain *why* the
engines are shaped the way they are, not just what they do:

1. [`docs/01-architecture.md`](docs/01-architecture.md)
2. [`docs/02-case-truth-schema.md`](docs/02-case-truth-schema.md)
3. [`docs/03-npc-knowledge-system.md`](docs/03-npc-knowledge-system.md)
4. [`docs/04-evidence-system.md`](docs/04-evidence-system.md)
5. [`docs/05-interrogation-architecture.md`](docs/05-interrogation-architecture.md)
6. [`docs/06-anti-hallucination.md`](docs/06-anti-hallucination.md)
7. [`docs/07-database-schema.md`](docs/07-database-schema.md)
8. [`docs/08-ui-ux.md`](docs/08-ui-ux.md)
9. [`docs/09-mvp.md`](docs/09-mvp.md)
10. [`docs/10-roadmap.md`](docs/10-roadmap.md)

## Running it

```bash
npm install
npm run dev
```

No API key or database required — the default LLM provider is a
deterministic mock (`COLDCASE_LLM_PROVIDER=mock`, see
`src/lib/llm/provider.ts`) and the save system uses browser localStorage
(`src/lib/state/game-context.tsx`). Postgres (`.env.example` →
`DATABASE_URL`) is only needed once you wire up server-side saves per
`docs/10-roadmap.md`.

```bash
npm run test    # vitest: schema, validators, engines, anti-hallucination guarantees
npm run lint
npm run build
```

## Stack

Next.js (App Router) + TypeScript + Zod for schema validation + Tailwind for
UI + Drizzle/PostgreSQL for persistence (scaffolded, not yet wired into the
UI — see `docs/07-database-schema.md`).
