# 10 — Development Roadmap

Ordered roughly by dependency, not strictly by priority — items within a
phase can usually be reordered.

## Phase 1 — Harden the MVP foundation

- [ ] `deepFreeze()` every `CaseTruth` at load/import time so runtime
      mutation is impossible, not just unpracticed (`docs/06`, Known Gap #1).
- [ ] Wire a real LLM provider (Anthropic) behind `LlmProvider`, validated
      by running the existing groundedness-sweep tests against it before
      it's allowed to be the default (`COLDCASE_LLM_PROVIDER=anthropic`).
      Blocked on an `ANTHROPIC_API_KEY` being configured for the app's own
      deployment — the abstraction and mock reference implementation are
      ready for it (`docs/06`).
- [x] Wire `game_saves`/`cases` Postgres persistence into the API routes as
      an alternative to localStorage, for multi-device resume (`docs/07`).
      Shipped as best-effort sync alongside localStorage, not a replacement
      for it — `npm run db:seed` populates `cases` first.
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
