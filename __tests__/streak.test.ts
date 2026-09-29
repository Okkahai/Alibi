import { describe, it, expect } from "vitest";
import { recordDailyPlay, EMPTY_STREAK } from "@/lib/engines/streak";

describe("recordDailyPlay", () => {
  it("starts a streak at 1 on the first play", () => {
    const s = recordDailyPlay(EMPTY_STREAK, "2026-09-29");
    expect(s).toEqual({ current: 1, longest: 1, lastPlayedDate: "2026-09-29" });
  });

  it("extends the streak on a consecutive day", () => {
    const s1 = recordDailyPlay(EMPTY_STREAK, "2026-09-29");
    const s2 = recordDailyPlay(s1, "2026-09-30");
    expect(s2).toEqual({ current: 2, longest: 2, lastPlayedDate: "2026-09-30" });
  });

  it("resets to 1 after a missed day", () => {
    const s1 = recordDailyPlay(EMPTY_STREAK, "2026-09-29");
    const s2 = recordDailyPlay(s1, "2026-10-05");
    expect(s2).toEqual({ current: 1, longest: 1, lastPlayedDate: "2026-10-05" });
  });

  it("is idempotent for a replay on the same day", () => {
    const s1 = recordDailyPlay(EMPTY_STREAK, "2026-09-29");
    const s2 = recordDailyPlay(s1, "2026-09-29");
    expect(s2).toBe(s1);
  });

  it("keeps the longest streak even after it's broken", () => {
    const s1 = recordDailyPlay(EMPTY_STREAK, "2026-09-27");
    const s2 = recordDailyPlay(s1, "2026-09-28");
    const s3 = recordDailyPlay(s2, "2026-09-29");
    const s4 = recordDailyPlay(s3, "2026-10-10");
    expect(s4).toEqual({ current: 1, longest: 3, lastPlayedDate: "2026-10-10" });
  });
});
