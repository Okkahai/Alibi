# 05 — Interrogation Architecture

## Request path

```
UI (src/app/interrogation/page.tsx)
  → POST /api/npc/ask (src/app/api/npc/ask/route.ts)
    → askNpc() (src/lib/engines/npc-dialogue-engine.ts)
      → buildKnowledgePacket()
      → LlmProvider.generateNpcReply()
      → checkGroundedness()
    ← { text, liedUsing?, rejected, rejectionReason? }
  ← rendered as an NPC chat bubble; player turn + NPC turn both saved to
    GameState.conversations via the client-side GameProvider
```

## API contract (`/api/npc/ask`)

Request body (validated with Zod):

```
{
  caseId: string
  characterId: string
  playerQuestion: string
  discoveredEvidenceIds: string[]
  evidenceShownId: string | null
  conversationTurns: DialogueTurn[]   // this character's history so far
}
```

Response:

```
{ text: string, liedUsing?: string, rejected: boolean, rejectionReason?: string }
```

`rejected: true` means the groundedness check refused the provider's output
and `text` is the safe fallback line — the API always returns *something*
displayable, so the UI never has to special-case a failure state.

## Why conversation history is passed in, not stored server-side (yet)

The MVP has no server-side session store — `GameState` (including
conversations) lives in the browser (`src/lib/state/game-context.tsx`,
localStorage-backed). The API is stateless per request: it's handed exactly
the history it needs for this turn and returns exactly one new turn. This
keeps the API easy to test (`__tests__/npc-dialogue-engine.test.ts` calls
`askNpc` directly, no server needed) and easy to move behind a real database
later (`docs/07`) without changing the engine's signature — only where
`conversationTurns` is read from changes.

## Confronting a lie with evidence

1. Player selects a discovered evidence item from the dropdown before
   sending a message (`evidenceShownId`).
2. `buildKnowledgePacket` validates the evidence was actually discovered,
   then includes `evidenceShown` in the packet and — separately — computes
   `availableLies` including any now-unlocked by that evidence's id being in
   `brokenBy`.
3. The mock provider's `generateNpcReply` special-cases `evidenceShown`:
   if there's an available lie, it responds using that lie's `fallback`
   template (deny/explain/panic/change_story/reveal_information) and reports
   `liedUsing`. A real provider does the same thing via prompt, not template.
4. `liedUsing` is returned to the client for now (future: feed into
   `Character.stress`/`trust` adjustments per `docs/10-roadmap.md`).

## Natural-language input, deterministic grounding

The player types free text (`playerQuestion`). The engine does **not** try
to parse intent deterministically — that's exactly the kind of open-ended
natural-language task an LLM is for. What's deterministic is the *boundary*:
regardless of how the question is phrased, the reply can only draw on
`knownFacts` / `availableLies` / `evidenceShown`, and the groundedness check
verifies that boundary held after the fact. See `docs/06` for the full
contract and its current limits.
