import { describe, it, expect } from "vitest";
import { generateCase } from "@/lib/engines/narrative-generator";
import { nextHint, EMPTY_HINTS } from "@/lib/state/hints";
import { cellKey } from "@/lib/state/matrix";

const truth = generateCase({ seed: "hint-seed", difficulty: "medium" });
const all = truth.evidence.map((e) => e.id);

describe("hints", () => {
  it("escalates direction → deduction → named mark on the same step, then holds", () => {
    const h1 = nextHint(truth, {}, all, EMPTY_HINTS)!;
    const h2 = nextHint(truth, {}, all, h1.state)!;
    const h3 = nextHint(truth, {}, all, h2.state)!;
    const h4 = nextHint(truth, {}, all, h3.state)!;
    expect([h1.state.last?.level, h2.state.last?.level, h3.state.last?.level]).toEqual([1, 2, 3]);
    expect(h3.text).toMatch(/rules out|only one/);
    expect(h4.state.used).toBe(3);
  });

  it("moves on once the grid records the step, and never names the true answer in an elimination", () => {
    const step = truth.deduction[0];
    expect(step.kind).toBe("eliminate");
    const ans = (axis: string) => truth.deduction.find((s) => s.kind === "confirm" && s.axis === axis)!.value;
    // A correct ✓ on the same axis records the elimination.
    const cells =
      step.axis === "method"
        ? { [cellKey("person", ans("culprit"), "method", ans("method"))]: "o" as const }
        : { [cellKey("person", ans("culprit"), "room", ans("location"))]: "o" as const };
    const h = nextHint(truth, cells, all, EMPTY_HINTS)!;
    expect(h.state.last?.step).toBeGreaterThan(0);
  });

  it("points to the room of an unexamined exhibit instead of quoting it", () => {
    const h = nextHint(truth, {}, [], EMPTY_HINTS)!;
    expect(h.text).toMatch(/marker you have not examined/);
  });

  it("flags a mark that contradicts the exhibits before anything else", () => {
    const culprit = truth.deduction.find((s) => s.kind === "confirm" && s.axis === "culprit")!.value;
    const room = truth.deduction.find((s) => s.kind === "confirm" && s.axis === "location")!.value;
    const h = nextHint(truth, { [cellKey("person", culprit, "room", room)]: "x" }, all, EMPTY_HINTS)!;
    expect(h.text).toMatch(/contradicts/);
  });
});
