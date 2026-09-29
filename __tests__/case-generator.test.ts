import { describe, it, expect } from "vitest";
import { generateCase } from "@/lib/engines/case-generator";
import { validateCaseTruth } from "@/lib/engines/case-validators";
import { CaseTruthSchema } from "@/lib/schema/case-truth";
import type { Difficulty } from "@/lib/schema/case-truth";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const SEEDS = Array.from({ length: 15 }, (_, i) => `test-seed-${i}`);

describe("generateCase", () => {
  it("produces a schema-valid, solvable case for many seeds across every difficulty", () => {
    for (const difficulty of DIFFICULTIES) {
      for (const seed of SEEDS) {
        const truth = generateCase({ seed, difficulty });

        expect(CaseTruthSchema.safeParse(truth).success).toBe(true);

        const result = validateCaseTruth(truth);
        if (!result.valid) {
          throw new Error(`${difficulty}/${seed} failed: ${JSON.stringify(result.issues, null, 2)}`);
        }
        expect(result.valid).toBe(true);
      }
    }
  });

  it("is deterministic: the same seed and difficulty always produce the same case", () => {
    const a = generateCase({ seed: "reproducible-seed", difficulty: "medium" });
    const b = generateCase({ seed: "reproducible-seed", difficulty: "medium" });
    expect(a).toEqual(b);
  });

  it("different seeds produce different cases", () => {
    const a = generateCase({ seed: "seed-a", difficulty: "medium" });
    const b = generateCase({ seed: "seed-b", difficulty: "medium" });
    expect(a.victim.name === b.victim.name && a.solution.culpritId === b.solution.culpritId).toBe(false);
  });

  it("respects difficulty suspect-count bounds", () => {
    for (const seed of SEEDS) {
      const easy = generateCase({ seed, difficulty: "easy" });
      expect(easy.characters).toHaveLength(3);

      const medium = generateCase({ seed, difficulty: "medium" });
      expect(medium.characters.length).toBeGreaterThanOrEqual(4);
      expect(medium.characters.length).toBeLessThanOrEqual(6);

      const hard = generateCase({ seed, difficulty: "hard" });
      expect(hard.characters.length).toBeGreaterThanOrEqual(6);
      expect(hard.characters.length).toBeLessThanOrEqual(8);
    }
  });

  it("always flags exactly one culprit matching the solution", () => {
    const truth = generateCase({ seed: "culprit-check", difficulty: "hard" });
    const culprits = truth.characters.filter((c) => c.isCulprit);
    expect(culprits).toHaveLength(1);
    expect(culprits[0].id).toBe(truth.solution.culpritId);
  });
});
