# 02 — Immutable Case Truth Schema

Schema source of truth: `src/lib/schema/case-truth.ts` (Zod). This document
explains the *why* behind its shape; the code is authoritative for the exact
fields.

## Design principles

1. **Everything traces to something.** Evidence must cite the timeline
   event(s) it came from (`relatedEventIds`, min 1). A character's knowledge
   cites the events it derives from. A lie cites the fact it conceals and the
   evidence that breaks it. This is what makes the "no invented facts" rule
   checkable by a validator instead of just a prompt instruction — see
   `src/lib/engines/case-validators.ts`.

2. **One CaseTruth, one culprit, one solution.** `solution.culpritId` must
   match exactly one `character.isCulprit === true`. There is no
   "ambiguous ending" mode in the MVP — the case is solvable by construction
   or it's rejected before it ever reaches a player.

3. **Difficulty is a property of CaseTruth, not of prompting.** Suspect count
   bounds (easy 3, medium 4-6, hard 6-8) are validated structurally
   (`difficulty-suspect-count` rule), not left to the LLM's judgment of "make
   it harder."

## The shape, at a glance

```
CaseTruth
├─ victim              { name, description }
├─ locations[]         { id, name, description, connectedTo[] }
├─ characters[]         Character (see below)
├─ timeline[]           TimelineEvent — the ground truth of what happened, when
├─ evidence[]            Evidence — always traces to timeline event(s)
├─ contradictions[]      Named claim-vs-truth pairs, for the "gotcha" moments
└─ solution              { culpritId, motive, method, keyEvidenceIds,
                           criticalTimelineEventIds }
```

### Character

```
Character
├─ actualLocation / claimedLocation   (two fields — the gap between them
│                                       IS the mystery, for the culprit)
├─ knowledge[]     KnowledgeItem — atomic facts, each with a source
│                  (witnessed | told | inferred | physical_evidence) and a
│                  `sensitive` flag (won't be volunteered without pressure)
├─ doesNotKnow[]   explicit negative facts — documentation + test fixtures,
│                  not enforced at runtime (the packet filter already
│                  excludes everything not in `knowledge`)
├─ lies[]          Lie — falseClaim, what it conceals, what breaks it
│                  (brokenBy: Evidence ids), and a fallback behavior once
│                  broken (deny | explain | panic | change_story |
│                  reveal_information)
└─ isCulprit       exactly one true across all characters
```

A character's `knowledge` array is the *entire* universe of facts that
character's dialogue may ever surface. This is enforced structurally by the
Knowledge Packet Builder (`docs/03`), not by asking the LLM nicely.

### TimelineEvent

Every event has `isTrue: true` (a Zod literal) — a deliberate reminder that
this array is ground truth, never a player-claimed or NPC-claimed version of
events. Contradictions are modeled separately (below), not by putting false
events in the timeline.

### Evidence

`reliability` is one of `reliable | circumstantial | misleading`.
`isRedHerring` is a separate boolean — a red herring can be reliable evidence
that's simply irrelevant to the solution (e.g. it corroborates an innocent
suspect's real but unrelated secret), or it can be misleading. Both axes are
needed: reliability describes *how much the fact can be trusted*, red-herring
describes *whether it points at the culprit*.

### Contradiction

A first-class object linking a character's false `claim` to the `truth` it
contradicts and the `revealingEvidenceIds` that expose it. This is what
powers the "You said X, but Y" confrontation flow in Interrogation — the game
doesn't infer contradictions at runtime, it looks them up.

### Solution

Deliberately narrow: `motive` and `method` are free text (evaluated with
loose matching, see `docs/06`), while `culpritId`, `keyEvidenceIds`, and
`criticalTimelineEventIds` are exact-match identifiers. This mix is what lets
the Evaluation Engine score an accusation deterministically instead of asking
an LLM "is this close enough" for the parts where exactness is possible.

## Validation

`validateCaseTruth()` (`src/lib/engines/case-validators.ts`) runs 10 rule
groups: referential integrity (every id used actually exists), the
single-culprit invariant, knowledge-is-a-subset-of-truth, solvability (at
least one reliable, non-red-herring piece of evidence must implicate the
culprit), and difficulty bounds. Every handcrafted or generated case must
pass this before it's playable — see `__tests__/case-validators.test.ts` for
the full rule list exercised against the MVP case.
