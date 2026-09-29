/**
 * Builds the filtered knowledge packet sent to the NPC Dialogue Engine.
 * This is the ONLY case information the LLM ever sees for a given turn —
 * never the full CaseTruth. Keeping the filter here, outside the prompt,
 * is what makes "the NPC doesn't know X" enforceable rather than a suggestion.
 */
import type { CaseTruth, Character } from "@/lib/schema/case-truth";
import type { Conversation } from "@/lib/schema/game-state";

export interface KnowledgePacket {
  character: {
    name: string;
    role: Character["role"];
    personality: string;
    relationshipToVictim: string;
    stress: number;
    trust: number;
  };
  /** Only the fact strings this character actually knows — never full CaseTruth objects. */
  knownFacts: string[];
  /** Lies available to this character, with fallback behavior, for the LLM to enact under pressure. */
  availableLies: Array<{ falseClaim: string; fallback: string }>;
  claimedLocation: string;
  conversationHistory: Conversation["turns"];
  /** Description of evidence the player just showed, if any — filtered to non-spoiler fields. */
  evidenceShown: { description: string; type: string } | null;
}

export function buildKnowledgePacket(
  truth: CaseTruth,
  characterId: string,
  conversation: Conversation | undefined,
  discoveredEvidenceIds: string[],
  evidenceShownId: string | null
): KnowledgePacket {
  const character = truth.characters.find((c) => c.id === characterId);
  if (!character) throw new Error(`Unknown character: ${characterId}`);

  const claimedLocationName =
    truth.locations.find((l) => l.id === character.claimedLocation)?.name ?? character.claimedLocation;

  let evidenceShown: KnowledgePacket["evidenceShown"] = null;
  if (evidenceShownId) {
    if (!discoveredEvidenceIds.includes(evidenceShownId)) {
      throw new Error("Cannot show evidence the player has not discovered.");
    }
    const item = truth.evidence.find((e) => e.id === evidenceShownId);
    if (item) evidenceShown = { description: item.description, type: item.type };
  }

  // Lies only unlock once their breaking evidence has actually been discovered by the player,
  // OR unconditionally if no breaking evidence is required (a lie told on principle).
  const availableLies = character.lies
    .filter((lie) => lie.brokenBy.length === 0 || lie.brokenBy.some((id) => discoveredEvidenceIds.includes(id)))
    .map((lie) => ({ falseClaim: lie.falseClaim, fallback: lie.fallback }));

  return {
    character: {
      name: character.name,
      role: character.role,
      personality: character.personality,
      relationshipToVictim: character.relationshipToVictim,
      stress: character.stress,
      trust: character.trust,
    },
    knownFacts: character.knowledge.map((k) => k.fact),
    availableLies,
    claimedLocation: claimedLocationName,
    conversationHistory: conversation?.turns ?? [],
    evidenceShown,
  };
}
