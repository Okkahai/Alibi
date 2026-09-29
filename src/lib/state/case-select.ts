import type { CaseTruth, Difficulty } from "@/lib/schema/case-truth";
import { generateCase } from "@/lib/engines/case-generator";
import { getCaseTruth } from "@/data/cases";

export type CaseSelection = { kind: "static"; id: string } | { kind: "generated"; seed: string; difficulty: Difficulty };

export const CASE_SELECTION_KEY = "coldcase:selectedCase";

export function resolveCaseTruth(selection: CaseSelection): CaseTruth {
  if (selection.kind === "static") {
    const truth = getCaseTruth(selection.id);
    if (!truth) throw new Error(`Unknown case id: ${selection.id}`);
    return truth;
  }
  return generateCase({ seed: selection.seed, difficulty: selection.difficulty });
}
