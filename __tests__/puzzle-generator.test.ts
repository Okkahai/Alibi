import { describe, it, expect } from "vitest";
import { generatePuzzleCase } from "@/lib/engines/puzzle-generator";
import { solve } from "@/lib/engines/solver";

describe("generatePuzzleCase", () => {
  it("produces a uniquely solvable puzzle, from clues alone, across many seeds and suspect counts", () => {
    for (const suspectCount of [3, 4, 6, 8]) {
      for (let i = 0; i < 25; i++) {
        const seed = `puzzle-${suspectCount}-${i}`;
        const puzzle = generatePuzzleCase({ seed, suspectCount });
        const result = solve({
          suspects: puzzle.suspects,
          methods: puzzle.methods,
          locations: puzzle.locations,
          clues: puzzle.clues,
        });
        expect(result.isUnique).toBe(true);
        expect(result.solutions[0]).toEqual(puzzle.solution);
      }
    }
  });

  it("is deterministic: the same seed always produces the same puzzle", () => {
    const a = generatePuzzleCase({ seed: "repro", suspectCount: 5 });
    const b = generatePuzzleCase({ seed: "repro", suspectCount: 5 });
    expect(a).toEqual(b);
  });
});
