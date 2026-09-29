/**
 * NPC Dialogue Engine: the only place player questions become NPC replies.
 * Orchestrates KnowledgePacket -> LlmProvider -> groundedness check. The
 * LLM output is advisory phrasing; this engine is authoritative over
 * whether a reply is allowed to reach the player.
 */
import type { CaseTruth } from "@/lib/schema/case-truth";
import type { Conversation } from "@/lib/schema/game-state";
import { buildKnowledgePacket } from "./knowledge-packet";
import { checkGroundedness } from "./groundedness";
import { getLlmProvider } from "@/lib/llm/provider";

export interface AskNpcParams {
  truth: CaseTruth;
  characterId: string;
  conversation: Conversation | undefined;
  discoveredEvidenceIds: string[];
  evidenceShownId: string | null;
  playerQuestion: string;
}

export interface AskNpcResult {
  text: string;
  liedUsing?: string;
  rejected: boolean;
  rejectionReason?: string;
}

const FALLBACK_REPLY = "I'd rather not say anything more about that right now.";

export async function askNpc(params: AskNpcParams): Promise<AskNpcResult> {
  const packet = buildKnowledgePacket(
    params.truth,
    params.characterId,
    params.conversation,
    params.discoveredEvidenceIds,
    params.evidenceShownId
  );

  const provider = getLlmProvider();
  const result = await provider.generateNpcReply({ packet, playerQuestion: params.playerQuestion });

  const check = checkGroundedness(params.truth, packet, result.text);
  if (!check.ok) {
    // The provider named an entity outside its knowledge packet — refuse the
    // reply rather than let a hallucinated fact reach the player.
    return {
      text: FALLBACK_REPLY,
      rejected: true,
      rejectionReason: `Groundedness check failed: mentioned ${check.violations.join(", ")}`,
    };
  }

  return { text: result.text, liedUsing: result.liedUsing, rejected: false };
}
