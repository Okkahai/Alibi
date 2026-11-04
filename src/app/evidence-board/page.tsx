"use client";

import { useRef, useState } from "react";
import { useGame } from "@/lib/state/game-context";
import { knownEvents } from "@/lib/state/known-events";
import type { BoardNode } from "@/lib/schema/game-state";
import type { CaseTruth } from "@/lib/schema/case-truth";

function labelFor(truth: CaseTruth, node: BoardNode): string {
  if (node.kind === "note") return node.text ?? "Note";
  if (node.kind === "suspect") return truth.characters.find((c) => c.id === node.refId)?.name ?? node.refId ?? "?";
  if (node.kind === "evidence") {
    const i = truth.evidence.findIndex((e) => e.id === node.refId);
    return i < 0 ? "?" : `EX-${String(i + 1).padStart(2, "0")} · ${truth.evidence[i].description}`;
  }
  if (node.kind === "location") return truth.locations.find((l) => l.id === node.refId)?.name ?? "?";
  if (node.kind === "event") return truth.timeline.find((e) => e.id === node.refId)?.time ?? "?";
  return "?";
}

export default function EvidenceBoardPage() {
  const { truth, state, addBoardNode, removeBoardNode, addBoardConnection, setNotes } = useGame();
  const boardRef = useRef<HTMLDivElement>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [addKind, setAddKind] = useState<BoardNode["kind"]>("suspect");
  const [addRefId, setAddRefId] = useState("");

  const suspects = truth.characters.filter((c) => c.role !== "victim");
  const discoveredEvidence = truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id));

  function handleAdd() {
    const board = boardRef.current;
    const x = 40 + Math.random() * (board ? board.clientWidth - 160 : 400);
    const y = 40 + Math.random() * (board ? board.clientHeight - 100 : 200);
    addBoardNode({
      id: crypto.randomUUID(),
      kind: addKind,
      refId: addKind === "note" ? undefined : addRefId || undefined,
      text: addKind === "note" ? "New note" : undefined,
      x,
      y,
    });
  }

  function handleNodeClick(nodeId: string) {
    if (!connectFrom) {
      setConnectFrom(nodeId);
      return;
    }
    if (connectFrom !== nodeId) {
      addBoardConnection({ id: crypto.randomUUID(), fromNodeId: connectFrom, toNodeId: nodeId });
    }
    setConnectFrom(null);
  }

  const refOptions: Record<string, { id: string; label: string }[]> = {
    suspect: suspects.map((c) => ({ id: c.id, label: c.name })),
    evidence: discoveredEvidence.map((e) => ({ id: e.id, label: `EX-${String(truth.evidence.indexOf(e) + 1).padStart(2, "0")} · ${e.description.slice(0, 48)}…` })),
    location: truth.locations.map((l) => ({ id: l.id, label: l.name })),
    event: knownEvents(truth, state).map((e) => ({ id: e.id, label: `${e.time} ${e.description.slice(0, 30)}` })),
    note: [],
  };

  const control = "min-h-11 px-3 bg-[var(--surface)] border border-[var(--rule-strong)] text-sm";

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col md:flex-row md:items-end gap-3 border-b-2 border-[var(--rule-strong)] pb-4">
        <div>
          <p className="label text-[var(--copper)]">Section VI · The board</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium">Working theory</h1>
        </div>
        <p className="md:ml-auto md:max-w-[24rem] text-sm text-[var(--muted)]">
          Pin persons, exhibits, rooms and established events; select two cards to tie them with thread.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          <span className="label text-[var(--muted)]">Kind</span>
          <select
            value={addKind}
            onChange={(e) => {
              setAddKind(e.target.value as BoardNode["kind"]);
              setAddRefId("");
            }}
            className={control}
          >
            <option value="suspect">Person</option>
            <option value="evidence">Exhibit</option>
            <option value="location">Room</option>
            <option value="event">Event</option>
            <option value="note">Note</option>
          </select>
        </label>
        {addKind !== "note" && (
          <label className="grid gap-1">
            <span className="label text-[var(--muted)]">Item</span>
            <select value={addRefId} onChange={(e) => setAddRefId(e.target.value)} className={`${control} min-w-48`}>
              <option value="">Select…</option>
              {refOptions[addKind].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className="btn btn-primary" onClick={handleAdd} disabled={addKind !== "note" && !addRefId}>
          Pin to board
        </button>
        <span className="label text-[var(--muted)] ml-auto" aria-live="polite">
          {connectFrom ? "Select a second card to tie the thread." : "Select two cards to tie a thread."}
        </span>
      </div>

      <div
        ref={boardRef}
        className="on-ink relative h-[60vh] overflow-hidden"
        style={{ backgroundImage: "linear-gradient(var(--ink-rule) 1px, transparent 1px), linear-gradient(90deg, var(--ink-rule) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      >
        {state.boardNodes.length === 0 && <p className="absolute inset-0 grid place-items-center label text-[var(--on-ink-muted)]">Nothing pinned yet</p>}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {state.boardConnections.map((conn) => {
            const from = state.boardNodes.find((n) => n.id === conn.fromNodeId);
            const to = state.boardNodes.find((n) => n.id === conn.toNodeId);
            if (!from || !to) return null;
            return <line key={conn.id} x1={from.x + 64} y1={from.y + 22} x2={to.x + 64} y2={to.y + 22} stroke="var(--brass-light)" strokeWidth={1.5} />;
          })}
        </svg>
        {state.boardNodes.map((node) => (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            aria-pressed={connectFrom === node.id}
            onClick={() => handleNodeClick(node.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleNodeClick(node.id)}
            className={`absolute w-32 bg-[var(--surface)] text-[var(--ink)] px-2 py-1.5 text-xs cursor-pointer border-t-4 ${connectFrom === node.id ? "border-[var(--accent)] outline outline-2 outline-[var(--brass-light)]" : "border-[var(--brass)]"}`}
            style={{ left: node.x, top: node.y }}
          >
            <div className="flex items-center justify-between">
              <span className="label text-[0.6rem] text-[var(--copper)]">{node.kind === "suspect" ? "person" : node.kind === "location" ? "room" : node.kind === "evidence" ? "exhibit" : node.kind}</span>
              <button
                aria-label="Unpin"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBoardNode(node.id);
                }}
                className="text-[var(--muted)] hover:text-[var(--danger)] -my-2 -mr-2 min-w-11 min-h-11"
              >
                ×
              </button>
            </div>
            <p className="mt-0.5 truncate">{labelFor(truth, node)}</p>
          </div>
        ))}
      </div>

      <label className="grid gap-2">
        <span className="label text-[var(--muted)] border-b-2 border-[var(--rule-strong)] pb-2">Notes and theory</span>
        <textarea
          value={state.playerNotes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="w-full p-3 text-sm bg-[var(--surface)] border border-[var(--rule-strong)] leading-7"
          style={{ backgroundImage: "linear-gradient(transparent 27px, var(--border) 28px)", backgroundSize: "100% 28px", backgroundAttachment: "local" }}
          placeholder="Write your working theory here…"
        />
      </label>
    </article>
  );
}
