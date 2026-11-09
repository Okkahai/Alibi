# Decisions — index

`docs/DECISIONS.md` is the authoritative, numbered decision log for the product — add new decisions there, in that format (short, dated, says *why*), not here. This file is only a pointer plus the decisions that are specifically about how agents should work on this repo, which don't belong in the product log.

## Product decisions

See `docs/DECISIONS.md` for the full numbered list. The ones most likely to be re-litigated by a new agent who hasn't read it:

1. No runtime LLM for dailies — reproducibility and cost, not a capability limit.
2. A real backtracking solver, not a heuristic validator — see `docs/REBUILD_AUDIT.md` for exactly why the old heuristic couldn't prove uniqueness.
3. `falseAlibi = culprit` as a stated rule — text/solver disagreed ~9% of the time without it.
6. Freeze-by-fingerprint, not full-JSON-snapshot, for published days.
8. Frequency tells are damped, not eliminated — measured, don't re-attempt wider damping expecting a different result.

## Agent-process decisions (not in the product log)

- **Independent QA before merge, for every feature** — recorded in `docs/TESTING.md`'s "QA gates" section, not `docs/DECISIONS.md`, because it's a process rule rather than a product property.
- **Generator/solver changes get a seed sweep before merge** (thousands of seeds, multiple difficulties) — same reasoning.
- **Date-gate generator changes instead of ever editing a fingerprint** — see `docs/DAILY_SYSTEM.md`.
