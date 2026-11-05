# Architecture (current)

The earlier `01-architecture.md` describes the LLM-interrogation prototype. That design still exists for handcrafted cases, but dailies no longer use it. No model runs at play time for a daily.

## Pipeline for a daily

```
date seed ──► puzzle-generator.ts ──► solver.ts proves one answer
               (abstract clues)            │
                                           ▼
               narrative-generator.ts  names, rooms, methods, exhibit text,
                                       chronology, lies, solution
                                           │
               deduction-trace.ts ─────────┤ clue-only elimination order
                                           ▼
               case-validators.ts      structural + solvability checks
                                           │
                                           ▼
                               CaseTruth (deep-frozen) ──► the browser
```

- **Determinism:** `prng.ts` is seeded from the UTC date. The same date always gives the same case, and `daily-fingerprint.ts` plus `src/data/daily-fingerprints.json` freeze each published day. See `DAILY_SYSTEM.md`.
- **Rules versions:** generator changes are gated on the seed date. `RULES_V2_FROM = "2026-11-06"` keeps every published day byte-identical. Practice seeds always use the newest rules. See `CASE_GENERATION.md`.

## Modules

| Path | Role |
|---|---|
| `src/lib/engines/solver.ts` | Exhaustive constraint solver over culprit × method × room; `falseAlibi = culprit`. |
| `src/lib/engines/puzzle-generator.ts` | True-clue pool (decoys included), growth to uniqueness, pruning, shortcut and frequency-tell checks. |
| `src/lib/engines/narrative-generator.ts` | Turns a puzzle into a `CaseTruth`; one template set per clue meaning. |
| `src/lib/engines/deduction-trace.ts` | Smallest exhibit group (1, 2, 3) behind each elimination; feeds hints and the reveal. |
| `src/lib/engines/evaluation-engine.ts` | Deterministic scoring of an accusation. |
| `src/lib/engines/daily-case.ts` | Date to seed, case number, share text. |
| `src/lib/state/*` | Client state: matrix marks, hints, known events (Chronology), tutorial, case selection. |
| `src/app/*` | Next.js App Router pages, one per dossier section; `app-shell.tsx` loads the case. |
| `src/lib/llm/*`, `api/npc` | Handcrafted-case interrogation only (mock by default, no key needed). |

## Invariants

- Every exhibit's text means exactly its solver clue. This is a template convention, checked by QA's English-meaning brute force (a process, not a repo test).
- No answer field can be read from presentation (title, room names, exhibit placement, Chronology): `crime-room-leak.test.ts`, `rules-v2.test.ts`.
- Chronology events stay redacted until `knownEvents()` unlocks them (convention; no test).
- Published dailies never change: `daily-frozen.test.ts`.
