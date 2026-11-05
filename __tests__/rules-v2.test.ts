import { describe, it, expect } from "vitest";
import { generateCase, RULES_V2_FROM } from "@/lib/engines/narrative-generator";
import { DAILY_DIFFICULTY } from "@/lib/engines/daily-case";
import { frequencyTells, generatePuzzleCase, namesGiveAnswerAway } from "@/lib/engines/puzzle-generator";

describe("rules v2 (dailies from RULES_V2_FROM, all practice seeds)", () => {
  const cases = Array.from({ length: 60 }, (_, i) => generateCase({ seed: i % 2 ? `practice-${i}` : `2027-02-${String(1 + (i % 28)).padStart(2, "0")}`, difficulty: DAILY_DIFFICULTY }));

  it("never repeats a first or last name within a case", () => {
    for (const t of cases) {
      const names = t.characters.map((c) => c.name.split(" "));
      expect(new Set(names.map((n) => n[0])).size).toBe(names.length);
      expect(new Set(names.map((n) => n.at(-1))).size).toBe(names.length);
    }
  });

  it("keeps no redundant clue and never states an answer outright", () => {
    for (const t of cases) {
      const cited = new Set(t.deduction.flatMap((s) => s.evidenceIds));
      expect(t.evidence.every((e) => cited.has(e.id))).toBe(true);
      expect(t.evidence.some((e) => /^The (culprit|killer|location|method[^,]*) is /.test(e.description))).toBe(false);
    }
  });

  it("never lets who-gets-named in if/either exhibits give an answer away", () => {
    for (const n of [3, 5, 7]) {
      for (let i = 0; i < 100; i++) {
        expect(namesGiveAnswerAway(generatePuzzleCase({ seed: `names-${n}-${i}`, suspectCount: n, minimal: true }))).toBe(false);
      }
    }
  });

  it("keeps the most-named value in then-slots near chance", () => {
    // Undamped this ran at 0.17 (the answer led then-slots ~1.6x chance); damped it is ~0.08.
    let tells = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const p = generatePuzzleCase({ seed: `freq-${i}`, suspectCount: 5, minimal: true });
      tells += frequencyTells(p.clues, p.solution);
    }
    expect(tells / (N * 3)).toBeLessThan(0.12);
  });

  it("takes key exhibits from the steps that settle the culprit", () => {
    for (const t of cases) {
      const culpritSteps = new Set(t.deduction.filter((s) => s.axis === "culprit").flatMap((s) => s.evidenceIds));
      expect(t.solution.keyEvidenceIds.length).toBeGreaterThan(0);
      expect(t.solution.keyEvidenceIds.every((id) => culpritSteps.has(id))).toBe(true);
    }
  });

  it("starts on the stated date", () => {
    expect(RULES_V2_FROM > "2026-11-04").toBe(true);
  });
});
