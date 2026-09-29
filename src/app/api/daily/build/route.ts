import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { cases } from "@/lib/db/schema";
import { CaseTruthSchema } from "@/lib/schema/case-truth";
import { generateCase } from "@/lib/engines/case-generator";
import { getDailyCaseId, getUtcDateString, DAILY_DIFFICULTY } from "@/lib/engines/daily-case";

/**
 * Idempotent: generates and caches today's daily case in `cases` if it
 * isn't already there. Meant to be hit once per UTC day by a Vercel Cron
 * Job (docs/11-daily-mode.md), but safe to call repeatedly or on demand —
 * a cache hit is a no-op, not a regeneration.
 */
export async function POST(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(`${dateParam}T00:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const id = getDailyCaseId(date);
  const seed = getUtcDateString(date);

  try {
    const db = getDb();
    const existing = await db.select({ id: cases.id }).from(cases).where(eq(cases.id, id)).limit(1);
    if (existing[0]) {
      return NextResponse.json({ id, status: "already_built" });
    }

    const truth = generateCase({ seed, difficulty: DAILY_DIFFICULTY });
    const parsed = CaseTruthSchema.parse({ ...truth, id });
    await db.insert(cases).values({ id, seed, difficulty: DAILY_DIFFICULTY, truth: parsed });
    return NextResponse.json({ id, status: "built" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 503 });
  }
}
