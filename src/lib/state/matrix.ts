/**
 * Deduction matrix state (§10C): a Murdle-style grid of pairwise blocks
 * between axes. Pure functions so the propagation rule is unit-tested.
 */
export type Mark = "x" | "o";
export type Cells = Record<string, Mark>;

export interface Axis {
  key: string;
  label: string;
  items: { id: string; name: string }[];
}

/** One block of the staircase: rows from one axis, columns from another. */
export interface Block {
  rows: Axis;
  cols: Axis;
}

export function cellKey(rowAxis: string, rowId: string, colAxis: string, colId: string) {
  return `${rowAxis}:${rowId}|${colAxis}:${colId}`;
}

/** empty → ✕ → ✓ → empty */
export function nextMark(current: Mark | undefined): Mark | undefined {
  return current === undefined ? "x" : current === "x" ? "o" : undefined;
}

/**
 * Set one cell. With `propagate`, a ✓ also fills ✕ into the empty cells of
 * its row and column inside the same block (each pairing is one-to-one).
 */
export function setMark(cells: Cells, block: Block, rowId: string, colId: string, mark: Mark | undefined, propagate: boolean): Cells {
  const next = { ...cells };
  const key = cellKey(block.rows.key, rowId, block.cols.key, colId);
  if (mark) next[key] = mark;
  else delete next[key];
  if (mark === "o" && propagate) {
    for (const c of block.cols.items) {
      const k = cellKey(block.rows.key, rowId, block.cols.key, c.id);
      if (c.id !== colId && !next[k]) next[k] = "x";
    }
    for (const r of block.rows.items) {
      const k = cellKey(block.rows.key, r.id, block.cols.key, colId);
      if (r.id !== rowId && !next[k]) next[k] = "x";
    }
  }
  return next;
}

/** Every row and column of every block holds exactly one ✓. */
export function isComplete(cells: Cells, blocks: Block[]): boolean {
  return blocks.every(
    (b) =>
      b.rows.items.every((r) => b.cols.items.filter((c) => cells[cellKey(b.rows.key, r.id, b.cols.key, c.id)] === "o").length === 1) &&
      b.cols.items.every((c) => b.rows.items.filter((r) => cells[cellKey(b.rows.key, r.id, b.cols.key, c.id)] === "o").length === 1)
  );
}
