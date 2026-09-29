/**
 * Procedural Case Generator — docs/10-roadmap.md Phase 2.
 *
 * Builds a CaseTruth structurally (locations -> characters -> timeline ->
 * evidence -> solution) so that every rule in case-validators.ts holds BY
 * CONSTRUCTION, not by generate-then-hope: there is exactly one culprit,
 * every evidence item traces to a real event, every character's knowledge
 * is a subset of the truth, and the culprit always has reliable,
 * non-red-herring evidence against them.
 *
 * This generator has no LLM in it — it's deterministic content-templating
 * from a seeded PRNG (src/lib/engines/prng.ts). That's a deliberate MVP
 * choice, not a permanent one: a future version can have an LLM propose
 * *phrasing* (names, flavor text) while this module's structural logic
 * keeps enforcing solvability, mirroring the same split used for NPC
 * dialogue (docs/03, docs/06). `generateCase` always validates its own
 * output before returning it, and throws rather than hand back a case that
 * fails `validateCaseTruth` — a generation bug should be loud, never silently
 * shipped as an unsolvable case.
 */
import type { CaseTruth, Difficulty, Character, TimelineEvent, Evidence } from "@/lib/schema/case-truth";
import { CaseTruthSchema } from "@/lib/schema/case-truth";
import { validateCaseTruth } from "./case-validators";
import { createRng } from "./prng";
import {
  FIRST_NAMES,
  LAST_NAMES,
  RELATIONSHIPS,
  NON_CULPRIT_RELATIONSHIPS,
  METHODS,
  PERSONALITIES,
  CRIME_LOCATION_NAMES,
  HUB_LOCATION_NAMES,
  OTHER_LOCATION_NAMES,
  FALLBACKS,
  EVIDENCE_FLAVORS,
} from "@/data/generator-content";

const SUSPECT_COUNT_BOUNDS: Record<Difficulty, [number, number]> = {
  easy: [3, 3],
  medium: [4, 6],
  hard: [6, 8],
};

const TIMES = {
  context: "20:00",
  confrontation: "22:00",
  crime: "22:15",
  bodyFound: "23:30",
};

export interface GenerateCaseOptions {
  seed: string;
  difficulty: Difficulty;
}

