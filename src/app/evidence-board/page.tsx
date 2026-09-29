"use client";

import { useRef, useState } from "react";
import { useGame } from "@/lib/state/game-context";
import type { BoardNode } from "@/lib/schema/game-state";
import type { CaseTruth } from "@/lib/schema/case-truth";

function labelFor(truth: CaseTruth, node: BoardNode): string {
  if (node.kind === "note") return node.text ?? "Note";
  if (node.kind === "suspect") return truth.characters.find((c) => c.id === node.refId)?.name ?? node.refId ?? "?";
  if (node.kind === "evidence") return truth.evidence.find((e) => e.id === node.refId)?.type.replace("_", " ") ?? "?";
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
    evidence: discoveredEvidence.map((e) => ({ id: e.id, label: `${e.type}: ${e.description.slice(0, 30)}` })),
    location: truth.locations.map((l) => ({ id: l.id, label: l.name })),
    event: truth.timeline.map((e) => ({ id: e.id, label: `${e.time} ${e.description.slice(0, 30)}` })),
    note: [],
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="panel p-3 flex flex-wrap items-center gap-2">
        <select
          value={addKind}
          onChange={(e) => {
            setAddKind(e.target.value as BoardNode["kind"]);
            setAddRefId("");
          }}
          className="panel-raised px-2 py-1 rounded text-sm"
        >
          <option value="suspect">Suspect</option>
          <option value="evidence">Evidence</option>
          <option value="location">Location</option>
          <option value="event">Event</option>
          <option value="note">Note</option>
        </select>
        {addKind !== "note" && (
          <select value={addRefId} onChange={(e) => setAddRefId(e.target.value)} className="panel-raised px-2 py-1 rounded text-sm min-w-40">
            <option value="">Select...</option>
            {refOptions[addKind].map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button className="btn btn-primary" onClick={handleAdd} disabled={addKind !== "note" && !addRefId}>
          Pin to board
        </button>
        <span className="text-xs text-[var(--muted)] ml-auto">
          {connectFrom ? "Click another card to connect it." : "Click two cards to draw a connection."}
        </span>
      </div>

      <div ref={boardRef} className="panel relative h-[60vh] overflow-hidden" style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {state.boardConnections.map((conn) => {
            const from = state.boardNodes.find((n) => n.id === conn.fromNodeId);
            const to = state.boardNodes.find((n) => n.id === conn.toNodeId);
            if (!from || !to) return null;
            return (
              <line
                key={conn.id}
                x1={from.x + 60}
                y1={from.y + 20}
                x2={to.x + 60}
                y2={to.y + 20}
                stroke="var(--accent)"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        {state.boardNodes.map((node) => (
          <div
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            className={`absolute w-32 panel-raised px-2 py-1.5 text-xs rounded cursor-pointer ${
              connectFrom === node.id ? "border-[var(--accent)]" : ""
            }`}
            style={{ left: node.x, top: node.y }}
          >
            <div className="flex items-center justify-between">
              <span className="uppercase text-[9px] text-[var(--muted)]">{node.kind}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBoardNode(node.id);
                }}
                className="text-[var(--muted)] hover:text-[var(--danger)]"
              >
                ×
              </button>
            </div>
            <p className="mt-0.5 truncate">{labelFor(truth, node)}</p>
          </div>
        ))}
      </div>

      <div className="panel p-4">
        <h3 className="text-sm uppercase tracking-widest text-[var(--muted)] mb-2">Notes &amp; Theory</h3>
        <textarea
          value={state.playerNotes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full panel-raised p-2 text-sm rounded outline-none"
          placeholder="Write your working theory here..."
        />
      </div>
    </div>
  );
}
