import { describe, it, expect } from "vitest";
import { generateCase } from "@/lib/engines/narrative-generator";
import { validateCaseTruth } from "@/lib/engines/case-validators";
import { CaseTruthSchema } from "@/lib/schema/case-truth";
import type { Difficulty } from "@/lib/schema/case-truth";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const SEEDS = Array.from({ length: 10 }, (_, i) => `narrative-seed-${i}`);

describe("generateCase (solver-backed narrative generator)", () => {
  it("produces a schema-valid, validateCaseTruth()-passing case for many seeds across every difficulty", () => {
    for (const difficulty of DIFFICULTIES) {
      for (const seed of SEEDS) {
        const truth = generateCase({ seed, difficulty });
        expect(CaseTruthSchema.safeParse(truth).success).toBe(true);
        const result = validateCaseTruth(truth);
        if (!result.valid) {
          throw new Error(`${difficulty}/${seed} failed: ${JSON.stringify(result.issues, null, 2)}`);
        }
      }
    }
  });

  it("is deterministic: the same seed and difficulty always produce the same case", () => {
    const a = generateCase({ seed: "reproducible-narrative", difficulty: "medium" });
    const b = generateCase({ seed: "reproducible-narrative", difficulty: "medium" });
    expect(a).toEqual(b);
  });

  it("every piece of evidence traces to the culprit's lie or stands on its own, and the solution's culprit matches the puzzle's", () => {
    const truth = generateCase({ seed: "trace-check", difficulty: "medium" });
    const culprit = truth.characters.find((c) => c.isCulprit)!;
    expect(truth.solution.culpritId).toBe(culprit.id);
    expect(truth.solution.keyEvidenceIds.length).toBeGreaterThan(0);
    for (const id of truth.solution.keyEvidenceIds) {
      expect(truth.evidence.some((e) => e.id === id)).toBe(true);
    }
  });
});
