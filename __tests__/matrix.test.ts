import { describe, it, expect } from "vitest";
import { setMark, nextMark, isComplete, cellKey, type Block } from "@/lib/state/matrix";

const axis = (key: string, n: number) => ({ key, label: key, items: Array.from({ length: n }, (_, i) => ({ id: `${key}${i}`, name: `${key}${i}` })) });
const block: Block = { rows: axis("s", 2), cols: axis("m", 2) };

describe("deduction matrix", () => {
  it("cycles empty → ✕ → ✓ → empty", () => {
    expect(nextMark(undefined)).toBe("x");
    expect(nextMark("x")).toBe("o");
    expect(nextMark("o")).toBeUndefined();
  });

  it("a ✓ with propagation crosses out its row and column, but never overwrites a mark", () => {
    const start = { [cellKey("s", "s1", "m", "m0")]: "o" as const };
    const cells = setMark(start, block, "s0", "m0", "o", true);
    expect(cells[cellKey("s", "s0", "m", "m1")]).toBe("x");
    expect(cells[cellKey("s", "s1", "m", "m0")]).toBe("o");
    expect(cells[cellKey("s", "s1", "m", "m1")]).toBeUndefined();
  });

  it("without propagation only the clicked cell changes, and completion needs one ✓ per row and column", () => {
    let cells = setMark({}, block, "s0", "m0", "o", false);
    expect(Object.keys(cells)).toHaveLength(1);
    expect(isComplete(cells, [block])).toBe(false);
    cells = setMark(cells, block, "s1", "m1", "o", false);
    expect(isComplete(cells, [block])).toBe(true);
  });
});
