import { describe, it, expect } from "vitest";
import { generateCase } from "@/lib/engines/narrative-generator";

/** The crime room is an answer field: nothing shown before the reveal may single it out. */
describe("crime room is not leaked by presentation", () => {
  const cases = Array.from({ length: 300 }, (_, i) => generateCase({ seed: `leak-${i}`, difficulty: (["easy", "medium", "hard"] as const)[i % 3] }));
  const crime = (t: (typeof cases)[number]) => t.locations.find((l) => l.id === t.solution.locationId)!;

  it("title, victim note and room description never name or mark the crime room", () => {
    for (const t of cases) {
      const room = crime(t);
      expect(t.title).not.toContain(room.name.replace(/^The /, ""));
      expect(t.victim.description).not.toContain(room.name);
      expect(new Set(t.locations.map((l) => l.description)).size === 1 || !/found|body|killed/i.test(room.description)).toBe(true);
    }
  });

  it("exhibits do not pile up in the crime room", () => {
    const pileUps = cases.filter((t) => {
      const count = (id: string) => t.evidence.filter((e) => e.locationId === id).length;
      const c = count(crime(t).id);
      return t.locations.every((l) => l.id === crime(t).id || count(l.id) < c);
    }).length;
    expect(pileUps / cases.length).toBeLessThan(0.5);
  });

  it("the crime room is not reliably the one room nobody claims to have been in", () => {
    const giveaways = cases.filter((t) => {
      const claimed = new Set(t.characters.map((c) => c.claimedLocation));
      const unclaimed = t.locations.filter((l) => !claimed.has(l.id));
      return unclaimed.length === 1 && unclaimed[0].id === crime(t).id;
    }).length;
    expect(giveaways / cases.length).toBeLessThan(0.25);
  });
});
