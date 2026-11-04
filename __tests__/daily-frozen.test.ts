import { describe, it, expect } from "vitest";
import frozen from "@/data/daily-fingerprints.json";
import { dailyFingerprint } from "@/lib/engines/daily-fingerprint";

/**
 * Published dailies are immutable. If this fails, a generator change altered a
 * day players have already played: gate the change on the seed date instead
 * (see docs/DAILY_SYSTEM.md), never edit the fingerprint.
 */
describe("published dailies are frozen", () => {
  it.each(Object.entries(frozen))("%s is unchanged", (seed, fingerprint) => {
    expect(dailyFingerprint(seed)).toBe(fingerprint);
  });
});
