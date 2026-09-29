import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseTruth } from "@/data/cases";
import { askNpc } from "@/lib/engines/npc-dialogue-engine";
import type { Conversation } from "@/lib/schema/game-state";

const RequestSchema = z.object({
  caseId: z.string(),
  characterId: z.string(),
  playerQuestion: z.string().min(1),
  discoveredEvidenceIds: z.array(z.string()).default([]),
  evidenceShownId: z.string().nullable().default(null),
  conversationTurns: z
    .array(
      z.object({
        id: z.string(),
        speaker: z.enum(["player", "npc"]),
        text: z.string(),
        evidenceShownId: z.string().optional(),
        timestamp: z.string(),
      })
    )
    .default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const truth = getCaseTruth(parsed.data.caseId);
  if (!truth) {
    return NextResponse.json({ error: `Unknown case: ${parsed.data.caseId}` }, { status: 404 });
  }

  const conversation: Conversation | undefined = parsed.data.conversationTurns.length
    ? { characterId: parsed.data.characterId, turns: parsed.data.conversationTurns }
    : undefined;

  try {
    const result = await askNpc({
      truth,
      characterId: parsed.data.characterId,
      conversation,
      discoveredEvidenceIds: parsed.data.discoveredEvidenceIds,
      evidenceShownId: parsed.data.evidenceShownId,
      playerQuestion: parsed.data.playerQuestion,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
