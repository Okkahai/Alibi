/**
 * Renders a solved PuzzleCase (src/lib/engines/puzzle-generator.ts) into the
 * narrative CaseTruth the app actually displays — docs/CASE_GENERATION.md
 * Phase 2c. This pass only chooses names and sentences; it never changes
 * which clues were chosen or what they mean, so it can't reintroduce the
 * ambiguity gap from docs/REBUILD_AUDIT.md. Re-validated at the end against
 * both validateCaseTruth() (referential integrity) and solve() (re-run on
 * the original puzzle clues, to confirm rendering didn't drop one) so a
 * rendering bug is a loud throw, never a silently shipped case.
 */
import type { Axis, Clue } from "@/lib/schema/puzzle-case";
import type { CaseTruth, Character, Evidence, TimelineEvent, Difficulty } from "@/lib/schema/case-truth";
import { CaseTruthSchema } from "@/lib/schema/case-truth";
import { buildDeductionTrace } from "@/lib/engines/deduction-trace";
import { generatePuzzleCase } from "./puzzle-generator";
import { validateCaseTruth } from "./case-validators";
import { solve } from "./solver";
import { createRng } from "./prng";
import {
  FIRST_NAMES,
  LAST_NAMES,
  RELATIONSHIPS,
  NON_CULPRIT_RELATIONSHIPS,
  METHOD_NAMES,
  PERSONALITIES,
  LOCATION_NAMES,
  LOCATION_DESCRIPTIONS,
  FALLBACKS,
} from "@/data/generator-content";

type EvidenceType = Evidence["type"];

const SUSPECT_COUNT_BOUNDS: Record<Difficulty, [number, number]> = {
  easy: [3, 3],
  medium: [4, 6],
  hard: [6, 8],
};

const AXIS_NOUN: Record<Axis, string> = {
  culprit: "the culprit",
  method: "the method used",
  location: "the location",
  falseAlibi: "the suspect whose alibi breaks",
};

// Two or three phrasings per clue shape, so published cases don't all read as
// the same sentence skeleton with names swapped in (§9 "prevent repetitive
// daily content"). Picked per-clue by the narrative RNG; the logical meaning
// (and therefore solvability) never depends on which one is chosen.
const NOT_TEMPLATES: Record<Axis, Array<(name: string) => string>> = {
  culprit: [
    (n) => `${n} has a corroborated alibi for the critical window — not the culprit.`,
    (n) => `A witness statement clears ${n}.`,
    (n) => `${n} is accounted for elsewhere at the time of the murder.`,
  ],
  method: [
    (n) => `The coroner's report rules out ${n} as the method.`,
    (n) => `Forensics found no trace of ${n} at the scene.`,
    (n) => `${n} does not match the wounds found on the body.`,
  ],
  location: [
    (n) => `The crime did not take place at ${n}.`,
    (n) => `No signs of a struggle were found at ${n}.`,
    (n) => `${n} was checked and cleared by investigators.`,
  ],
  falseAlibi: [
    (n) => `${n}'s account of the evening holds up under scrutiny.`,
    (n) => `${n}'s alibi was independently corroborated.`,
  ],
};

const IS_TEMPLATES: Record<Axis, Array<(name: string) => string>> = {
  culprit: [(n) => `${capitalize(AXIS_NOUN.culprit)} is ${n}.`],
  method: [(n) => `${capitalize(AXIS_NOUN.method)} is ${n}.`],
  location: [(n) => `${capitalize(AXIS_NOUN.location)} is ${n}.`],
  falseAlibi: [(n) => `${capitalize(AXIS_NOUN.falseAlibi)} is ${n}.`],
};

// Each template must say exactly what the solver's clue means (solver.ts):
// linked = "A is part of the answer if and only if B is"; not-linked = "not both".
const LINKED_TEMPLATES: Record<string, Array<(a: string, b: string) => string>> = {
  "culprit:method": [
    (a, b) => `Either ${a} is the killer and ${b} the method, or neither is.`,
    (a, b) => `If ${b} was the method, ${a} is the killer; and if ${a} is the killer, the method was ${b}.`,
  ],
  "culprit:location": [
    (a, b) => `Either ${a} is the killer and ${b} the scene, or neither is.`,
    (a, b) => `If the killing happened at ${b}, ${a} did it; and if ${a} did it, it happened at ${b}.`,
  ],
  "method:location": [
    (a, b) => `Either ${a} was used and ${b} is the scene, or neither is.`,
    (a, b) => `If ${a} was used, it was at ${b}; and whatever happened at ${b} was done with ${a}.`,
  ],
};

