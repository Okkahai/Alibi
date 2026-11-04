/**
 * Records the fingerprint of every daily from launch through today (UTC).
 * Existing entries are never rewritten: __tests__/daily-frozen.test.ts then
 * fails if a generator change alters a day that players have already seen.
 * Run: npx tsx scripts/freeze-dailies.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { DAILY_LAUNCH_DATE, getUtcDateString } from "@/lib/engines/daily-case";
import { dailyFingerprint } from "@/lib/engines/daily-fingerprint";

const file = "src/data/daily-fingerprints.json";
const frozen: Record<string, string> = JSON.parse(readFileSync(file, "utf8"));
const today = getUtcDateString(new Date());
for (let t = DAILY_LAUNCH_DATE.getTime(); getUtcDateString(new Date(t)) <= today; t += 86_400_000) {
  const seed = getUtcDateString(new Date(t));
  frozen[seed] ??= dailyFingerprint(seed);
}
writeFileSync(file, JSON.stringify(frozen, null, 2) + "\n");
console.log(`${Object.keys(frozen).length} published dailies frozen through ${today}`);
