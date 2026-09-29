import { describe, it, expect } from "vitest";
import { theVossManorCase } from "@/data/cases/the-voss-manor-case";
import { evaluateAccusation } from "@/lib/engines/evaluation-engine";
import type { Accusation } from "@/lib/schema/game-state";

describe("evaluateAccusation", () => {
  it("scores a perfect accusation at 100%", () => {
    const accusation: Accusation = {
      culpritId: theVossManorCase.solution.culpritId,
      motive: theVossManorCase.solution.motive,
      method: theVossManorCase.solution.method,
      keyEvidenceIds: theVossManorCase.solution.keyEvidenceIds,
      reconstructedTimelineEventIds: theVossManorCase.solution.criticalTimelineEventIds,
    };
    const score = evaluateAccusation(theVossManorCase, accusation);
    expect(score.culprit.correct).toBe(true);
    expect(score.percentage).toBe(100);
  });

  it("scores a wrong culprit as zero culprit points and low overall score", () => {
    const accusation: Accusation = {
      culpritId: "char_eleanor",
      motive: "She wanted the inheritance",
      method: "Poisoned the brandy",
      keyEvidenceIds: [],
      reconstructedTimelineEventIds: [],
    };
    const score = evaluateAccusation(theVossManorCase, accusation);
    expect(score.culprit.correct).toBe(false);
    expect(score.culprit.points).toBe(0);
    expect(score.percentage).toBeLessThan(50);
  });

  it("gives partial credit for partially matched key evidence", () => {
    const accusation: Accusation = {
      culpritId: theVossManorCase.solution.culpritId,
      motive: theVossManorCase.solution.motive,
      method: theVossManorCase.solution.method,
      keyEvidenceIds: [theVossManorCase.solution.keyEvidenceIds[0]],
      reconstructedTimelineEventIds: [],
    };
    const score = evaluateAccusation(theVossManorCase, accusation);
    expect(score.keyEvidence.points).toBeGreaterThan(0);
    expect(score.keyEvidence.points).toBeLessThan(20);
  });
});
