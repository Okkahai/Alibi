# Game design

ALIBI is a daily deduction puzzle dressed as a forensic dossier. Players get one shared case per day, the same case for everyone, plus an archive and practice files.

- **Core loop:** recover exhibits, then rule things out on the matrix, accuse, read the reconstruction, and share a spoiler-free ledger.
- **Fairness first:** one provable answer, every exhibit needed, and no answer readable from layout, names or order (`GAME_RULES.md`, `CASE_GENERATION.md`).
- **Difficulty:** dailies are medium (4–6 suspects, usually 7–15 exhibits). Practice files offer easy (3 suspects) and hard (6–8 suspects).
- **Look:** Forensic Modernism × Victorian Gothic, with ink plates over an ivory ledger (`DESIGN_SYSTEM.md`, `DESIGN_RESEARCH.md`).
- **Onboarding:** a scripted 3 × 3 tutorial teaches reading exhibits and marking ✕/✓ (`/tutorial`).
- **Puzzle model:** see `PUZZLE_MODEL.md`. The solver is described in `CONSTRAINT_SOLVER.md`, and the daily cadence and freezing in `DAILY_SYSTEM.md`.
