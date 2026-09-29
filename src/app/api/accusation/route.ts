import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseTruth } from "@/data/cases";
import { generateCase } from "@/lib/engines/case-generator";
import { DifficultySchema } from "@/lib/schema/case-truth";
import { evaluateAccusation, buildCaseReveal } from "@/lib/engines/evaluation-engine";

const RequestSchema = z.object({
  caseId: z.string(),
  /** Only needed when caseId isn't one of the handcrafted src/data/cases — see src/app/api/npc/ask/route.ts. */
  seed: z.string().optional(),
  difficulty: DifficultySchema.optional(),
  culpritId: z.string(),
  motive: z.string(),
  method: z.string(),
  keyEvidenceIds: z.array(z.string()).default([]),
  reconstructedTimelineEventIds: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const truth =
    getCaseTruth(parsed.data.caseId) ??
    (parsed.data.seed && parsed.data.difficulty
      ? generateCase({ seed: parsed.data.seed, difficulty: parsed.data.difficulty })
      : undefined);
  if (!truth) {
    return NextResponse.json({ error: `Unknown case: ${parsed.data.caseId}` }, { status: 404 });
  }

  const score = evaluateAccusation(truth, parsed.data);
  const reveal = buildCaseReveal(truth);
  return NextResponse.json({ score, reveal });
}
