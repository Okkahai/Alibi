# Development progress

| PR | Merged | What |
|---|---|---|
| #1–#9 | 2026-09-29 | Prototype: design docs, Voss Manor case, saves, LLM providers, first daily mode |
| #10 | 2026-11-04 | Solver-backed generator |
| #11 | 2026-11-04 | Visual redesign (`DESIGN_SYSTEM.md`) |
| #12 | 2026-11-04 | Deduction matrix, graded room |
| #13 | 2026-11-04 | Crime-room leak fix |
| #14 | 2026-11-04 | Hints, scoring, share text, reveal deduction chain |
| #15 | 2026-11-04 | Interactive tutorial |
| #16 | 2026-11-04 | Frozen daily fingerprints, CI |
| #17 | 2026-11-04 | Rules v2: minimal clue sets with decoys (dailies from 2026-11-06) |
| #18 | 2026-11-05 | Frequency-tell damping, room wording, three verdicts, 11-05 frozen |

## Open

- Confirm that the daily freeze cron runs on its own. It did not fire on 2026-11-05.
- A richer archive (more than 7 days, stats).
- More varied culprit-elimination wording.
- The client reports its own hint count, which is acceptable for a no-account game.
