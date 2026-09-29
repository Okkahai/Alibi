/**
 * Deterministic post-check on NPC dialogue output. The LLM only phrases
 * replies from a KnowledgePacket; this check rejects replies that mention
 * named entities (other characters, locations) absent from that packet,
 * catching hallucinated facts before they reach the player.
 *
 * This is a safety net, not a substitute for the packet filter in
 * knowledge-packet.ts — it cannot verify *claims*, only *named entities*.
 */
import type { CaseTruth } from "@/lib/schema/case-truth";
import type { KnowledgePacket } from "./knowledge-packet";

export interface GroundednessResult {
  ok: boolean;
  violations: string[];
}

/** Collect every case-truth proper noun the packet legitimately grants access to. */
function allowedEntityNames(truth: CaseTruth, packet: KnowledgePacket): Set<string> {
  const allowed = new Set<string>();
  allowed.add(packet.character.name);
  allowed.add(truth.victim.name);
  allowed.add(packet.claimedLocation);

  const textBlobs = [
    ...packet.knownFacts,
    ...packet.availableLies.map((l) => l.falseClaim),
    ...packet.conversationHistory.map((t) => t.text),
    packet.evidenceShown?.description ?? "",
  ].join(" \n ");

  for (const c of truth.characters) {
    if (textBlobs.includes(c.name)) allowed.add(c.name);
  }
  for (const l of truth.locations) {
    if (textBlobs.includes(l.name)) allowed.add(l.name);
  }
  return allowed;
}

/** All case-truth proper nouns NOT in the allowed set — these must never appear verbatim in a reply. */
function forbiddenEntityNames(truth: CaseTruth, allowed: Set<string>): string[] {
  const names = new Set<string>();
  for (const c of truth.characters) names.add(c.name);
  for (const l of truth.locations) names.add(l.name);
  names.delete(truth.victim.name); // victim's name is always safe to mention
  for (const name of allowed) names.delete(name);
  return [...names];
}

export function checkGroundedness(truth: CaseTruth, packet: KnowledgePacket, reply: string): GroundednessResult {
  const allowed = allowedEntityNames(truth, packet);
  const forbidden = forbiddenEntityNames(truth, allowed);
  const violations = forbidden.filter((name) => reply.includes(name));
  return { ok: violations.length === 0, violations };
}
