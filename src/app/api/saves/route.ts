import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { gameSaves } from "@/lib/db/schema";
import { GameStateSchema } from "@/lib/schema/game-state";

/**
 * Server-side save persistence, additive to the localStorage save system
 * (src/lib/state/game-context.tsx). A client with DATABASE_URL-backed API
 * access gets multi-device resume; one without it still works entirely
 * from localStorage. Neither path is required for the other to function.
 */

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get("caseId");
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!caseId || !playerId) {
    return NextResponse.json({ error: "caseId and playerId are required" }, { status: 400 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(gameSaves)
      .where(and(eq(gameSaves.caseId, caseId), eq(gameSaves.playerId, playerId)))
      .orderBy(gameSaves.updatedAt)
      .limit(1);
    const row = rows.at(-1);
    if (!row) return NextResponse.json({ save: null });
    return NextResponse.json({ save: row.state });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const playerId = body.playerId;
  if (typeof playerId !== "string" || !playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }
  const parsed = GameStateSchema.safeParse(body.state);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = await db
      .select({ id: gameSaves.id })
      .from(gameSaves)
      .where(and(eq(gameSaves.caseId, parsed.data.caseId), eq(gameSaves.playerId, playerId)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(gameSaves)
        .set({ state: parsed.data, updatedAt: new Date() })
        .where(eq(gameSaves.id, existing[0].id));
    } else {
      await db.insert(gameSaves).values({ caseId: parsed.data.caseId, playerId, state: parsed.data });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 503 });
  }
}
