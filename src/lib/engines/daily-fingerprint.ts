import { createHash } from "node:crypto";
import { generateCase } from "@/lib/engines/narrative-generator";
import { DAILY_DIFFICULTY } from "@/lib/engines/daily-case";

/** Content hash of a daily case as players receive it; a published day must never change (§8 step 9). */
export function dailyFingerprint(seed: string): string {
  return createHash("sha256").update(JSON.stringify(generateCase({ seed, difficulty: DAILY_DIFFICULTY }))).digest("hex").slice(0, 16);
}
