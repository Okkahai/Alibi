# 01 — Game Architecture

## The one rule everything else serves

**The AI must not change reality after the case starts.** Every architectural
decision below exists to make that rule enforceable in code, not just true in
spirit.

## Five separated systems

```
CASE GENERATOR        → produces an immutable CaseTruth (offline / pre-play)
NPC DIALOGUE ENGINE    → phrases replies from a filtered slice of CaseTruth
GAME STATE ENGINE      → tracks what the player has discovered/done (mutable)
EVIDENCE ENGINE        → governs what evidence exists and how it's found
EVALUATION ENGINE      → scores an Accusation against CaseTruth deterministically
```

The LLM appears in exactly one of these — the NPC Dialogue Engine — and only
as a phrasing layer. It is never the source of truth for what happened, what
a character knows, or whether an accusation is correct.

## Data flow for one interrogation turn

```
Player types a question
        │
        ▼
Game State Engine (src/lib/state)
  - what has the player discovered? (discoveredEvidenceIds)
  - what evidence, if any, is being shown this turn?
        │
        ▼
Knowledge Packet Builder (src/lib/engines/knowledge-packet.ts)
  - filters CaseTruth down to ONLY what this character may draw on:
    their knowledge[], their lies[] (gated by discovered brokenBy evidence),
    their claimedLocation, and the conversation history
        │
        ▼
NPC Dialogue Engine (src/lib/engines/npc-dialogue-engine.ts)
  - hands the packet + question to the LlmProvider
        │
        ▼
LlmProvider.generateNpcReply() (src/lib/llm/provider.ts)
  - phrases a reply using ONLY the packet's contents
  - "mock" provider (default, no API key) does this with templates;
    a real provider does it with a constrained prompt
        │
        ▼
Groundedness check (src/lib/engines/groundedness.ts)
  - deterministic post-check: does the reply name any character/location
    NOT present in the packet? If so, REJECT and fall back to a safe line.
        │
        ▼
Reply reaches the player
```

No step in this chain lets the LLM write to `CaseTruth` or invent a fact that
doesn't trace back to it. See `docs/06-anti-hallucination.md` for the full
contract.

## Directory layout (MVP)

```
src/
  lib/
    schema/          Zod schemas: CaseTruth, GameState (docs/02, this is law)
    engines/          Knowledge packet, groundedness, validators, dialogue,
                       evaluation — the deterministic game logic
    llm/              Provider abstraction + mock provider
    db/               Drizzle schema + client (Postgres persistence)
    state/            Client-side GameProvider (localStorage save system)
  data/
    cases/            Handcrafted CaseTruth objects (MVP: one case)
  app/                Next.js App Router pages + API routes
docs/                 This design doc set
__tests__/            Vitest suite for schema, validators, engines
```

## Why this separation matters

If the LLM is ever given free rein to "continue the story," two players who
ask the same question in different orders can get contradictory answers, and
a contradiction the player found because they were clever can retroactively
stop existing because the model forgot it said that. Every engine in this
list is deterministic and unit-testable specifically so that can't happen —
see `__tests__/case-validators.test.ts` and `__tests__/npc-dialogue-engine.test.ts`
for the guarantees currently enforced by tests, not just by convention.
