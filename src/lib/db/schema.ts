/**
 * Drizzle schema for persistence. CaseTruth itself is stored as a validated
 * JSON blob (its shape is owned by src/lib/schema/case-truth.ts, not by
 * migrations) so the game truth and its Zod contract never drift apart.
 */
import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const cases = pgTable("cases", {
  id: text("id").primaryKey(),
  seed: text("seed").notNull(),
  difficulty: text("difficulty").notNull(),
  truth: jsonb("truth").notNull(), // validated CaseTruth JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameSaves = pgTable("game_saves", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id),
  playerId: text("player_id").notNull(),
  state: jsonb("state").notNull(), // validated GameState JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