const NOT_LINKED_TEMPLATES: Record<string, Array<(a: string, b: string) => string>> = {
  "culprit:method": [(a, b) => `If ${a} is the killer, the method was not ${b}.`, (a, b) => `${a} did not use ${b}.`],
  "culprit:location": [(a, b) => `If ${a} is the killer, it did not happen at ${b}.`],
  "method:location": [(a, b) => `${capitalize(a)} was not used at ${b}.`, (a, b) => `Whatever happened at ${b}, it was not ${a}.`],
};

const CONDITIONAL_TEMPLATES: Array<(ifNoun: string, ifName: string, thenNoun: string, thenName: string, negated: boolean) => string> = [
  (ifNoun, ifName, thenNoun, thenName, negated) => `If ${ifNoun} is ${ifName}, then ${thenNoun} ${negated ? "is not" : "is"} ${thenName}.`,
  (ifNoun, ifName, thenNoun, thenName, negated) =>
    `Should ${ifNoun} turn out to be ${ifName}, ${thenNoun} would ${negated ? "not be" : "have to be"} ${thenName}.`,
];

/** First daily generated under rules v2: pruned (harder) clue sets, no repeated first or last names. */
export const RULES_V2_FROM = "2026-11-06";

export interface GenerateCaseOptions {
  seed: string;
  difficulty: Difficulty;
}

