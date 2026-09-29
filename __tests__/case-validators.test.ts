import { describe, it, expect } from "vitest";
import { CaseTruthSchema } from "@/lib/schema/case-truth";
import { validateCaseTruth } from "@/lib/engines/case-validators";
import { theVossManorCase } from "@/data/cases/the-voss-manor-case";

describe("the-voss-manor-case", () => {
  it("conforms to the CaseTruth schema", () => {
    const parsed = CaseTruthSchema.safeParse(theVossManorCase);
    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.format(), null, 2));
    }
    expect(parsed.success).toBe(true);
  });

  it("passes all deterministic solvability/consistency validators", () => {
    const result = validateCaseTruth(theVossManorCase);
    if (!result.valid) {
      throw new Error(JSON.stringify(result.issues, null, 2));
    }
    expect(result.valid).toBe(true);
  });

  it("has exactly one culprit flagged, matching the solution", () => {
    const culprits = theVossManorCase.characters.filter((c) => c.isCulprit);
    expect(culprits).toHaveLength(1);
    expect(culprits[0].id).toBe(theVossManorCase.solution.culpritId);
  });
});

describe("validateCaseTruth", () => {
  it("rejects a case with two culprits", () => {
    const broken = structuredClone(theVossManorCase);
    broken.characters[0].isCulprit = true; // Eleanor also flagged as culprit
    const result = validateCaseTruth(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.rule === "single-culprit")).toBe(true);
  });

  it("rejects evidence that doesn't trace to any real timeline event", () => {
    const broken = structuredClone(theVossManorCase);
    broken.evidence[0].relatedEventIds = ["evt_does_not_exist"];
    const result = validateCaseTruth(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.rule === "evidence-traces-to-event")).toBe(true);
  });

  it("rejects a case where no reliable evidence implicates the culprit", () => {
    const broken = structuredClone(theVossManorCase);
    for (const e of broken.evidence) {
      if (e.relatedCharacterIds.includes("char_marcus")) {
        e.reliability = "misleading";
      }
    }
    const result = validateCaseTruth(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.rule === "solvable-implicating-evidence")).toBe(true);
  });

  it("rejects a knowledge item referencing a nonexistent event", () => {
    const broken = structuredClone(theVossManorCase);
    broken.characters[0].knowledge[0].relatedEvents = ["evt_fake"];
    const result = validateCaseTruth(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.rule === "knowledge-subset-of-truth")).toBe(true);
  });
});
