/**
 * The Case Truth schema — the single, immutable source of fact for a case.
 * Nothing outside this file's shape may define "what happened." The LLM
 * never writes to it; it only ever reads filtered slices of it.
 */
import { z } from "zod";

export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  connectedTo: z.array(z.string()).default([]),
});
export type Location = z.infer<typeof LocationSchema>;

export const CharacterRoleSchema = z.enum(["victim", "suspect", "witness"]);

/** A single fact a character holds. Facts are atomic and traceable to timeline events. */
export const KnowledgeItemSchema = z.object({
  id: z.string(),
  /** The true fact, stated plainly, e.g. "Marcus argued with the victim at 22:10." */
  fact: z.string(),
  /** Timeline event id(s) this knowledge derives from, if any. */
  relatedEvents: z.array(z.string()).default([]),
  /** Whether the character learned this first-hand or was told. */
  source: z.enum(["witnessed", "told", "inferred", "physical_evidence"]),
  /** True facts the character is unwilling to volunteer without pressure/evidence. */
  sensitive: z.boolean().default(false),
});
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;

/** A lie a character will tell — the false claim, the true fact it replaces, and what breaks it. */
export const LieSchema = z.object({
  id: z.string(),
  /** The false claim the character states when asked. */
  falseClaim: z.string(),
  /** The true fact being concealed (must reference a knowledge item or timeline event id). */
  conceals: z.string(),
  /** Evidence ids that, if shown, should break this lie. */
  brokenBy: z.array(z.string()).default([]),
  /** What the character does once confronted with a breaking piece of evidence. */
  fallback: z.enum(["deny", "explain", "panic", "change_story", "reveal_information"]),
});
export type Lie = z.infer<typeof LieSchema>;

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: CharacterRoleSchema,
  relationshipToVictim: z.string(),
  actualLocation: z.string().describe("Location id where the character truly was at time of crime."),
  claimedLocation: z.string().describe("Location id the character will initially claim."),
  personality: z.string(),
  /** Every fact this character may draw on. The LLM may never state a fact absent from this list. */
  knowledge: z.array(KnowledgeItemSchema),
  /** Facts this character explicitly does NOT know, for disambiguation in prompts/tests. */
  doesNotKnow: z.array(z.string()).default([]),
  lies: z.array(LieSchema).default([]),
  isCulprit: z.boolean().default(false),
  stress: z.number().min(0).max(1).default(0.2),
  trust: z.number().min(0).max(1).default(0.5),
});
export type Character = z.infer<typeof CharacterSchema>;

export const TimelineEventSchema = z.object({
  id: z.string(),
  time: z.string().describe("24h HH:MM"),
  description: z.string(),
  locationId: z.string(),
  involvedCharacterIds: z.array(z.string()).default([]),
  /** true = this actually happened; contradicting claims are what the player must catch. */
  isTrue: z.literal(true).default(true),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const EvidenceTypeSchema = z.enum([
  "photograph",
  "document",
  "message",
  "email",
  "receipt",
  "fingerprint",
  "object",
  "security_log",
  "medical_report",
  "phone_record",
  "witness_statement",
]);

export const EvidenceSchema = z.object({
  id: z.string(),
  type: EvidenceTypeSchema,
  description: z.string(),
  locationId: z.string(),
  discoveryRequirements: z.array(z.string()).default([]).describe("Ids of prerequisite evidence/knowledge, if any."),
  relatedCharacterIds: z.array(z.string()).default([]),
  /** Every evidence item must trace to at least one real timeline event. Enforced by validator. */
  relatedEventIds: z.array(z.string()).min(1),
  reliability: z.enum(["reliable", "circumstantial", "misleading"]),
  /** The true meaning, kept hidden from the player until context makes it discoverable. */
  hiddenInterpretation: z.string(),
  /** Whether this evidence is a deliberate red herring (misleading but not fabricated). */
  isRedHerring: z.boolean().default(false),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ContradictionSchema = z.object({
  id: z.string(),
  description: z.string(),
  /** The character(s) whose claim conflicts with truth. */
  characterId: z.string(),
  /** The false claim (usually a lie id or claimedLocation) vs. the true fact (timeline/evidence id). */
  claim: z.string(),
  truth: z.string(),
  revealingEvidenceIds: z.array(z.string()).min(1),
});
export type Contradiction = z.infer<typeof ContradictionSchema>;

export const SolutionSchema = z.object({
  culpritId: z.string(),
  motive: z.string(),
  method: z.string(),
  keyEvidenceIds: z.array(z.string()).min(1),
  /** Ordered timeline event ids that constitute the minimal correct reconstruction. */
  criticalTimelineEventIds: z.array(z.string()).min(1),
});
export type Solution = z.infer<typeof SolutionSchema>;

export const CaseTruthSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: DifficultySchema,
  seed: z.string(),
  victim: z.object({
    name: z.string(),
    description: z.string(),
  }),
  locations: z.array(LocationSchema).min(1),
  characters: z.array(CharacterSchema).min(1),
  timeline: z.array(TimelineEventSchema).min(1),
  evidence: z.array(EvidenceSchema).min(1),
  contradictions: z.array(ContradictionSchema).default([]),
  solution: SolutionSchema,
});
export type CaseTruth = z.infer<typeof CaseTruthSchema>;
