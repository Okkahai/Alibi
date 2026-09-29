import { describe, it, expect } from "vitest";
import {
  getUtcDateString,
  getDailyCaseId,
  getDailySelection,
  getDailyDayNumber,
  formatDailyShareText,
  DAILY_DIFFICULTY,
} from "@/lib/engines/daily-case";
import { resolveCaseTruth } from "@/lib/state/case-select";
import { generateCase } from "@/lib/engines/case-generator";
import { evaluateAccusation } from "@/lib/engines/evaluation-engine";

describe("daily-case", () => {
  it("derives a UTC date string regardless of local timezone", () => {
    expect(getUtcDateString(new Date("2026-09-29T23:59:00Z"))).toBe("2026-09-29");
    expect(getUtcDateString(new Date("2026-09-29T00:00:00Z"))).toBe("2026-09-29");
  });

  it("gives every call for the same UTC date the same id and selection", () => {
    const a = new Date("2026-09-29T02:00:00Z");
    const b = new Date("2026-09-29T22:00:00Z");
    expect(getDailyCaseId(a)).toBe(getDailyCaseId(b));
    expect(getDailySelection(a)).toEqual(getDailySelection(b));
    expect(getDailySelection(a)).toEqual({ kind: "generated", seed: "2026-09-29", difficulty: DAILY_DIFFICULTY });
  });

  it("resolves to the same CaseTruth the generator already produces for that date's seed", () => {
    const date = new Date("2026-09-29T12:00:00Z");
    const viaSelection = resolveCaseTruth(getDailySelection(date));
    const direct = generateCase({ seed: "2026-09-29", difficulty: DAILY_DIFFICULTY });
    expect(viaSelection).toEqual(direct);
  });

  it("numbers days sequentially from a launch date", () => {
    const launch = new Date("2026-09-29T00:00:00Z");
    expect(getDailyDayNumber(launch, launch)).toBe(1);
    expect(getDailyDayNumber(new Date("2026-10-01T00:00:00Z"), launch)).toBe(3);
  });

  it("formats a spoiler-free emoji share grid", () => {
    const truth = generateCase({ seed: "2026-09-29", difficulty: DAILY_DIFFICULTY });
    const breakdown = evaluateAccusation(truth, {
      culpritId: truth.solution.culpritId,
      motive: truth.solution.motive,
      method: truth.solution.method,
      keyEvidenceIds: [],
      reconstructedTimelineEventIds: [],
    });
    const text = formatDailyShareText(breakdown, new Date("2026-09-29T00:00:00Z"), 1);
    expect(text).toContain("ColdCase AI #1 (2026-09-29)");
    expect(text).toMatch(/^[🟩🟨⬛]{5}/m);
    expect(text).not.toContain(truth.characters[0].name);
  });
});
