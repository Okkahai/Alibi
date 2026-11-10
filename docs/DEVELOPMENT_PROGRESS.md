# Development progress

| PR | Merged | What |
|---|---|---|
| #1–#8 | 2026-09-29 | Prototype: design docs, Voss Manor case, saves, LLM providers, first daily mode |
| #10 | 2026-11-04 | Solver-backed generator |
| #11 | 2026-11-04 | Visual redesign (`DESIGN_SYSTEM.md`) |
| #12 | 2026-11-04 | Deduction matrix, graded room |
| #13 | 2026-11-04 | Crime-room leak fix |
| #14 | 2026-11-04 | Hints, scoring, share text, reveal deduction chain |
| #15 | 2026-11-04 | Interactive tutorial |
| #16 | 2026-11-04 | Frozen daily fingerprints, CI |
| #17 | 2026-11-04 | Rules v2: minimal clue sets with decoys (dailies from 2026-11-06) |
| #18 | 2026-11-05 | Frequency-tell damping, room wording, three verdicts, 11-05 frozen |
| #19 | 2026-11-05 | Docs: game rules, design, architecture, testing, decisions, progress |
| #20 | 2026-11-05 | Full paged archive of past dailies, per-device stats, mobile hint panel above grid |
| #21 | 2026-11-06 | Varied daily case titles (effective from 2026-11-07) |
| #22 | 2026-11-06 | Varied suspect-clearing wording (effective from 2026-11-07) |

**#9 closed 2026-11-10, never merged** — it predated the solver rebuild (#10+), its branch conflicted with `main`, and its content had been structurally replaced. See `docs/agent/TASK_REGISTRY.md` T-001.

## Open

- Confirm that the daily freeze cron runs on its own without manual `workflow_dispatch` (it needed a manual trigger on 2026-11-05 and 2026-11-06). See `docs/agent/TASK_REGISTRY.md` T-002.
- The client reports its own hint count, which is acceptable for a no-account game.
- No confirmed next direction beyond #22 — the earlier "deduction matrix + vertical slice, room/evidence content, loss-state variety" backlog is confirmed shipped in the code; see `docs/agent/TASK_REGISTRY.md` T-004.
