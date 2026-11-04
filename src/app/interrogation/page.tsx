"use client";

import { useState } from "react";
import { useGame } from "@/lib/state/game-context";
import type { DialogueTurn } from "@/lib/schema/game-state";
import { Portrait } from "@/components/art/portrait";

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
          seed: truth.seed,
          difficulty: truth.difficulty,
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

  const subject = suspects.find((c) => c.id === characterId);
  const turns = conversation?.turns ?? [];

  return (
    <article className="grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="min-w-0">
        <p className="label text-[var(--copper)]">Section III · Interrogation</p>
        <h2 className="label text-[var(--muted)] mt-4 pb-2 border-b-2 border-[var(--rule-strong)]">Persons to question</h2>
        <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible" role="tablist" aria-label="Persons to question">
          {suspects.map((c, i) => {
            const active = c.id === characterId;
            return (
              <li key={c.id} className="shrink-0">
                <button
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCharacterId(c.id)}
                  className={`w-full flex items-center gap-3 py-2 pr-2 text-left border-b border-[var(--border)] ${active ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                >
                  <span className={`w-9 shrink-0 ${active ? "bg-[var(--ink)]" : ""}`}>
                    <Portrait seed={c.name} view="profile" framed={false} ink={active ? "var(--on-ink)" : "var(--ink)"} highlight="var(--brass)" className="w-full h-auto" />
                  </span>
                  <span className="min-w-0">
                    <span className="mono text-xs text-[var(--copper)] block">S-{String(i + 1).padStart(2, "0")}</span>
                    <span className={`whitespace-nowrap ${active ? "font-semibold" : ""}`}>{c.name}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <section className="min-w-0 flex flex-col" aria-label={`Transcript with ${subject?.name ?? ""}`}>
        <header className="on-ink px-5 py-4 flex items-center gap-4">
          {subject && (
            <span className="w-14 shrink-0">
              <Portrait seed={subject.name} view="profile" framed={false} ink="var(--on-ink)" highlight="var(--brass)" className="w-full h-auto" />
            </span>
          )}
          <div className="min-w-0">
            <p className="label text-[var(--brass-light)]">Statement taken under caution</p>
            <h1 className="text-[2.2rem] italic font-medium text-[var(--on-ink)] leading-tight truncate">{subject?.name}</h1>
          </div>
          <p className="label text-[var(--on-ink-muted)] ml-auto hidden sm:block">{turns.filter((t) => t.speaker === "player").length} questions put</p>
        </header>

        <div className="bg-[var(--surface)] border-x border-b border-[var(--border)] px-5 md:px-8 py-5 min-h-[18rem] max-h-[55vh] overflow-y-auto" aria-live="polite">
          {turns.length === 0 && <p className="text-[var(--muted)] italic">The transcript is blank. Put your first question below.</p>}
          <ol className="flex flex-col gap-4">
            {turns.map((t) => {
              const shown = t.evidenceShownId ? truth.evidence.find((e) => e.id === t.evidenceShownId) : null;
              return (
                <li key={t.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
                  <span className={`display text-xl font-bold ${t.speaker === "player" ? "text-[var(--copper)]" : "text-[var(--accent)]"}`}>{t.speaker === "player" ? "Q." : "A."}</span>
                  <div>
                    <p className={t.speaker === "player" ? "mono text-sm pt-1" : "display text-[1.25rem] leading-snug"}>{t.text}</p>
                    {shown && <p className="label text-[var(--copper)] mt-1">Exhibit shown · {shown.description.slice(0, 60)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="label text-[var(--muted)]">Put an exhibit to the witness (optional)</span>
            <select value={evidenceShownId} onChange={(e) => setEvidenceShownId(e.target.value)} className="min-h-11 px-3 bg-[var(--surface)] border border-[var(--rule-strong)] text-sm">
              <option value="">No exhibit shown</option>
              {discoveredEvidence.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.description.slice(0, 70)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Your question</span>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Where were you between ten and eleven?"
                className="w-full min-h-11 px-3 bg-[var(--surface)] border border-[var(--rule-strong)] mono text-sm"
              />
            </label>
            <button className="btn btn-primary" onClick={ask} disabled={loading}>
              {loading ? "Recording…" : "Put question"}
            </button>
          </div>
        </div>
      </section>
    </article>
  );
}
