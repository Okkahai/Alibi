import { describe, it, expect } from "vitest";
import { generatePuzzleCase } from "@/lib/engines/puzzle-generator";
import { buildDeductionTrace } from "@/lib/engines/deduction-trace";

describe("deduction trace", () => {
  it("rules out only wrong answers and ends by confirming the true culprit, method and room", () => {
    for (let i = 0; i < 200; i++) {
      const p = generatePuzzleCase({ seed: `trace-${i}`, suspectCount: 3 + (i % 4) });
      const steps = buildDeductionTrace(p);
      const truth = { culprit: p.solution.culprit, method: p.solution.method, location: p.solution.location };
      for (const s of steps) {
        if (s.kind === "eliminate") expect(s.value).not.toBe(truth[s.axis]);
        else expect(s.value).toBe(truth[s.axis]);
      }
      expect(steps.filter((s) => s.kind === "confirm")).toHaveLength(3);
    }
  });
});
