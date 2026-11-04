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

const LINKED_TEMPLATES: Record<string, Array<(a: string, b: string) => string>> = {
  "culprit:method": [
    (_a, b) => `Whoever did it used ${b}.`,
    (_a, b) => `The killer's weapon was ${b}.`,
    (_a, b) => `Trace evidence ties the killer to ${b}.`,
  ],
  "culprit:location": [
    (_a, b) => `Whoever did it was at ${b} that night.`,
    (_a, b) => `The killer was present at ${b}.`,
    (_a, b) => `Security records place the killer at ${b}.`,
  ],
  "culprit:falseAlibi": [
    () => `The culprit is the one whose story doesn't hold up.`,
    () => `Whoever is lying about their alibi is the killer.`,
  ],
  "method:location": [
    (a, b) => `${capitalize(a)} was used at ${b}.`,
    (a, b) => `The scene at ${b} is consistent with ${a}.`,
    (a, b) => `Forensic residue of ${a} was found at ${b}.`,
  ],
};

const CONDITIONAL_TEMPLATES: Array<(ifNoun: string, ifName: string, thenNoun: string, thenName: string, negated: boolean) => string> = [
  (ifNoun, ifName, thenNoun, thenName, negated) => `If ${ifNoun} is ${ifName}, then ${thenNoun} ${negated ? "is not" : "is"} ${thenName}.`,
  (ifNoun, ifName, thenNoun, thenName, negated) =>
    `Should ${ifNoun} turn out to be ${ifName}, ${thenNoun} would ${negated ? "not be" : "have to be"} ${thenName}.`,
];

export interface GenerateCaseOptions {
  seed: string;
  difficulty: Difficulty;
}

export function generateCase({ seed, difficulty }: GenerateCaseOptions): CaseTruth {
  const [min, max] = SUSPECT_COUNT_BOUNDS[difficulty];
  const countRng = createRng(seed);
  const suspectCount = min + countRng.int(max - min + 1);

  const puzzle = generatePuzzleCase({ seed: `${seed}:puzzle`, suspectCount });
  const names = createRng(`${seed}:narrative`);

  const namePool = names.sample(FIRST_NAMES.flatMap((f) => LAST_NAMES.map((l) => `${f} ${l}`)), suspectCount + 1);
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
        const positive = names.pick(LINKED_TEMPLATES[`${clue.axisA}:${clue.axisB}`])(nameA, nameB);
        // The culprit:falseAlibi templates ignore the names, so negating them would deny the always-true rule; name the cleared alibi instead.
        const negative = `${clue.axisA}:${clue.axisB}` === "culprit:falseAlibi" ? `${nameB}'s story is not the one that breaks.` : `It is not true that ${lowercaseFirst(positive)}`;
        const text = clue.kind === "linked" ? positive : negative;
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
  const keyEvidenceIds = evidence
    .filter((_, i) => {
      const c = puzzle.clues[i];
      return c.kind === "linked" && c.axisA === "culprit" && (c.axisB === "method" || c.axisB === "location");
    })
    .map((e) => e.id);

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
    contradictions: [
      {
        id: "contra_culprit_alibi",
        description: `${suspectName.get(culpritId)} claims to have been elsewhere, but the evidence places them at ${crimeLocationName} during the critical window.`,
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

function lowercaseFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
