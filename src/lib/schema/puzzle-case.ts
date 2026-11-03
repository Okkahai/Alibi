/**
 * The logic-puzzle layer, separate from the narrative CaseTruth
 * (case-truth.ts). See docs/PUZZLE_MODEL.md for the design rationale:
 * this is what the solver proves unique, CaseTruth is content built from
 * a solved PuzzleCase.
 */
import { z } from "zod";

export const AxisSchema = z.enum(["culprit", "method", "location", "falseAlibi"]);
export type Axis = z.infer<typeof AxisSchema>;

export const ClueSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("not"), axis: AxisSchema, value: z.string() }),
  z.object({ kind: z.literal("is"), axis: AxisSchema, value: z.string() }),
  z.object({
    kind: z.literal("linked"),
    axisA: AxisSchema,
    valueA: z.string(),
    axisB: AxisSchema,
    valueB: z.string(),
  }),
  z.object({
    kind: z.literal("not-linked"),
    axisA: AxisSchema,
    valueA: z.string(),
    axisB: AxisSchema,
    valueB: z.string(),
  }),
  z.object({
    kind: z.literal("conditional"),
    ifAxis: AxisSchema,
    ifValue: z.string(),
    thenAxis: AxisSchema,
    thenValue: z.string(),
    thenNegated: z.boolean(),
  }),
]);
export type Clue = z.infer<typeof ClueSchema>;

export const PuzzleSolutionSchema = z.object({
  culprit: z.string(),
  method: z.string(),
  location: z.string(),
  falseAlibi: z.string(),
});
export type PuzzleSolution = z.infer<typeof PuzzleSolutionSchema>;

export const PuzzleCaseSchema = z.object({
  suspects: z.array(z.string()).min(1),
  methods: z.array(z.string()).min(1),
  locations: z.array(z.string()).min(1),
  clues: z.array(ClueSchema),
  solution: PuzzleSolutionSchema,
});
export type PuzzleCase = z.infer<typeof PuzzleCaseSchema>;

/** The shape solve() may read — never `solution`, by type. */
export type SolvablePuzzle = Pick<PuzzleCase, "suspects" | "methods" | "locations" | "clues">;
