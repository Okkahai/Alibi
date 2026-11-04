import { describe, it, expect } from "vitest";
import { generateCase } from "@/lib/engines/narrative-generator";
import { DAILY_DIFFICULTY } from "@/lib/engines/daily-case";

/** Release gate (§22): a full year of dailies generates, and each one's trace confirms the true answer. */
describe("365-day daily window", () => {
  it("every daily from launch generates with a complete clue-only deduction", () => {
    const start = Date.parse("2026-11-01T00:00:00Z");
    for (let d = 0; d < 365; d++) {
      const seed = new Date(start + d * 86_400_000).toISOString().slice(0, 10);
      const truth = generateCase({ seed, difficulty: DAILY_DIFFICULTY });
      const confirmed = Object.fromEntries(truth.deduction.filter((s) => s.kind === "confirm").map((s) => [s.axis, s.value]));
      expect(confirmed.culprit).toBe(truth.solution.culpritId);
      expect(confirmed.location).toBe(truth.solution.locationId);
    }
  });
});
