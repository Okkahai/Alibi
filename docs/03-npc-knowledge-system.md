# 03 — NPC Knowledge System

## The core mechanism: the Knowledge Packet

`src/lib/engines/knowledge-packet.ts` builds a `KnowledgePacket` for a single
interrogation turn. It is the *only* thing the LLM ever sees about the case —
never the full `CaseTruth`.

```ts
interface KnowledgePacket {
  character: { name, role, personality, relationshipToVictim, stress, trust };
  knownFacts: string[];          // character.knowledge[].fact — plain strings only
  availableLies: { falseClaim, fallback }[];
  claimedLocation: string;
  conversationHistory: DialogueTurn[];
  evidenceShown: { description, type } | null;
}
```

Notice what's *not* in there: character ids, other characters' knowledge,
the solution, the full timeline, evidence not yet shown by the player. The
packet is built by filtering `CaseTruth`, not by asking the model to
self-censor — this is the difference between a suggestion and a constraint.

## How lies unlock

A lie is available to the LLM (listed in `availableLies`) if:

- it has no `brokenBy` requirement (told unconditionally), **or**
- at least one of its `brokenBy` evidence ids is in the player's
  `discoveredEvidenceIds`.

This means a lie's *fallback behavior* (deny/explain/panic/change_story/
reveal_information) only becomes reachable once the player has actually
found the evidence that would justify confronting the character with it.
Before that, the character just... tells the lie, same as any question. See
`__tests__/npc-dialogue-engine.test.ts` — "unlocks a lie's fallback only once
its breaking evidence is discovered."

## Evidence-gated disclosure

`buildKnowledgePacket` throws if `evidenceShownId` isn't in
`discoveredEvidenceIds` — the player cannot confront an NPC with evidence
they haven't found yet, even by crafting the request directly. This is
enforced at the engine boundary, not the UI.

## "Doesn't know" is structural, not a rule the model follows

There's no `doesNotKnow` filtering logic at runtime — it doesn't need one.
`knownFacts` only ever contains `character.knowledge[].fact`. If a fact isn't
in that array, it was never sent to the model, so the model has no path to
say it. `Character.doesNotKnow` exists purely as human-readable documentation
and a test fixture; removing it wouldn't change dialogue behavior.

## Stress and trust

`stress` and `trust` are numeric fields (0-1) on `Character`, included in the
packet so phrasing can reflect them (a high-stress character phrases
differently under confrontation). In the MVP these are static per-character
baseline values; a follow-up iteration should let the Game State Engine
adjust them deterministically (e.g. +stress after each `liedUsing` reply,
+trust after evidence-backed confrontations) and feed the updated value back
into the next packet — see `docs/10-roadmap.md`.

## What the LLM is actually asked to do

Phrase one reply, in character, using only the packet's `knownFacts` /
`availableLies` / `evidenceShown`, in response to `playerQuestion`. Nothing
about "what happened in the case" is asked of it — that question is already
answered by the packet's contents.
