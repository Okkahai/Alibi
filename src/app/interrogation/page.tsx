"use client";

import { useState } from "react";
import { useGame } from "@/lib/state/game-context";
import type { DialogueTurn } from "@/lib/schema/game-state";

export default function InterrogationPage() {
  const { truth, state, appendTurn } = useGame();
  const suspects = truth.characters.filter((c) => c.role !== "victim");
  const [characterId, setCharacterId] = useState(suspects[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [evidenceShownId, setEvidenceShownId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const conversation = state.conversations.find((c) => c.characterId === characterId);
  const discoveredEvidence = truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id));

  async function ask() {
    if (!question.trim() || loading) return;
    setLoading(true);
    const playerTurn: DialogueTurn = {
      id: crypto.randomUUID(),
      speaker: "player",
      text: question,
      evidenceShownId: evidenceShownId || undefined,
      timestamp: new Date().toISOString(),
    };
    appendTurn(characterId, playerTurn);

    try {
      const res = await fetch("/api/npc/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: truth.id,
          characterId,
          playerQuestion: question,
          discoveredEvidenceIds: state.discoveredEvidenceIds,
          evidenceShownId: evidenceShownId || null,
          conversationTurns: conversation?.turns ?? [],
        }),
      });
      const data = await res.json();
      const npcTurn: DialogueTurn = {
        id: crypto.randomUUID(),
        speaker: "npc",
        text: data.text ?? "...",
        timestamp: new Date().toISOString(),
      };
      appendTurn(characterId, npcTurn);
    } finally {
      setQuestion("");
      setEvidenceShownId("");
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="panel p-4 flex flex-col gap-2">
        <h2 className="text-sm uppercase tracking-widest text-[var(--muted)]">Suspects</h2>
        {suspects.map((c) => (
          <button
            key={c.id}
            onClick={() => setCharacterId(c.id)}
            className={`text-left px-3 py-2 rounded ${
              c.id === characterId ? "bg-[var(--surface-raised)] border border-[var(--accent)]" : "hover:bg-[var(--surface-raised)]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="lg:col-span-3 panel p-4 flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {(conversation?.turns ?? []).length === 0 && (
            <p className="text-sm text-[var(--muted)]">Ask a natural-language question to begin.</p>
          )}
          {(conversation?.turns ?? []).map((t) => (
            <div key={t.id} className={`max-w-[80%] px-3 py-2 rounded text-sm ${t.speaker === "player" ? "self-end bg-[var(--accent)] text-[var(--accent-foreground)]" : "self-start panel-raised"}`}>
              {t.text}
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <select
            value={evidenceShownId}
            onChange={(e) => setEvidenceShownId(e.target.value)}
            className="panel-raised px-2 py-1 text-sm rounded"
          >
            <option value="">No evidence shown</option>
            {discoveredEvidence.map((ev) => (
              <option key={ev.id} value={ev.id}>
                Show: {ev.description.slice(0, 60)}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Where were you between 11 PM and midnight?"
              className="flex-1 panel-raised px-3 py-2 text-sm rounded outline-none"
            />
            <button className="btn btn-primary" onClick={ask} disabled={loading}>
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
