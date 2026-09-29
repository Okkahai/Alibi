# 06 — Anti-Hallucination Constraints

This is the design document for the project's central rule: **the AI must
not change reality after the case starts.** Everything here is either
already enforced in code (with a test reference) or explicitly flagged as a
known gap for `docs/10-roadmap.md`.

## The contract, layer by layer

### 1. CaseTruth is immutable at runtime

`CaseTruth` objects are plain data (`src/data/cases/*.ts`), imported and
never mutated by any engine. No engine function takes a `CaseTruth` and
returns a modified one. TypeScript's structural typing doesn't enforce
`readonly` on its own, so this is additionally backed by a runtime
guarantee: `deepFreeze()` (`src/lib/schema/deep-freeze.ts`) recursively
freezes every handcrafted case at its source module (`theVossManorCase` in
`src/data/cases/the-voss-manor-case.ts`), so an attempted write throws a
`TypeError` in strict mode rather than silently succeeding — see
`__tests__/deep-freeze.test.ts`. Cases produced by the procedural generator
(`docs/10-roadmap.md`, Phase 2) should get the same treatment as that
lands.

### 2. The LLM only ever sees a filtered KnowledgePacket

Enforced structurally: `LlmProvider.generateNpcReply` receives a
`KnowledgePacket`, not a `CaseTruth`. There is no function signature in the
codebase that hands the model the full case. See `docs/03` for exactly what
the packet contains and excludes.

### 3. Deterministic comparison replaces LLM judgment wherever exact matching is possible

`evaluateAccusation()` (`src/lib/engines/evaluation-engine.ts`) does the
scoring with id set comparisons for culprit/evidence/timeline, and loose
substring matching for the two genuinely free-text fields (motive, method) —
never an LLM call. This is a direct requirement from the project brief
("Do not use arbitrary LLM judgment when deterministic comparison is
possible") and is unit tested in `__tests__/evaluation-engine.test.ts`.

### 4. Groundedness check: a deterministic safety net on LLM output

`checkGroundedness()` (`src/lib/engines/groundedness.ts`) scans the model's
proposed reply for any case character/location name that isn't licensed by
the packet (the speaker's own name, the victim's name, their claimed
location, or any name that already appears inside their known facts/lies/
evidence-shown text). If it finds one, `askNpc()` discards the reply and
returns a safe fallback line instead of forwarding a hallucinated fact to
the player. Tested directly in `__tests__/npc-dialogue-engine.test.ts`
("groundedness check flags a reply that invents an unrelated character's
name") and behaviorally, by sweeping every suspect against several
questions and asserting `rejected === false` for the reference mock
provider.

**Known limitation:** this check catches *named entities* the model
shouldn't have mentioned. It does not verify the truth value of a *claim*
phrased entirely in the licensed vocabulary (e.g. a provider could still
say "I was there at midnight, not 11pm" — a false time — without naming
anything foreign). Closing that gap needs either (a) constraining providers
to template-based phrasing like the mock provider does, or (b) a second,
fact-level checker that diffs claimed times/relationships against the
packet's `knownFacts` text. Tracked in `docs/10-roadmap.md`; not required
for the MVP because the reference provider is template-based and therefore
can't misstate a time or relationship it wasn't given.

### 5. Evidence-gated disclosure at the engine boundary, not the UI

`buildKnowledgePacket` throws if asked to show evidence the player hasn't
discovered (`discoveredEvidenceIds`), and lie fallbacks stay locked until
their `brokenBy` evidence is discovered. This means even a malformed or
adversarial API request can't extract information early — the check lives
in the engine, which the API route calls, not in client-side UI state that
a browser devtools user could bypass.

### 6. The mock provider as a reference implementation

`mockProvider` (`src/lib/llm/provider.ts`) is not just a stand-in for local
dev — it's a worked example of "phrase only from the packet" done by
template substitution, with zero degrees of freedom to invent a name or
fact. Any real provider integration should be validated by running the same
groundedness-sweep test suite against it before shipping, not assumed safe
because "the prompt says so."

## Non-goals for the MVP

- **Perfect claim-level fact-checking.** See the groundedness limitation
  above.
- **Runtime CaseTruth mutation for "living world" effects** (e.g. an NPC
  changing plans based on player action). Explicitly out of scope per the
  project's core design principle — if this is ever wanted, it must be
  modeled as a *scripted* CaseTruth branch chosen deterministically by game
  logic, never as the LLM improvising a new fact.
