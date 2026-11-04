import { describe, it, expect } from "vitest";
import { solve } from "@/lib/engines/solver";
import type { Clue, PuzzleCase } from "@/lib/schema/puzzle-case";

const suspects = ["marcus", "eleanor", "jonas"];
const methods = ["poison", "blade", "blunt"];
const locations = ["study", "garden", "cellar"];

function basePuzzle(clues: Clue[]) {
  return { suspects, methods, locations, clues };
}

describe("solve", () => {
  it("rejects a puzzle with zero valid solutions (over-constrained)", () => {
    const clues: Clue[] = [
      { kind: "is", axis: "culprit", value: "marcus" },
      { kind: "not", axis: "culprit", value: "marcus" }, // directly contradictory
    ];
    const result = solve(basePuzzle(clues));
    expect(result.solutions).toHaveLength(0);
    expect(result.isUnique).toBe(false);
  });

  it("accepts a puzzle with exactly one solution and matches the intended solution", () => {
    const intended: PuzzleCase["solution"] = {
      culprit: "eleanor",
      method: "poison",
      location: "garden",
      falseAlibi: "eleanor",
    };
    const clues: Clue[] = [
      { kind: "not", axis: "culprit", value: "marcus" },
      { kind: "not", axis: "culprit", value: "jonas" },
      { kind: "linked", axisA: "culprit", valueA: "eleanor", axisB: "method", valueB: "poison" },
      { kind: "not-linked", axisA: "method", valueA: "poison", axisB: "location", valueB: "study" },
      { kind: "not-linked", axisA: "method", valueA: "poison", axisB: "location", valueB: "cellar" },
      { kind: "conditional", ifAxis: "culprit", ifValue: "eleanor", thenAxis: "falseAlibi", thenValue: "eleanor", thenNegated: false },
    ];
    const result = solve(basePuzzle(clues));
    expect(result.isUnique).toBe(true);
    expect(result.solutions[0]).toEqual(intended);
  });

  it("rejects a puzzle with 2+ solutions as ambiguous", () => {
    // No clues at all: culprit/method/location/falseAlibi each free over 3 values -> far more than 2 solutions.
    const result = solve(basePuzzle([]));
    expect(result.isUnique).toBe(false);
    expect(result.solutions.length).toBe(2); // capped, not counted exhaustively
  });

  it("solve()'s type signature cannot accept a privileged `solution` field", () => {
    // @ts-expect-error solve() takes SolvablePuzzle: an object literal with an extra `solution` key fails TypeScript's excess-property check.
    solve({ ...basePuzzle([]), solution: { culprit: "marcus", method: "poison", location: "study", falseAlibi: "marcus" } });
    expect(true).toBe(true);
  });
});
