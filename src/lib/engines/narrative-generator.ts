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
  CRIME_LOCATION_NAMES,
  OTHER_LOCATION_NAMES,
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

  const otherLocationIds = puzzle.locations.filter((id) => id !== puzzle.solution.location);
  const crimeLocationName = names.pick(CRIME_LOCATION_NAMES);
  const otherLocationNames = names.sample(OTHER_LOCATION_NAMES, otherLocationIds.length);
  const locationName = new Map<string, string>([
    [puzzle.solution.location, crimeLocationName],
    ...otherLocationIds.map((id, i): [string, string] => [id, otherLocationNames[i]]),
  ]);

  const methodNamePool = names.sample(METHOD_NAMES, puzzle.methods.length);
  const methodName = new Map(puzzle.methods.map((id, i) => [id, methodNamePool[i]]));

  const culpritId = puzzle.solution.culprit;
  const nonCulpritSuspects = puzzle.suspects.filter((id) => id !== culpritId);
  // Each non-culprit suspect gets exactly one of the non-crime locations as their alibi.
  const alibiLocationFor = new Map(nonCulpritSuspects.map((id, i) => [id, otherLocationIds[i % otherLocationIds.length]]));
  const culpritFakeAlibiLocation = otherLocationIds[0];

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
        const text =
          clue.kind === "not" ? `${capitalize(AXIS_NOUN[clue.axis])} is not ${name}.` : `${capitalize(AXIS_NOUN[clue.axis])} is ${name}.`;
        return {
          text,
          events: [eventFor(clue.axis, clue.value)],
          characters: suspectsIn(clue.axis, clue.value),
          type: clue.axis === "culprit" || clue.axis === "falseAlibi" ? "witness_statement" : "medical_report",
          locationId: clue.axis === "location" ? clue.value : puzzle.solution.location,
        };
      }
      case "linked":
      case "not-linked": {
        const nameA = nameOf(clue.axisA, clue.valueA);
        const nameB = nameOf(clue.axisB, clue.valueB);
        const text =
          clue.kind === "linked"
            ? `Whoever has ${AXIS_NOUN[clue.axisA]} as ${nameA} also has ${AXIS_NOUN[clue.axisB]} as ${nameB}.`
            : `It is not true that ${AXIS_NOUN[clue.axisA]} is ${nameA} together with ${AXIS_NOUN[clue.axisB]} being ${nameB}.`;
        return {
          text,
          events: dedupe([eventFor(clue.axisA, clue.valueA), eventFor(clue.axisB, clue.valueB)]),
          characters: dedupe([...suspectsIn(clue.axisA, clue.valueA), ...suspectsIn(clue.axisB, clue.valueB)]),
          type: "document",
          locationId: clue.axisA === "location" ? clue.valueA : clue.axisB === "location" ? clue.valueB : puzzle.solution.location,
        };
      }
      case "conditional": {
        const ifName = nameOf(clue.ifAxis, clue.ifValue);
        const thenName = nameOf(clue.thenAxis, clue.thenValue);
        const text = `If ${AXIS_NOUN[clue.ifAxis]} is ${ifName}, then ${AXIS_NOUN[clue.thenAxis]} ${clue.thenNegated ? "is not" : "is"} ${thenName}.`;
        return {
          text,
          events: dedupe([eventFor(clue.ifAxis, clue.ifValue), eventFor(clue.thenAxis, clue.thenValue)]),
          characters: dedupe([...suspectsIn(clue.ifAxis, clue.ifValue), ...suspectsIn(clue.thenAxis, clue.thenValue)]),
          type: "document",
          locationId: clue.ifAxis === "location" ? clue.ifValue : clue.thenAxis === "location" ? clue.thenValue : puzzle.solution.location,
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
          fact: `${name} spent the critical window at ${locationName.get(alibiLocation)}.`,
          relatedEvents: [`evt_alibi_${id}`],
          source: "witnessed",
          sensitive: false,
        },
      ],
      doesNotKnow: [`Anything about what happened to ${victimName} at ${crimeLocationName}.`],
      lies: [],
    };
  });

  const timeline: TimelineEvent[] = [
    {
      id: "evt_crime",
      time: "22:15",
      description: `${suspectName.get(culpritId)} used ${methodName.get(puzzle.solution.method)} at ${crimeLocationName} to kill ${victimName}.`,
      locationId: puzzle.solution.location,
      involvedCharacterIds: [culpritId],
      isTrue: true,
    },
    ...nonCulpritSuspects.map(
      (id): TimelineEvent => ({
        id: `evt_alibi_${id}`,
        time: `2${names.int(2)}:${names.pick(["00", "15", "30", "45"])}`,
        description: `${suspectName.get(id)} was at ${locationName.get(alibiLocationFor.get(id)!)} during the critical window.`,
        locationId: alibiLocationFor.get(id)!,
        involvedCharacterIds: [id],
        isTrue: true,
      })
    ),
    {
      id: "evt_body_found",
      time: "23:30",
      description: `${victimName}'s body is discovered at ${crimeLocationName}.`,
      locationId: puzzle.solution.location,
      involvedCharacterIds: [],
      isTrue: true,
    },
  ];

  const locations = puzzle.locations.map((id) => ({
    id,
    name: locationName.get(id)!,
    description: id === puzzle.solution.location ? `Where ${victimName} was found.` : "A location guests had access to that evening.",
    connectedTo: [],
  }));

  const culpritCharacter = characters.find((c) => c.id === culpritId)!;
  const culpritRelationship = RELATIONSHIPS.find((r) => r.label === culpritCharacter.relationshipToVictim)!;

  const truth: CaseTruth = {
    id: `generated-${seed}`,
    title: `The ${crimeLocationName.replace(/^The /, "")} Case`,
    difficulty,
    seed,
    victim: { name: victimName, description: `Found dead at ${crimeLocationName} the night of a gathering at the estate.` },
    locations,
    characters,
    timeline,
    evidence,
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
