/**
 * Deterministic, LLM-free interrogation for daily play: the player picks a
 * question from a fixed list, and the answer is read straight from CaseTruth.
 * Same case, same answers, for every player, with no API cost.
 */
import type { CaseTruth, Character } from "@/lib/schema/case-truth";

export const QUESTION_TOPICS = [
  { id: "whereabouts", label: "Where were you tonight?" },
  { id: "victim", label: "How did you know the victim?" },
  { id: "notice", label: "Did you notice anything unusual?" },
] as const;
export type TopicId = (typeof QUESTION_TOPICS)[number]["id"];

const locationName = (truth: CaseTruth, id: string) => truth.locations.find((l) => l.id === id)?.name ?? "somewhere";

export function answerTopic(truth: CaseTruth, character: Character, topic: TopicId): string {
  switch (topic) {
    case "whereabouts":
      return character.lies[0]?.falseClaim ?? `I was at ${locationName(truth, character.claimedLocation)} the whole evening.`;
    case "victim":
      return `I was ${truth.victim.name}'s ${character.relationshipToVictim.toLowerCase()}.`;
    case "notice": {
      const shared = character.knowledge.find((k) => !k.sensitive && k.source !== "witnessed");
      return shared?.fact ?? "Nothing I can put my finger on.";
    }
  }
}

export interface ConfrontResult {
  text: string;
  /** Contradiction ids this evidence proves against this character. */
  contradictionIds: string[];
}

/** Confront a suspect with a piece of evidence. Only evidence that truly breaks a lie has any effect. */
export function confront(truth: CaseTruth, character: Character, evidenceId: string): ConfrontResult {
  const lie = character.lies.find((l) => l.brokenBy.includes(evidenceId));
  if (!lie) return { text: "That doesn't change anything I told you.", contradictionIds: [] };
  const contradictionIds = truth.contradictions
    .filter((c) => c.characterId === character.id && c.revealingEvidenceIds.includes(evidenceId))
    .map((c) => c.id);
  const claimed = locationName(truth, character.claimedLocation);
  if (character.isCulprit) {
    return { text: `All right, I wasn't at ${claimed}. I stepped out. I'm not saying where.`, contradictionIds };
  }
  const secret = character.knowledge.find((k) => k.id === lie.conceals)?.fact;
  return { text: `Fine. I wasn't at ${claimed}. ${secret ?? "It was a private matter."} It has nothing to do with this.`, contradictionIds };
}
