/**
 * Server-side NPC reply cache, keyed off the `cases` table's `dialogueCache`
 * jsonb column. Cost control for daily mode (docs/11-daily-mode.md): every
 * player asking the same question hits this cache instead of the LLM, so
 * spend is roughly flat per case-day, not per player.
 *
 * Best-effort only, by design: no DATABASE_URL, a case that was never
 * persisted to `cases` (e.g. the handcrafted MVP case, played straight from
 * src/data/cases), or any other failure just means "no cache" — the caller
 * falls through to a live askNpc() call exactly as it did before this
 * module existed. A caching failure must never break an actual reply.
 *
 * Known simplification: the key doesn't include prior conversation turns,
 * only (characterId, evidenceShownId, question) — a deliberately coarse
 * cache that covers repeated first-asks of the same question across
 * players, not every possible multi-turn path. A miss just falls through
 * to a live call, so this never produces a wrong reply, only a cache miss.
 */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { cases } from "@/lib/db/schema";
import type { AskNpcResult } from "./npc-dialogue-engine";

type DialogueCache = Record<string, AskNpcResult>;

export function normalizeQuestion(question: string): string {
  return question.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Includes evidenceShownId: confronting an NPC with evidence can change a
 * reply (deny/explain/panic/reveal) even for the same question text, so
 * those must not share a cache entry with a plain, unconfronted ask.
 */
function cacheKey(characterId: string, question: string, evidenceShownId: string | null): string {
  return `${characterId}::${evidenceShownId ?? "-"}::${normalizeQuestion(question)}`;
}

export async function getCachedReply(
  caseId: string,
  characterId: string,
  question: string,
  evidenceShownId: string | null
): Promise<AskNpcResult | null> {
  try {
    const db = getDb();
    const rows = await db.select({ dialogueCache: cases.dialogueCache }).from(cases).where(eq(cases.id, caseId)).limit(1);
    const cache = rows[0]?.dialogueCache as DialogueCache | undefined;
    return cache?.[cacheKey(characterId, question, evidenceShownId)] ?? null;
  } catch {
    return null;
  }
}

/** No-ops if `caseId` has no row in `cases` (nothing to cache into) or on any DB error. */
export async function setCachedReply(
  caseId: string,
  characterId: string,
  question: string,
  evidenceShownId: string | null,
  result: AskNpcResult
): Promise<void> {
  try {
    const db = getDb();
    const rows = await db.select({ dialogueCache: cases.dialogueCache }).from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!rows[0]) return;
    const cache = { ...((rows[0].dialogueCache as DialogueCache) ?? {}) };
    cache[cacheKey(characterId, question, evidenceShownId)] = result;
    await db.update(cases).set({ dialogueCache: cache }).where(eq(cases.id, caseId));
  } catch {
    // best-effort, see module doc comment
  }
}
