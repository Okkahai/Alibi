/**
 * Content banks for the procedural Case Generator (src/lib/engines/case-generator.ts).
 * These supply names/phrasing variety; the generator's structural logic is
 * what guarantees validity (see docs/02-case-truth-schema.md and
 * case-validators.ts) — this file has no bearing on solvability.
 */

export const FIRST_NAMES = [
  "Alden", "Bianca", "Corwin", "Delia", "Emrys", "Farah", "Grant", "Helena",
  "Ivo", "Jolene", "Kasimir", "Lior", "Marisol", "Nadia", "Osric", "Petra",
  "Quinn", "Rosalind", "Silas", "Tamsin",
];

export const LAST_NAMES = [
  "Ashworth", "Brennan", "Castellan", "Duvall", "Everhart", "Fenwick",
  "Graystone", "Halloway", "Ivarsson", "Jessup", "Kestrel", "Larkspur",
  "Marchetti", "Novak", "Osei", "Pemberton", "Quintrell", "Ravenscroft",
  "Sorel", "Thorne",
];

export interface RelationshipTemplate {
  label: string;
  motiveTemplate: (victimName: string) => string;
}

export const RELATIONSHIPS: RelationshipTemplate[] = [
  {
    label: "Business partner",
    motiveTemplate: (v) => `discovered ${v} was about to expose a serious financial fraud`,
  },
  {
    label: "Spouse",
    motiveTemplate: (v) => `stood to lose everything in ${v}'s planned divorce and asset split`,
  },
  { label: "Sibling", motiveTemplate: (v) => `had spent years resenting ${v} over a long-standing inheritance dispute` },
  { label: "Employee", motiveTemplate: (v) => `was about to be fired by ${v} after being caught embezzling` },
  { label: "Rival", motiveTemplate: (v) => `saw ${v} as the one obstacle left to a deal worth everything` },
  { label: "Former friend", motiveTemplate: (v) => `blamed ${v} for a betrayal that ended their friendship years ago` },
];

export const NON_CULPRIT_RELATIONSHIPS = [
  "Friend", "Neighbor", "Employee", "Distant relative", "Housekeeper", "Assistant",
];

export const METHODS = [
  "poisoned a drink with a lethal dose of medication",
  "struck a fatal blow with a heavy object from the room",
  "staged what looked like an accidental fall",
  "used a weapon taken from the scene itself",
];

export const PERSONALITIES = [
  "Composed in public, guarded in private.",
  "Quick with a charming explanation for everything.",
  "Nervous under pressure, prone to over-explaining.",
  "Blunt and short-tempered when questioned.",
  "Warm and forthcoming once trust is earned.",
  "Withdrawn, answers only what's asked.",
];

export const CRIME_LOCATION_NAMES = ["The Study", "The Library", "The Conservatory", "The Office", "The Boathouse"];

export const HUB_LOCATION_NAMES = ["Main Hallway", "Reception Hall", "The Foyer", "Central Corridor"];

export const OTHER_LOCATION_NAMES = [
  "Garden Terrace", "Kitchen", "Guest Room", "Wine Cellar", "Dining Room",
  "Billiard Room", "Rooftop Terrace", "Servants' Quarters", "Chapel",
  "Boat House", "Greenhouse", "East Wing", "West Wing", "Attic",
];

export const FALLBACKS: Array<"deny" | "explain" | "panic" | "change_story" | "reveal_information"> = [
  "deny", "explain", "panic", "change_story", "reveal_information",
];

export const EVIDENCE_FLAVORS = {
  implicating: [
    { type: "fingerprint" as const, description: (name: string) => `${name}'s fingerprints, and only theirs, are found on the object used at the scene.` },
    { type: "security_log" as const, description: (name: string) => `A camera still places ${name} at the scene at the critical time, contradicting their stated alibi.` },
    { type: "document" as const, description: (name: string) => `A document shows ${name} had every reason to want the victim silenced.` },
  ],
  alibiCorroboration: [
    { type: "witness_statement" as const, description: (name: string, loc: string) => `A witness confirms seeing ${name} at ${loc} during the critical window.` },
    { type: "phone_record" as const, description: (name: string) => `Phone records confirm ${name} was on a call spanning the critical window.` },
    { type: "receipt" as const, description: (name: string, loc: string) => `A dated receipt places ${name} at ${loc} at the relevant time.` },
  ],
  redHerring: [
    { type: "object" as const, description: () => `An unrelated broken item, from an incident days earlier with no bearing on the case.` },
    { type: "photograph" as const, description: () => `A photograph suggesting a motive that turns out to lead nowhere.` },
  ],
};
