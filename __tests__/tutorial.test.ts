import { describe, it, expect } from "vitest";
import { TUTORIAL_STEPS, TUTORIAL_BLOCK, tutorialMistake } from "@/lib/state/tutorial";
import { setMark, isComplete, type Cells } from "@/lib/state/matrix";

describe("tutorial", () => {
  it("can be completed by following each lesson, ending on a solved grid", () => {
    let cells: Cells = {};
    const x = (p: string, r: string) => (cells = setMark(cells, TUTORIAL_BLOCK, p, r, "x", false));
    for (const r of ["library", "study", "cellar"]) x("ada", r);
    expect(TUTORIAL_STEPS[1].done(cells)).toBe(true);
    for (const p of ["bram", "cora"]) x(p, "cellar");
    expect(TUTORIAL_STEPS[2].done(cells)).toBe(true);
    x("bram", "library");
    expect(TUTORIAL_STEPS[3].done(cells)).toBe(true);
    x("bram", "study");
    expect(TUTORIAL_STEPS[4].done(cells)).toBe(true);
    x("cora", "study");
    expect(isComplete(cells, [TUTORIAL_BLOCK])).toBe(false);
    cells = setMark(cells, TUTORIAL_BLOCK, "cora", "library", "o", false);
    expect(TUTORIAL_STEPS[5].done(cells)).toBe(true);
    expect(isComplete(cells, [TUTORIAL_BLOCK])).toBe(true);
    expect(tutorialMistake(cells)).toBe(false);
  });

  it("flags a ✓ on the wrong cell", () => {
    expect(tutorialMistake(setMark({}, TUTORIAL_BLOCK, "ada", "study", "o", false))).toBe(true);
  });
});