export function generateCase({ seed, difficulty }: GenerateCaseOptions): CaseTruth {
  const [min, max] = SUSPECT_COUNT_BOUNDS[difficulty];
  const countRng = createRng(seed);
  const suspectCount = min + countRng.int(max - min + 1);

  // Published dailies are frozen (docs/DAILY_SYSTEM.md): rule changes apply to dailies from their effective date, and to every practice seed.
  const isDaily = /^\d{4}-\d{2}-\d{2}$/.test(seed);
  const v2 = !isDaily || seed >= RULES_V2_FROM;
  const puzzle = generatePuzzleCase({ seed: `${seed}:puzzle`, suspectCount, minimal: v2 });
  const names = createRng(`${seed}:narrative`);

  const namePool = v2
    ? (() => {
        const last = names.sample(LAST_NAMES, suspectCount + 1);
        return names.sample(FIRST_NAMES, suspectCount + 1).map((f, i) => `${f} ${last[i]}`);
      })()
    : names.sample(FIRST_NAMES.flatMap((f) => LAST_NAMES.map((l) => `${f} ${l}`)), suspectCount + 1);
  const victimName = namePool[0];
  const suspectName = new Map(puzzle.suspects.map((id, i) => [id, namePool[i + 1]]));

  // Nothing the player sees before the reveal may single out the crime room:
  // names come from one pool, and claims/exhibits are spread over every room.
  const otherLocationIds = puzzle.locations.filter((id) => id !== puzzle.solution.location);
  const roomNames = names.sample(LOCATION_NAMES, puzzle.locations.length);
  const locationName = new Map(puzzle.locations.map((id, i) => [id, roomNames[i]]));
  const crimeLocationName = locationName.get(puzzle.solution.location)!;

  const methodNamePool = names.sample(METHOD_NAMES, puzzle.methods.length);
  const methodName = new Map(puzzle.methods.map((id, i) => [id, methodNamePool[i]]));

  const culpritId = puzzle.solution.culprit;
  const nonCulpritSuspects = puzzle.suspects.filter((id) => id !== culpritId);
  // Innocent whereabouts are earlier in the evening and may be any room, the
  // crime room included, so the one room nobody mentions is not the answer.
  const alibiLocationFor = new Map(nonCulpritSuspects.map((id) => [id, names.pick(puzzle.locations)]));
  const culpritFakeAlibiLocation = names.pick(otherLocationIds);

  const nameOf = (axis: Axis, value: string) =>
    axis === "method" ? methodName.get(value)! : axis === "location" ? locationName.get(value)! : suspectName.get(value)!;

  function eventFor(axis: Axis, value: string): string {
    if (axis === "culprit" || axis === "falseAlibi") {
      return value === culpritId ? "evt_crime" : `evt_alibi_${value}`;
    }
    return "evt_crime";
  }

  function suspectsIn(axis: Axis, value: string): string[] {
    return axis === "culprit" || axis === "falseAlibi" ? [value] : [];
  }

  function describe(clue: Clue): { text: string; events: string[]; characters: string[]; type: EvidenceType; locationId: string } {
    switch (clue.kind) {
      case "not":
      case "is": {
        const name = nameOf(clue.axis, clue.value);
        const text = names.pick(clue.kind === "not" ? NOT_TEMPLATES[clue.axis] : IS_TEMPLATES[clue.axis])(name);
        return {
          text,
          events: [eventFor(clue.axis, clue.value)],
          characters: suspectsIn(clue.axis, clue.value),
          type: clue.axis === "culprit" || clue.axis === "falseAlibi" ? "witness_statement" : "medical_report",
          locationId: clue.axis === "location" ? clue.value : names.pick(puzzle.locations),
        };
      }
      case "linked":
      case "not-linked": {
        const nameA = nameOf(clue.axisA, clue.valueA);
        const nameB = nameOf(clue.axisB, clue.valueB);
        const templates = clue.kind === "linked" ? LINKED_TEMPLATES : NOT_LINKED_TEMPLATES;
        const text = names.pick(templates[`${clue.axisA}:${clue.axisB}`])(nameA, nameB);
        return {
          text,
          events: dedupe([eventFor(clue.axisA, clue.valueA), eventFor(clue.axisB, clue.valueB)]),
          characters: dedupe([...suspectsIn(clue.axisA, clue.valueA), ...suspectsIn(clue.axisB, clue.valueB)]),
          type: "document",
          locationId: clue.axisA === "location" ? clue.valueA : clue.axisB === "location" ? clue.valueB : names.pick(puzzle.locations),
        };
      }
      case "conditional": {
        const ifName = nameOf(clue.ifAxis, clue.ifValue);
        const thenName = nameOf(clue.thenAxis, clue.thenValue);
        const template = names.pick(CONDITIONAL_TEMPLATES);
        const text = template(AXIS_NOUN[clue.ifAxis], ifName, AXIS_NOUN[clue.thenAxis], thenName, clue.thenNegated);
        return {
          text,
          events: dedupe([eventFor(clue.ifAxis, clue.ifValue), eventFor(clue.thenAxis, clue.thenValue)]),
          characters: dedupe([...suspectsIn(clue.ifAxis, clue.ifValue), ...suspectsIn(clue.thenAxis, clue.thenValue)]),
          type: "document",
          locationId: clue.ifAxis === "location" ? clue.ifValue : clue.thenAxis === "location" ? clue.thenValue : names.pick(puzzle.locations),
        };
      }
    }
  }

  const evidence: Evidence[] = puzzle.clues.map((clue, i) => {
    const rendered = describe(clue);
    return {
      id: `ev_${i}`,
      type: rendered.type,
      description: rendered.text,
      locationId: rendered.locationId,
      discoveryRequirements: [],
      relatedCharacterIds: rendered.characters,
      relatedEventIds: rendered.events,
      reliability: "reliable",
      hiddenInterpretation: `Confirms: ${rendered.text}`,
      isRedHerring: false,
    };
  });

  // Evidence ids rendering the two culprit-implicating anchor clues (always
  // present — see puzzle-generator.ts) — what breaks the culprit's lie.
  const deduction = buildDeductionTrace(puzzle).map(({ clues, ...step }) => ({ ...step, evidenceIds: clues.map((n) => evidence[n].id) }));
  const anchorEvidenceIds = evidence
    .filter((_, i) => {
      const c = puzzle.clues[i];
      return c.kind === "linked" && c.axisA === "culprit" && (c.axisB === "method" || c.axisB === "location");
    })
    .map((e) => e.id);
  // Rules v2 (and any case without anchors): the key exhibits are the ones the trace uses to settle the culprit.
  const keyEvidenceIds = anchorEvidenceIds.length && !v2
    ? anchorEvidenceIds
    : [...new Set(deduction.filter((s) => s.axis === "culprit").flatMap((s) => s.evidenceIds))];

  const characters: Character[] = puzzle.suspects.map((id) => {
    const isCulprit = id === culpritId;
    const name = suspectName.get(id)!;
    if (isCulprit) {
      const relationship = names.pick(RELATIONSHIPS);
      return {
        id,
        name,
        role: "suspect",
        relationshipToVictim: relationship.label,
        actualLocation: puzzle.solution.location,
        claimedLocation: culpritFakeAlibiLocation,
        personality: names.pick(PERSONALITIES),
        isCulprit: true,
        stress: 0.3 + names.next() * 0.2,
        trust: 0.4 + names.next() * 0.3,
        knowledge: [
          {
            id: `know_${id}_crime`,
            fact: `${name} was alone with ${victimName} at ${crimeLocationName} right before the body was found.`,
            relatedEvents: ["evt_crime"],
            source: "witnessed",
            sensitive: true,
          },
        ],
        doesNotKnow: [],
        lies: [
          {
            id: `lie_${id}_alibi`,
            falseClaim: `I was at ${locationName.get(culpritFakeAlibiLocation)} the entire evening.`,
            conceals: "evt_crime",
            brokenBy: keyEvidenceIds,
            fallback: names.pick(FALLBACKS),
          },
        ],
      };
    }
    const alibiLocation = alibiLocationFor.get(id)!;
    return {
      id,
      name,
      role: "suspect",
      relationshipToVictim: names.pick(NON_CULPRIT_RELATIONSHIPS),
      actualLocation: alibiLocation,
      claimedLocation: alibiLocation,
      personality: names.pick(PERSONALITIES),
      isCulprit: false,
      stress: names.next() * 0.4,
      trust: 0.5 + names.next() * 0.3,
      knowledge: [
        {
          id: `know_${id}_alibi`,
          fact: `${name} spent the early evening at ${locationName.get(alibiLocation)}.`,
          relatedEvents: [`evt_alibi_${id}`],
          source: "witnessed",
          sensitive: false,
        },
      ],
      doesNotKnow: [`Anything about how or where ${victimName} was killed.`],
      lies: [],
    };
  });

  const timeline: TimelineEvent[] = [
    {
      id: "evt_crime",
      time: "22:15",
      // Never name the culprit or method here: the event is shown in the Chronology once an exhibit places it.
      description: `${victimName} was killed at ${crimeLocationName}.`,
      locationId: puzzle.solution.location,
      involvedCharacterIds: [culpritId],
      isTrue: true,
    },
    ...nonCulpritSuspects.map(
      (id): TimelineEvent => ({
        id: `evt_alibi_${id}`,
        time: `2${names.int(2)}:${names.pick(["00", "15", "30", "45"])}`,
        description: `${suspectName.get(id)} was at ${locationName.get(alibiLocationFor.get(id)!)} earlier in the evening.`,
        locationId: alibiLocationFor.get(id)!,
        involvedCharacterIds: [id],
        isTrue: true,
      })
    ),
    {
      id: "evt_body_found",
      time: "23:30",
      description: `${victimName}'s body is discovered; it had been moved after death.`,
      locationId: puzzle.solution.location,
      involvedCharacterIds: [],
      isTrue: true,
    },
  ];

  const locations = puzzle.locations.map((id) => ({
    id,
    name: locationName.get(id)!,
    description: names.pick(LOCATION_DESCRIPTIONS),
    connectedTo: [],
  }));

  const culpritCharacter = characters.find((c) => c.id === culpritId)!;
  const culpritRelationship = RELATIONSHIPS.find((r) => r.label === culpritCharacter.relationshipToVictim)!;

  const truth: CaseTruth = {
    id: `generated-${seed}`,
    title: `The ${victimName.split(" ").pop()} Case`,
    difficulty,
    seed,
    victim: { name: victimName, description: "Found dead the night of a gathering at the estate; the body had been moved, so where the killing happened is for you to establish." },
    locations,
    characters,
    timeline,
    evidence,
    methods: puzzle.methods.map((id) => ({ id, name: methodName.get(id)! })),
    deduction,
    contradictions: [
      {
        id: "contra_culprit_alibi",
        description: v2
          ? `${suspectName.get(culpritId)} claims to have been elsewhere, but once the exhibits clear everyone else, theirs is the only story left that cannot be true.`
          : `${suspectName.get(culpritId)} claims to have been elsewhere, but the evidence places them at ${crimeLocationName} during the critical window.`,
        characterId: culpritId,
        claim: `lie_${culpritId}_alibi`,
        truth: "evt_crime",
        revealingEvidenceIds: keyEvidenceIds,
      },
    ],
    solution: {
      culpritId,
      motive: `${suspectName.get(culpritId)} ${culpritRelationship.motiveTemplate(victimName)}.`,
      method: `${suspectName.get(culpritId)} used ${methodName.get(puzzle.solution.method)}.`,
      locationId: puzzle.solution.location,
      keyEvidenceIds,
      criticalTimelineEventIds: ["evt_crime", "evt_body_found"],
    },
  };

  const parsed = CaseTruthSchema.parse(truth);

  const structuralResult = validateCaseTruth(parsed);
  if (!structuralResult.valid) {
    throw new Error(
      `generateCase: rendered CaseTruth failed validateCaseTruth() for seed "${seed}": ${JSON.stringify(structuralResult.issues, null, 2)}`
    );
  }

  // Re-run the solver on the original puzzle clues to confirm rendering ran
  // over exactly the clue set generatePuzzleCase() already proved unique —
  // this should be unreachable (generatePuzzleCase guarantees it itself),
  // but a generation bug must be a loud throw, never a silently shipped case.
  const puzzleCheck = solve({ suspects: puzzle.suspects, methods: puzzle.methods, locations: puzzle.locations, clues: puzzle.clues });
  if (!puzzleCheck.isUnique || JSON.stringify(puzzleCheck.solutions[0]) !== JSON.stringify(puzzle.solution)) {
    throw new Error(`generateCase: puzzle re-check failed for seed "${seed}".`);
  }

  return parsed;
}

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

