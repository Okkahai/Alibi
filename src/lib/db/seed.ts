/**
 * Seeds the `cases` table from the handcrafted CaseTruth data in
 * src/data/cases. Run with `npm run db:seed`. Idempotent — re-running
 * upserts by case id rather than duplicating rows.
 */
import { getDb } from "./client";
import { cases } from "./schema";
import { sql } from "drizzle-orm";
import { CaseTruthSchema } from "@/lib/schema/case-truth";
import { validateCaseTruth } from "@/lib/engines/case-validators";
import { cases as caseData } from "@/data/cases";

async function seed() {
  const db = getDb();
  for (const truth of Object.values(caseData)) {
    const parsed = CaseTruthSchema.parse(truth); // throws on schema violation
    const result = validateCaseTruth(parsed);
    if (!result.valid) {
      throw new Error(`Refusing to seed invalid case "${parsed.id}": ${JSON.stringify(result.issues, null, 2)}`);
    }

    await db
      .insert(cases)
      .values({ id: parsed.id, seed: parsed.seed, difficulty: parsed.difficulty, truth: parsed })
      .onConflictDoUpdate({
        target: cases.id,
        set: { seed: parsed.seed, difficulty: parsed.difficulty, truth: parsed },
      });
    console.log(`Seeded case: ${parsed.id}`);
  }
  await db.execute(sql`select 1`); // sanity ping
}

seed()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
