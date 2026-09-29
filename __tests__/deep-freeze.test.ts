import { describe, it, expect } from "vitest";
import { theVossManorCase } from "@/data/cases/the-voss-manor-case";
import { deepFreeze } from "@/lib/schema/deep-freeze";

describe("CaseTruth immutability", () => {
  it("is frozen at every level, not just the top object", () => {
    expect(Object.isFrozen(theVossManorCase)).toBe(true);
    expect(Object.isFrozen(theVossManorCase.characters)).toBe(true);
    expect(Object.isFrozen(theVossManorCase.characters[0])).toBe(true);
    expect(Object.isFrozen(theVossManorCase.characters[0].knowledge)).toBe(true);
    expect(Object.isFrozen(theVossManorCase.evidence[0])).toBe(true);
    expect(Object.isFrozen(theVossManorCase.solution)).toBe(true);
  });

  it("throws on any attempt to mutate the case truth at runtime", () => {
    expect(() => {
      (theVossManorCase as { title: string }).title = "Rewritten";
    }).toThrow(TypeError);

    expect(() => {
      (theVossManorCase.characters[0] as { isCulprit: boolean }).isCulprit = true;
    }).toThrow(TypeError);

    expect(() => {
      theVossManorCase.evidence.push({} as never);
    }).toThrow(TypeError);
  });
});

describe("deepFreeze", () => {
  it("handles cycles and primitives without infinite recursion or throwing", () => {
    const obj: Record<string, unknown> = { a: 1, b: "two" };
    obj.self = obj;
    expect(() => deepFreeze(obj)).not.toThrow();
    expect(Object.isFrozen(obj)).toBe(true);
  });
});
