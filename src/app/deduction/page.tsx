"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useGame } from "@/lib/state/game-context";
import { hintKey, loadHints, nextHint, type HintState } from "@/lib/state/hints";
import { cellKey, isComplete, nextMark, setMark, type Axis, type Block, type Cells, type Mark } from "@/lib/state/matrix";

interface Saved {
  cells: Cells;
  struck: string[];
  propagate: boolean;
}

function load(key: string): Saved {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return { cells: {}, struck: [], propagate: true, ...JSON.parse(raw) };
  } catch {
    // unreadable storage: start blank
  }
  return { cells: {}, struck: [], propagate: true };
}

/** A grid position: which block it belongs to, or null for the omitted corner. */
interface Pos {
  block: Block | null;
  rowId: string;
  colId: string;
}

export default function DeductionPage() {
  const { truth, state } = useGame();
  const storageKey = `coldcase:matrix:${truth.id}`;
  const [saved, setSaved] = useState<Saved>(() => load(storageKey));
  const [history, setHistory] = useState<{ past: Cells[]; future: Cells[] }>({ past: [], future: [] });
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const [hints, setHints] = useState<HintState>(() => loadHints(truth.id));
  const [hintText, setHintText] = useState<string | null>(null);

  function askHint() {
    const h = nextHint(truth, saved.cells, state.discoveredEvidenceIds, hints);
    if (!h) return;
    setHintText(h.text);
    setHints(h.state);
    try {
      window.localStorage.setItem(hintKey(truth.id), JSON.stringify(h.state));
    } catch {
      // storage blocked: the hint still shows, the count is not kept
    }
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      // storage full or blocked: the grid still works for this visit
    }
  }, [saved, storageKey]);

  const persons: Axis = { key: "person", label: "Persons", items: truth.characters.filter((c) => c.role === "suspect").map((c) => ({ id: c.id, name: c.name })) };
  const rooms: Axis = { key: "room", label: "Rooms", items: truth.locations.map((l) => ({ id: l.id, name: l.name })) };
  const methods: Axis = { key: "method", label: "Methods", items: truth.methods };
  const hasMethods = methods.items.length > 0;

  // Staircase: columns = methods + rooms, rows = persons + rooms (rooms × rooms omitted).
  const colAxes = hasMethods ? [methods, rooms] : [rooms];
  const rowAxes = hasMethods ? [persons, rooms] : [persons];
  const columns = colAxes.flatMap((a) => a.items.map((it, i) => ({ axis: a, item: it, first: i === 0 })));
  const rows = rowAxes.flatMap((a) => a.items.map((it, i) => ({ axis: a, item: it, first: i === 0 })));
  const blocks: Block[] = hasMethods
    ? [
        { rows: persons, cols: methods },
        { rows: persons, cols: rooms },
        { rows: rooms, cols: methods },
      ]
    : [{ rows: persons, cols: rooms }];

  const posAt = (r: number, c: number): Pos => {
    const row = rows[r];
    const col = columns[c];
    const block = blocks.find((b) => b.rows === row.axis && b.cols === col.axis) ?? null;
    return { block, rowId: row.item.id, colId: col.item.id };
  };

  const markAt = (p: Pos) => (p.block ? saved.cells[cellKey(p.block.rows.key, p.rowId, p.block.cols.key, p.colId)] : undefined);

  function apply(p: Pos, mark: Mark | undefined) {
    if (!p.block) return;
    const block = p.block;
    setSaved((s) => ({ ...s, cells: setMark(s.cells, block, p.rowId, p.colId, mark, s.propagate) }));
    setHistory((h) => ({ past: [...h.past, saved.cells].slice(-200), future: [] }));
  }

  function undo() {
    if (!history.past.length) return;
    const prev = history.past[history.past.length - 1];
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [saved.cells, ...h.future] }));
    setSaved((s) => ({ ...s, cells: prev }));
  }

  function redo() {
    if (!history.future.length) return;
    const [next, ...rest] = history.future;
    setHistory((h) => ({ past: [...h.past, saved.cells], future: rest }));
    setSaved((s) => ({ ...s, cells: next }));
  }

  function move(r: number, c: number, dr: number, dc: number) {
    let nr = r;
    let nc = c;
    for (let i = 0; i < rows.length + columns.length; i++) {
      nr += dr;
      nc += dc;
      if (nr < 0 || nc < 0 || nr >= rows.length || nc >= columns.length) return;
      if (posAt(nr, nc).block) break;
    }
    setFocus([nr, nc]);
    cellRefs.current.get(`${nr},${nc}`)?.focus();
  }

  function onKey(e: KeyboardEvent, r: number, c: number) {
    const p = posAt(r, c);
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "z") return e.preventDefault(), e.shiftKey ? redo() : undo();
    if ((e.ctrlKey || e.metaKey) && k === "y") return e.preventDefault(), redo();
    const moves: Record<string, [number, number]> = { arrowup: [-1, 0], arrowdown: [1, 0], arrowleft: [0, -1], arrowright: [0, 1] };
    if (moves[k]) return e.preventDefault(), move(r, c, ...moves[k]);
    if (k === "x") return apply(p, "x");
    if (k === "v" || k === "o") return apply(p, "o");
    if (k === "backspace" || k === "delete") return apply(p, undefined);
  }

  useEffect(() => {
    const onWindowKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!(e.ctrlKey || e.metaKey) || t?.closest("input, textarea, select, [contenteditable]") || t?.closest("[data-matrix-cell]")) return;
      const k = e.key.toLowerCase();
      if (k !== "z" && k !== "y") return;
      e.preventDefault();
      if (k === "z" && !e.shiftKey) undo();
      else redo();
    };
    window.addEventListener("keydown", onWindowKey);
    return () => window.removeEventListener("keydown", onWindowKey);
  });

  const complete = isComplete(saved.cells, blocks);
  const exhibits = useMemo(
    () => truth.evidence.map((ev, i) => ({ ev, no: `EX-${String(i + 1).padStart(2, "0")}` })).filter(({ ev }) => state.discoveredEvidenceIds.includes(ev.id)),
    [truth.evidence, state.discoveredEvidenceIds]
  );

  const cellBase = "w-11 h-11 md:w-12 md:h-12 grid place-items-center text-lg";

  // Rendered beside the grid on wide screens and above it on narrow ones, so a hint is never a scroll away.
  const hintPanel = (
    <>
      <h2 className="label text-[var(--muted)] border-b-2 border-[var(--rule-strong)] pb-2">Consulting detective</h2>
      <p className="mt-3 text-sm text-[var(--muted)] hidden xl:block">
        Stuck? Each request goes one step further: where to look, what it shows, then the mark to make. Each costs 3 points on the finding.
      </p>
      <div aria-live="polite">
        {hintText && <p className="mt-3 display text-xl italic border-l-2 border-[var(--accent)] pl-3">{hintText}</p>}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn" onClick={askHint}>
          {hints.last ? "Further hint" : "Ask for a hint"}
        </button>
        <span className="label text-[var(--muted)]">{hints.used} used · 3 pts each</span>
      </div>
    </>
  );

  return (
    <article>
      <header className="flex flex-col md:flex-row md:items-end gap-3 border-b-2 border-[var(--rule-strong)] pb-4">
        <div>
          <p className="label text-[var(--copper)]">Section VII · Deduction</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium leading-none">The matrix</h1>
        </div>
        <p className="md:ml-auto md:max-w-[26rem] text-sm text-[var(--muted)]">
          One person did it, by one method, in one room, and that person is the one whose alibi breaks. Each block asks whether that pairing could be the crime: mark what the exhibits rule out (✕) and what they prove (✓). Click a cell to cycle; keys: arrows, X, V, Delete, Ctrl+Z. New here? <Link href="/tutorial" className="underline underline-offset-4">Two-minute walkthrough</Link>.
        </p>
      </header>

      <div className="mt-6 grid gap-8 grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-start">
        <section aria-label="Deduction matrix" className="min-w-0">
          {truth.deduction.length > 0 && <div className="xl:hidden mb-6">{hintPanel}</div>}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button className="btn" onClick={undo} disabled={!history.past.length}>
              Undo
            </button>
            <button className="btn" onClick={redo} disabled={!history.future.length}>
              Redo
            </button>
            <label className="label flex items-center gap-2 min-h-11 px-2 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-[var(--accent)]" checked={saved.propagate} onChange={(e) => setSaved((s) => ({ ...s, propagate: e.target.checked }))} />
              Auto-cross on ✓
            </label>
            <button
              className="btn ml-auto"
              disabled={!Object.keys(saved.cells).length}
              onClick={() => {
                setHistory((h) => ({ past: [...h.past, saved.cells], future: [] }));
                setSaved((s) => ({ ...s, cells: {} }));
              }}
            >
              Clear
            </button>
          </div>

          <div className="relative overflow-x-auto border border-[var(--rule-strong)] bg-[var(--surface)]">
            <table role="grid" aria-label="Persons, methods and rooms" className="border-collapse" onMouseLeave={() => setHover(null)}>
              <thead>
                <tr>
                  <th className="on-ink sticky left-0 z-[1] align-bottom text-left p-3 min-w-[10rem]">
                    <span className="label text-[var(--brass-light)]">Matrix</span>
                    <span className="display block text-lg italic">{truth.title}</span>
                  </th>
                  {columns.map((col, c) => (
                    <th
                      key={col.axis.key + col.item.id}
                      scope="col"
                      className={`on-ink align-bottom p-1 pb-2 h-56 ${col.first && c > 0 ? "border-l-2 border-[var(--brass)]" : ""} ${hover?.[1] === c ? "text-[var(--brass-light)]" : ""}`}
                    >
                      {col.first && <span className="sr-only">{col.axis.label}: </span>}
                      <span className="inline-block [writing-mode:vertical-rl] rotate-180 text-sm whitespace-nowrap max-h-52 overflow-hidden text-ellipsis" title={col.item.name}>{col.item.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={row.axis.key + row.item.id} className={row.first && r > 0 ? "border-t-2 border-[var(--rule-strong)]" : ""}>
                    <th scope="row" className={`sticky left-0 z-[1] text-left px-3 py-0 border-b border-r border-[var(--border)] whitespace-nowrap font-normal ${hover?.[0] === r ? "bg-[var(--surface-raised)]" : "bg-[var(--surface)]"}`}>
                      {row.first && <span className="label block text-[var(--copper)] pt-1">{row.axis.label}</span>}
                      {row.item.name}
                    </th>
                    {columns.map((col, c) => {
                      const p = posAt(r, c);
                      if (!p.block) return <td key={col.axis.key + col.item.id} className="bg-[var(--background)]" aria-hidden="true" />;
                      const mark = markAt(p);
                      const active = focus[0] === r && focus[1] === c;
                      const lit = hover && (hover[0] === r || hover[1] === c);
                      return (
                        <td key={col.axis.key + col.item.id} className={`p-0 border border-[var(--border)] ${col.first && c > 0 ? "border-l-2 border-l-[var(--rule-strong)]" : ""}`}>
                          <button
                            ref={(el) => {
                              if (el) cellRefs.current.set(`${r},${c}`, el);
                            }}
                            tabIndex={active ? 0 : -1}
                            aria-label={`${row.item.name} and ${col.item.name}: ${mark === "o" ? "confirmed" : mark === "x" ? "ruled out" : "open"}`}
                            onClick={() => {
                              setFocus([r, c]);
                              apply(p, nextMark(mark));
                            }}
                            data-matrix-cell
                            onKeyDown={(e) => onKey(e, r, c)}
                            onMouseEnter={() => setHover([r, c])}
                            onFocus={() => setFocus([r, c])}
                            className={`${cellBase} ${lit ? "bg-[var(--surface-raised)]" : ""} ${mark === "o" ? "text-[var(--confirmed)] font-bold" : mark === "x" ? "text-[var(--muted)]" : ""}`}
                          >
                            {mark === "o" ? "✓" : mark === "x" ? "✕" : ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 label text-[var(--muted)]" aria-live="polite">
            {complete ? (
              <span className="block border-l-4 border-[var(--confirmed)] pl-3 py-2 text-base normal-case tracking-normal text-[var(--foreground)]">
                <strong className="display text-xl italic text-[var(--confirmed)]">The grid names one person, one method, one room.</strong>{" "}
                <Link href="/accusation" className="underline underline-offset-4">
                  Proceed to the conclusion →
                </Link>
              </span>
            ) : (
              `${Object.values(saved.cells).filter((m) => m === "o").length} confirmed · ${Object.values(saved.cells).filter((m) => m === "x").length} ruled out`
            )}
          </p>
          {!hasMethods && <p className="mt-1 text-sm text-[var(--muted)]">This handcrafted file was not built for the matrix; only persons and rooms are listed.</p>}
        </section>

        <section aria-label="Exhibits for reference" className="min-w-0 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
          {truth.deduction.length > 0 && <div className="hidden xl:block mb-8">{hintPanel}</div>}
          <h2 className="label text-[var(--muted)] border-b-2 border-[var(--rule-strong)] pb-2">Exhibits on the desk · tap to strike when used</h2>
          {exhibits.length === 0 && (
            <p className="py-4 text-sm text-[var(--muted)]">
              No exhibits recovered yet. <Link href="/crime-scene" className="underline underline-offset-4">Search the scene</Link>.
            </p>
          )}
          <ol>
            {exhibits.map(({ ev, no }) => {
              const struck = saved.struck.includes(ev.id);
              return (
                <li key={ev.id} className="border-b border-[var(--border)]">
                  <button
                    aria-pressed={struck}
                    onClick={() => setSaved((s) => ({ ...s, struck: struck ? s.struck.filter((x) => x !== ev.id) : [...s.struck, ev.id] }))}
                    className="w-full text-left py-2.5 grid grid-cols-[3.5rem_1fr] gap-2 min-h-11"
                  >
                    <span className="mono text-sm text-[var(--copper)]">{no}</span>
                    <span className={struck ? "line-through text-[var(--muted)]" : ""}>{ev.description}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </article>
  );
}
