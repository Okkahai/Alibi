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

  it("damps the most-named-value tells in then and not-both slots", () => {
    // Per axis and slot kind: undamped 0.24, damped ~0.13.
    let tells = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const p = generatePuzzleCase({ seed: `freq-${i}`, suspectCount: 5, minimal: true });
      tells += frequencyTells(p);
    }
    expect(tells / (N * 3)).toBeLessThan(0.18);
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

describe("case titles (dailies from TITLES_FROM)", () => {
  it("keeps published titles and does not repeat a title within three weeks", async () => {
    const { TITLES_FROM } = await import("@/lib/engines/narrative-generator");
    expect(generateCase({ seed: "2026-11-06", difficulty: DAILY_DIFFICULTY }).title).toBe("The Brennan Case");
    const start = Date.parse(`${TITLES_FROM}T00:00:00Z`);
    const titles = Array.from({ length: 21 }, (_, d) =>
      generateCase({ seed: new Date(start + d * 86_400_000).toISOString().slice(0, 10), difficulty: DAILY_DIFFICULTY }).title
    );
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("suspect-clearing wording (dailies from WORDING_FROM)", () => {
  it("uses the wider phrasing set from WORDING_FROM only", async () => {
    const { WORDING_FROM } = await import("@/lib/engines/narrative-generator");
    const fresh = /Whoever the killer was|The inspector is satisfied|struck from the list|Two independent witnesses|checks out\.|told investigators/;
    const day = (from: string, d: number) => new Date(Date.parse(`${from}T00:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);
    const text = (seed: string) => JSON.stringify(generateCase({ seed, difficulty: DAILY_DIFFICULTY }));
    for (let d = 0; d < 6; d++) expect(text(day("2026-11-01", d))).not.toMatch(fresh);
    expect(Array.from({ length: 14 }, (_, d) => text(day(WORDING_FROM, d))).some((t) => fresh.test(t))).toBe(true);
  });
});
