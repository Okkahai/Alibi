# Testing

```
npx next typegen && npx tsc --noEmit   # route types are generated
npm run lint
npm test                               # vitest, ~70 tests, ~10 s
npm run build
```

CI (`.github/workflows/ci.yml`) runs exactly these on every PR and every push to `main`. Vercel deploys `main` to production.

## What the suite guards

| Test | Guards |
|---|---|
| `solver.test.ts`, `puzzle-generator.test.ts` | uniqueness; generator and solver agree |
| `rules-v2.test.ts` | no redundant clue, no stated answer, distinct names, name shortcut, frequency damping, key exhibits |
| `daily-window.test.ts` | 365 days of dailies generate with a complete clue-only trace |
| `daily-frozen.test.ts` | published days are byte-identical |
| `crime-room-leak.test.ts` | the crime room cannot be read from presentation |
| `deduction-trace.test.ts`, `hints.test.ts` | hints use only examined exhibits and never claim a false contradiction |
| `matrix.test.ts`, `tutorial.test.ts` | grid completion rule and the scripted tutorial |
| `evaluation-engine.test.ts` | scoring weights, room grading, hint cost |

Generator sweeps take a few seconds on CI, so `vitest.config.ts` sets `testTimeout` to 60 s.

## QA gates (process)

- **Independent review.** Every feature gets an independent QA agent before merge; the author is never the only reviewer.
- **Generator changes.** QA runs seed sweeps (thousands of seeds at 3, 5 and 7 suspects) and checks:
  - uniqueness under the solver and under an independent English-meaning brute force;
  - generation failures and timing;
  - giveaway patterns: who gets named, Chronology, exhibit order and rooms, frequency counts.
- **Visual changes.** A Playwright screenshot loop at 1440 px and 390 px, checking for page errors and horizontal scroll.
