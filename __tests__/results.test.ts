import { describe, it, expect } from "vitest";
import { dailyStats, type DailyResults } from "@/lib/state/results";

const r = (seed: string, pct: number, culprit = true, playedOn = seed) => [seed, { percentage: pct, culpritCorrect: culprit, playedOn }] as const;

describe("dailyStats", () => {
  it("is empty with no results", () => {
    expect(dailyStats({}, "2026-11-10")).toEqual({ played: 0, solved: 0, average: null, streak: 0, longest: 0 });
  });

  it("counts runs of same-day finds; late archive finds count as played but not toward streaks", () => {
    const results: DailyResults = Object.fromEntries([
      r("2026-11-01", 80),
      r("2026-11-02", 60, false),
      r("2026-11-03", 100, true, "2026-11-09"), // filed late from the archive
      r("2026-11-07", 90),
      r("2026-11-08", 70),
      r("2026-11-09", 50),
    ]);
    const s = dailyStats(results, "2026-11-10");
    expect(s.played).toBe(6);
    expect(s.solved).toBe(5);
    expect(s.average).toBe(75);
    expect(s.streak).toBe(3); // 07, 08, 09 — still alive on the 10th until today's case is missed
    expect(s.longest).toBe(3);
  });

  it("breaks the current streak after a missed day", () => {
    const s = dailyStats(Object.fromEntries([r("2026-11-07", 90), r("2026-11-08", 70)]), "2026-11-10");
    expect(s.streak).toBe(0);
    expect(s.longest).toBe(2);
  });
});
