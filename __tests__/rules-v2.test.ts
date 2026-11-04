import { describe, it, expect } from "vitest";
import { generateCase, RULES_V2_FROM } from "@/lib/engines/narrative-generator";
import { DAILY_DIFFICULTY } from "@/lib/engines/daily-case";

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

  it("starts on the stated date", () => {
    expect(RULES_V2_FROM > "2026-11-04").toBe(true);
  });
});
