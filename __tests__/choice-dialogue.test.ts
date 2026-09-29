import { describe, it, expect } from "vitest";
import { generateCase } from "@/lib/engines/case-generator";
import { answerTopic, confront } from "@/lib/engines/choice-dialogue";

const truth = generateCase({ seed: "choice-test", difficulty: "medium" });
const culprit = truth.characters.find((c) => c.isCulprit)!;
const innocentLiar = truth.characters.find((c) => !c.isCulprit && c.lies.length > 0)!;

describe("choice dialogue", () => {
  it("answers deterministically from the case, lie included", () => {
    expect(answerTopic(truth, culprit, "whereabouts")).toBe(culprit.lies[0].falseClaim);
    expect(answerTopic(truth, culprit, "whereabouts")).toBe(answerTopic(truth, culprit, "whereabouts"));
  });

  it("only breaks a lie with evidence that actually contradicts it", () => {
    expect(confront(truth, innocentLiar, "ev_redherring_0").contradictionIds).toEqual([]);
    const idx = innocentLiar.id.split("_")[1];
    const hit = confront(truth, innocentLiar, `ev_contra_${idx}`);
    expect(hit.contradictionIds).toEqual([`contra_${innocentLiar.id}`]);
    expect(hit.text).toContain("private");
  });

  it("does not make the culprit confess", () => {
    const idx = culprit.id.split("_")[1];
    expect(confront(truth, culprit, `ev_contra_${idx}`).text).toContain("not saying");
  });
});