export function generateCase({ seed, difficulty }: GenerateCaseOptions): CaseTruth {
  const rng = createRng(seed);
  const id = `generated-${seed}`;

  const [min, max] = SUSPECT_COUNT_BOUNDS[difficulty];
  const suspectCount = min + rng.int(max - min + 1);

  // Distinct "First Last" names for the victim + every suspect.
  const namePool = rng.sample(
    FIRST_NAMES.flatMap((f) => LAST_NAMES.map((l) => `${f} ${l}`)),
    suspectCount + 1
  );
  const victimName = namePool[0];
  const suspectNames = namePool.slice(1);

  // --- Locations ---
  const crimeLocationName = rng.pick(CRIME_LOCATION_NAMES);
  const hubLocationName = rng.pick(HUB_LOCATION_NAMES);
  const alibiLocationNames = rng.sample(OTHER_LOCATION_NAMES, Math.max(3, Math.min(suspectCount, OTHER_LOCATION_NAMES.length)));

  const locCrime = { id: "loc_crime", name: crimeLocationName, description: `Where ${victimName} was found.`, connectedTo: ["loc_hub"] };
  const locHub = { id: "loc_hub", name: hubLocationName, description: "Connects every other room.", connectedTo: ["loc_crime", ...alibiLocationNames.map((_, i) => `loc_alibi_${i}`)] };
  const alibiLocations = alibiLocationNames.map((name, i) => ({
    id: `loc_alibi_${i}`,
    name,
    description: `A location guests had access to that evening.`,
    connectedTo: ["loc_hub"],
  }));
  const locations = [locCrime, locHub, ...alibiLocations];

  // --- Characters ---
  const culpritIndex = rng.int(suspectCount);
  const characters: Character[] = [];
  const nonCulpritAlibiEvents: TimelineEvent[] = [];
  const nonCulpritEvidence: Evidence[] = [];

  let culpritRelationship = RELATIONSHIPS[0];

  for (let i = 0; i < suspectCount; i++) {
    const charId = `char_${i}`;
    const name = suspectNames[i];
    const isCulprit = i === culpritIndex;
    const alibiLocation = rng.pick(alibiLocations);

    if (isCulprit) {
      culpritRelationship = rng.pick(RELATIONSHIPS);
      characters.push({
        id: charId,
        name,
        role: "suspect",
        relationshipToVictim: culpritRelationship.label,
        actualLocation: locCrime.id,
        claimedLocation: alibiLocation.id,
        personality: rng.pick(PERSONALITIES),
        isCulprit: true,
        stress: 0.3 + rng.next() * 0.2,
        trust: 0.4 + rng.next() * 0.3,
        knowledge: [
          {
            id: `know_${i}_confrontation`,
            fact: `${victimName} confronted them directly about it, shortly before the time of death.`,
            relatedEvents: ["evt_confrontation"],
            source: "witnessed",
            sensitive: true,
          },
          {
            id: `know_${i}_crime`,
            fact: `They were alone with ${victimName} at ${crimeLocationName} right before the body was found.`,
            relatedEvents: ["evt_crime"],
            source: "witnessed",
            sensitive: true,
          },
        ],
        doesNotKnow: [],
        lies: [
          {
            id: `lie_${i}_alibi`,
            falseClaim: `I was at ${alibiLocation.name} the entire evening.`,
            conceals: "evt_crime",
            brokenBy: ["ev_implicating_0", "ev_implicating_1"],
            fallback: rng.pick(FALLBACKS),
          },
        ],
      });
    } else {
      const relationship = rng.pick(NON_CULPRIT_RELATIONSHIPS);
      const eventId = `evt_alibi_${i}`;
      nonCulpritAlibiEvents.push({
        id: eventId,
        time: `2${rng.int(2)}:${rng.pick(["00", "15", "30", "45"])}`,
        description: `${name} was at ${alibiLocation.name} during the critical window.`,
        locationId: alibiLocation.id,
        involvedCharacterIds: [charId],
        isTrue: true,
      });
      const flavor = rng.pick(EVIDENCE_FLAVORS.alibiCorroboration);
      nonCulpritEvidence.push({
        id: `ev_alibi_${i}`,
        type: flavor.type,
        description: flavor.description(name, alibiLocation.name),
        locationId: alibiLocation.id,
        discoveryRequirements: [],
        relatedCharacterIds: [charId],
        relatedEventIds: [eventId],
        reliability: "reliable",
        hiddenInterpretation: `Independently corroborates ${name}'s alibi.`,
        isRedHerring: false,
      });
      characters.push({
        id: charId,
        name,
        role: "suspect",
        relationshipToVictim: relationship,
        actualLocation: alibiLocation.id,
        claimedLocation: alibiLocation.id,
        personality: rng.pick(PERSONALITIES),
        isCulprit: false,
        stress: rng.next() * 0.4,
        trust: 0.5 + rng.next() * 0.3,
        knowledge: [
          {
            id: `know_${i}_alibi`,
            fact: `${name} spent the critical window at ${alibiLocation.name}.`,
            relatedEvents: [eventId],
            source: "witnessed",
            sensitive: false,
          },
        ],
        doesNotKnow: [`Anything about what happened to ${victimName} at ${crimeLocationName}.`],
        lies: [],
      });
    }
  }

  const culprit = characters[culpritIndex];

  // --- Timeline ---
  const contextEvent: TimelineEvent = {
    id: "evt_context",
    time: TIMES.context,
    description: `The evening gathering gets underway at ${hubLocationName}.`,
    locationId: locHub.id,
    involvedCharacterIds: [],
    isTrue: true,
  };
  const confrontationEvent: TimelineEvent = {
    id: "evt_confrontation",
    time: TIMES.confrontation,
    description: `${victimName} privately confronts ${culprit.name} at ${crimeLocationName}.`,
    locationId: locCrime.id,
    involvedCharacterIds: [culprit.id],
    isTrue: true,
  };
  const method = rng.pick(METHODS);
  const crimeEvent: TimelineEvent = {
    id: "evt_crime",
    time: TIMES.crime,
    description: `${culprit.name} ${method}, killing ${victimName}.`,
    locationId: locCrime.id,
    involvedCharacterIds: [culprit.id],
    isTrue: true,
  };
  const bodyFoundEvent: TimelineEvent = {
    id: "evt_body_found",
    time: TIMES.bodyFound,
    description: `${victimName}'s body is discovered at ${crimeLocationName}.`,
    locationId: locCrime.id,
    involvedCharacterIds: [],
    isTrue: true,
  };
  const timeline = [contextEvent, confrontationEvent, crimeEvent, ...nonCulpritAlibiEvents, bodyFoundEvent];

  // --- Evidence ---
  const implicatingFlavors = rng.sample(EVIDENCE_FLAVORS.implicating, 2);
  const implicatingEvidence: Evidence[] = implicatingFlavors.map((flavor, i) => ({
    id: `ev_implicating_${i}`,
    type: flavor.type,
    description: flavor.description(culprit.name),
    locationId: locCrime.id,
    discoveryRequirements: [],
    relatedCharacterIds: [culprit.id],
    relatedEventIds: i === 0 ? ["evt_crime"] : ["evt_confrontation"],
    reliability: "reliable",
    hiddenInterpretation: `Directly ties ${culprit.name} to the crime, contradicting their claimed alibi.`,
    isRedHerring: false,
  }));

  const redHerringFlavor = rng.pick(EVIDENCE_FLAVORS.redHerring);
  const redHerringEvidence: Evidence = {
    id: "ev_redherring_0",
    type: redHerringFlavor.type,
    description: redHerringFlavor.description(),
    locationId: locHub.id,
    discoveryRequirements: [],
    relatedCharacterIds: [],
    relatedEventIds: ["evt_context"],
    reliability: "misleading",
    hiddenInterpretation: "A deliberate distraction with no bearing on the actual crime.",
    isRedHerring: true,
  };

  const evidence = [...implicatingEvidence, ...nonCulpritEvidence, redHerringEvidence];

  const truth: CaseTruth = {
    id,
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
        description: `${culprit.name} claims to have been elsewhere the whole time, but evidence places them at ${crimeLocationName} during the critical window.`,
        characterId: culprit.id,
        claim: `lie_${culpritIndex}_alibi`,
        truth: "evt_crime",
        revealingEvidenceIds: implicatingEvidence.map((e) => e.id),
      },
    ],
    solution: {
      culpritId: culprit.id,
      motive: `${culprit.name} ${culpritRelationship.motiveTemplate(victimName)}.`,
      method: `${culprit.name} ${method}.`,
      keyEvidenceIds: implicatingEvidence.map((e) => e.id),
      criticalTimelineEventIds: ["evt_confrontation", "evt_crime", "evt_body_found"],
    },
  };

  const parsed = CaseTruthSchema.parse(truth);
  const result = validateCaseTruth(parsed);
  if (!result.valid) {
    throw new Error(
      `generateCase produced an invalid case for seed "${seed}" (difficulty ${difficulty}): ${JSON.stringify(result.issues, null, 2)}`
    );
  }
  return parsed;
}
