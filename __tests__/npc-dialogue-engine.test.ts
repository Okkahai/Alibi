import { describe, it, expect } from "vitest";
import { theVossManorCase } from "@/data/cases/the-voss-manor-case";
import { askNpc } from "@/lib/engines/npc-dialogue-engine";
import { buildKnowledgePacket } from "@/lib/engines/knowledge-packet";
import { checkGroundedness } from "@/lib/engines/groundedness";

describe("askNpc anti-hallucination guarantees", () => {
  it("never mentions a character the player hasn't been told about, for any suspect and question", async () => {
    const questions = [
      "Where were you at 11pm?",
      "Did you speak to Richard that night?",
      "Tell me about the wine cellar.",
      "What do you know about the will?",
    ];
    for (const character of theVossManorCase.characters) {
      for (const q of questions) {
        const result = await askNpc({
          truth: theVossManorCase,
          characterId: character.id,
          conversation: undefined,
          discoveredEvidenceIds: [],
          evidenceShownId: null,
          playerQuestion: q,
        });
        expect(result.rejected).toBe(false);
      }
    }
  });

  it("refuses evidence the player has not discovered", async () => {
    await expect(
      askNpc({
        truth: theVossManorCase,
        characterId: "char_marcus",
        conversation: undefined,
        discoveredEvidenceIds: [],
        evidenceShownId: "ev_fingerprint_decanter",
        playerQuestion: "Explain this.",
      })
    ).rejects.toThrow(/not discovered/);
  });

  it("unlocks a lie's fallback only once its breaking evidence is discovered", async () => {
    const packetBefore = buildKnowledgePacket(theVossManorCase, "char_marcus", undefined, [], null);
    expect(packetBefore.availableLies.some((l) => l.falseClaim.includes("brandy"))).toBe(false);

    const packetAfter = buildKnowledgePacket(
      theVossManorCase,
      "char_marcus",
      undefined,
      ["ev_fingerprint_decanter"],
      null
    );
    expect(packetAfter.availableLies.some((l) => l.falseClaim.includes("brandy"))).toBe(true);
  });

  it("groundedness check flags a reply that invents an unrelated character's name", () => {
    const packet = buildKnowledgePacket(theVossManorCase, "char_priya", undefined, [], null);
    const hallucinated = "Marcus Reed told me he did it himself, right before he left with Daniel Voss.";
    const check = checkGroundedness(theVossManorCase, packet, hallucinated);
    expect(check.ok).toBe(false);
    expect(check.violations).toContain("Daniel Voss");
  });
});
