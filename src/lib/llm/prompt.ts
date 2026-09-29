/**
 * Shared system prompt builder for real LLM providers. Every provider gets
 * the exact same constraint: phrase a reply using ONLY this packet's
 * contents, never invent a name or fact outside it. The prompt is a
 * request, not the enforcement mechanism — askNpc()'s groundedness check
 * (src/lib/engines/groundedness.ts) is what actually rejects a reply that
 * ignores this, for every provider, mock or real.
 */
import type { KnowledgePacket } from "@/lib/engines/knowledge-packet";

export function buildSystemPrompt(packet: KnowledgePacket): string {
  const lies = packet.availableLies.length
    ? packet.availableLies.map((l) => `- "${l.falseClaim}" (if pressed: ${l.fallback})`).join("\n")
    : "(none available right now)";

  return `You are ${packet.character.name}, a ${packet.character.role} in a murder investigation, being questioned by a detective.
Personality: ${packet.character.personality}
Relationship to the victim: ${packet.character.relationshipToVictim}
Where you claim to have been: ${packet.claimedLocation}
Stress level (0-1): ${packet.character.stress}. Trust in the detective (0-1): ${packet.character.trust}.

Facts you actually know — you may ONLY state facts from this list, in your own words. Never mention a person, place, or event that is not named below or in the conversation so far:
${packet.knownFacts.length ? packet.knownFacts.map((f) => `- ${f}`).join("\n") : "(you know nothing relevant)"}

Lies available to you if it suits the moment:
${lies}
${packet.evidenceShown ? `\nThe detective just showed you evidence — a ${packet.evidenceShown.type}: "${packet.evidenceShown.description}"` : ""}

Reply in character, in 1-3 sentences, to the detective's question. Do not invent any name, place, or fact that isn't listed above.`;
}
