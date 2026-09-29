/**
 * Player-facing, persistent game state. This is what gets saved/resumed —
 * distinct from CaseTruth, which is never sent to the client wholesale.
 */
import { z } from "zod";

export const DialogueTurnSchema = z.object({
  id: z.string(),
  speaker: z.enum(["player", "npc"]),
  text: z.string(),
  /** Evidence id shown alongside this turn, if the player confronted the NPC with something. */
  evidenceShownId: z.string().optional(),
  timestamp: z.string(),
});
export type DialogueTurn = z.infer<typeof DialogueTurnSchema>;

export const ConversationSchema = z.object({
  characterId: z.string(),
  turns: z.array(DialogueTurnSchema).default([]),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const BoardNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(["suspect", "evidence", "location", "event", "note"]),
  refId: z.string().optional().describe("Id into CaseTruth for suspect/evidence/location/event kinds."),
  text: z.string().optional().describe("Free text, for note kind."),
  x: z.number(),
  y: z.number(),
});
export type BoardNode = z.infer<typeof BoardNodeSchema>;

export const BoardConnectionSchema = z.object({
  id: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  label: z.string().optional(),
});
export type BoardConnection = z.infer<typeof BoardConnectionSchema>;

export const AccusationSchema = z.object({
  culpritId: z.string(),
  motive: z.string(),
  method: z.string(),
  keyEvidenceIds: z.array(z.string()),
  reconstructedTimelineEventIds: z.array(z.string()),
});
export type Accusation = z.infer<typeof AccusationSchema>;

export const GameStateSchema = z.object({
  caseId: z.string(),
  seed: z.string(),
  discoveredEvidenceIds: z.array(z.string()).default([]),
  visitedLocationIds: z.array(z.string()).default([]),
  conversations: z.array(ConversationSchema).default([]),
  boardNodes: z.array(BoardNodeSchema).default([]),
  boardConnections: z.array(BoardConnectionSchema).default([]),
  playerNotes: z.string().default(""),
  /** Evidence examined + questions asked + accusation attempts. Daily mode caps this; free play ignores the cap. */
  movesUsed: z.number().default(0),
  /** Contradictions the player has proven by confronting a suspect with the right evidence. */
  foundContradictionIds: z.array(z.string()).default([]),
  accusation: AccusationSchema.nullable().default(null),
  status: z.enum(["in_progress", "accused", "resolved"]).default("in_progress"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GameState = z.infer<typeof GameStateSchema>;
