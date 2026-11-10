@AGENTS.md

## Claude-specific notes

Everything else about this project is provider-neutral and lives in `AGENTS.md` (imported above) and `docs/agent/`. This file only holds what's specific to running Claude here.

- This repo has been developed across several Claude Code Cloud project threads; it is migrating to a local multi-agent setup (Claude Code, Codex CLI, git worktrees, independent reviewers, GitHub CI). `docs/agent/HANDOFF.md` has the migration-readiness audit — read it once when picking this project up in the new setup.
- PR descriptions and commit trailers in this repo's history include a Claude Code attribution footer; keep doing that when the environment you're running in asks for one, and don't add one when it doesn't.
- No Claude-only engines, flags, or code paths exist in this codebase — the `COLDCASE_LLM_PROVIDER=anthropic` option is a product feature (one of three interchangeable LLM providers for NPC dialogue in the non-daily mode), not a statement about which agent should do the coding.

