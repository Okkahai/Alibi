# 10 — Development Roadmap

Ordered roughly by dependency, not strictly by priority — items within a
phase can usually be reordered.

## Phase 1 — Harden the MVP foundation

- [ ] `deepFreeze()` every `CaseTruth` at load/import time so runtime
      mutation is impossible, not just unpracticed (`docs/06`, Known Gap #1).
- [x] Wire real LLM providers behind `LlmProvider`: an OpenAI-compatible
      provider (`src/lib/llm/providers/openai-compatible.ts` — works with
      Ollama, LM Studio, vLLM, or OpenAI itself via `COLDCASE_OPENAI_BASE_URL`,
      no key needed for a local endpoint) and a real Anthropic provider
      (`src/lib/llm/providers/anthropic.ts`, active only when
      `ANTHROPIC_API_KEY` is set — otherwise `getLlmProvider()` falls back
      to mock with a warning). Both share one constrained system prompt
      builder (`src/lib/llm/prompt.ts`) and go through the same
      groundedness check as the mock provider (`askNpc()` doesn't care
      which provider produced the text). Select with
      `COLDCASE_LLM_PROVIDER=openai-compatible|anthropic|mock` (default).
      Tested against a stubbed local HTTP server
      (`__tests__/llm-providers.test.ts`) and, for the OpenAI-compatible
      path, smoke-tested through the live `/api/npc/ask` route against a
      real stub server — confirmed both a normal reply and a deliberately
      hallucinated one (the latter correctly rejected by the groundedness
      check). Neither provider has been exercised against the real
      OpenAI/Anthropic/Ollama APIs in this environment — outbound network
      access to them is reachable, but no API key was available to
      authenticate a real call — so a genuine end-to-end run (not just the
      stubbed-server tests) is still worth doing before treating either as
      production-ready.
- [ ] Wire `game_saves`/`cases` Postgres persistence into the API routes as
      an alternative to localStorage, for multi-device resume (`docs/07`).
- [ ] Claim-level groundedness checking (beyond named-entity matching) once
      a real provider is in place and can misstate a time/relationship in
      licensed vocabulary (`docs/06`, Known Limitation).
- [ ] Deterministic stress/trust adjustment: feed `liedUsing` and
      evidence-confrontation outcomes back into `Character.stress`/`trust`
      for the *next* packet built for that character, rather than using the
      static per-character baseline (`docs/03`).

## Phase 2 — Case Generator

- [ ] A `CaseGenerator` module that produces a `CaseTruth` from
      `{ difficulty, seed }`, satisfying every rule in
      `validateCaseTruth()` by construction (not by generate-then-hope).
      Likely approach: generate structurally (locations → timeline →
      characters → evidence → solution) with an LLM proposing *content*
      (names, descriptions, phrasing) while a deterministic layer enforces
      *structure* (ids, cross-references, the solvability invariant) —
      mirroring the same LLM-phrases/engine-enforces split used for
      dialogue.
- [ ] A generation-time validation gate: any generated case that fails
      `validateCaseTruth()` is regenerated or rejected, never patched.
- [ ] Difficulty-tier content rules beyond suspect count: hard-tier
      "unreliable witnesses" (an NPC whose `knowledge` includes an
      `inferred`-source fact that's actually wrong — modeled as a real,
      scoped falsehood in the schema, not LLM improvisation) and "strong
      alternative theories" (deliberately well-evidenced red herrings).
- [ ] Difficulty-tier discovery gating: use `Evidence.discoveryRequirements`
      (schema support already exists, unused by the MVP case) to chain
      evidence behind other evidence for harder cases.

## Phase 3 — Game modes

- [ ] Daily Case: a deterministic seed derived from the date, generated
      once server-side and shared by all players that day.
- [ ] Case picker UI (once more than one case exists).
- [ ] Multiplayer co-op: shared `GameState` (evidence board, discovered
      evidence, notes) across players investigating the same case — needs
      `game_saves` to move from single-player localStorage to a
      server-authoritative, multi-writer model (likely real-time sync,
      e.g. via WebSocket or polling against Postgres).

## Phase 4 — UX depth

- [ ] Drag-and-drop Evidence Board (replacing randomized-placement +
      click-to-connect).
- [ ] Suspect portraits / crime scene imagery.
- [ ] Richer contradiction UI: surface `CaseTruth.contradictions` as
      discoverable "aha" moments in the Evidence Board rather than only
      through dialogue.
- [ ] Accessibility pass (the current dark theme has not been audited for
      contrast/keyboard navigation).

## Explicitly out of scope until asked for

Anything that lets the LLM alter `CaseTruth`, invent evidence, or decide
solvability at runtime. If a future feature seems to need this (e.g. "the
killer changes their story based on player pressure"), it must be modeled as
a **scripted, pre-authored branch** chosen by deterministic game logic — see
`docs/06`'s Non-Goals section. This constraint is not expected to loosen.
