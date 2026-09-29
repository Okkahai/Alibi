# 04 — Evidence System

## Every evidence item originates from CaseTruth

There is no code path that lets a case generator, an LLM, or the runtime
invent a new evidence item mid-game. `CaseTruth.evidence[]` is fixed at case
creation; play only reveals or hides items already in that array.

## Shape (`src/lib/schema/case-truth.ts`)

```
Evidence
├─ type                 photograph | document | message | email | receipt |
│                        fingerprint | object | security_log |
│                        medical_report | phone_record | witness_statement
├─ locationId            where it's found
├─ discoveryRequirements  ids of prerequisite evidence/knowledge (optional
│                          gating — the MVP case leaves most items
│                          ungated, so the player can search freely)
├─ relatedCharacterIds[]
├─ relatedEventIds[]     REQUIRED, min 1 — every item traces to a real event
├─ reliability           reliable | circumstantial | misleading
├─ hiddenInterpretation  the true meaning, never shown directly to the
│                        player — it exists for design/QA and could power a
│                        future "interpretation check" feature
└─ isRedHerring          deliberate red herring, independent of reliability
```

## Discovery flow

1. Player visits a `Location` (`/crime-scene`), which calls
   `GameState.visitLocation`.
2. The Crime Scene page lists `CaseTruth.evidence` filtered to that
   location.
3. Examining an item calls `GameState.discoverEvidence(evidenceId)`, adding
   it to `discoveredEvidenceIds` — the single source of truth for "what has
   the player found," read by every other engine (dialogue gating, timeline
   unlocking, accusation evidence picker).

`discoveryRequirements` is present in the schema for cases that want to gate
an item behind another (e.g. a locked drawer needing a key found elsewhere)
but is unused by the MVP case — every item is discoverable as soon as its
location is searched. The UI/engine already supports requirement chains for
harder difficulty cases in `docs/10-roadmap.md`.

## Reliability vs. red herring

These are independent axes on purpose:

- `reliability: misleading` + `isRedHerring: true` — actively deceptive
  (e.g. a genuine-looking but staged clue).
- `reliability: circumstantial` + `isRedHerring: true` — real, but doesn't
  point at the actual culprit (e.g. `ev_will_draft` in the MVP case: a real
  motive for Eleanor, who has an airtight alibi).
- `reliability: reliable` + `isRedHerring: false` — the case-solving core
  (fingerprints, toxicology, ledger).

The Evaluation Engine (`docs/06`) doesn't grade on reliability/red-herring
directly — it grades on whether the player's submitted `keyEvidenceIds`
match `solution.keyEvidenceIds`. Reliability and red-herring flags are
signal for the player and for case design/QA (a solvable case needs its
`solution.keyEvidenceIds` to all be `reliable`, non-red-herring — enforced
by validator rule `solvable-implicating-evidence`).

## Evidence in interrogation

Evidence can be shown to an NPC during a conversation. See `docs/03` and
`docs/05` — showing evidence is the mechanism that unlocks lie fallbacks and
produces the confrontation beats ("You said X, but here's Y").
