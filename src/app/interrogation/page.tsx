"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/lib/state/game-context";
import { DAILY_MOVES_BUDGET } from "@/lib/engines/daily-case";
import { QUESTION_TOPICS, answerTopic, confront, type TopicId } from "@/lib/engines/choice-dialogue";
import type { DialogueTurn } from "@/lib/schema/game-state";

export default function InterrogationPage() {
  const { truth, state, appendTurn, markContradiction } = useGame();
  const suspects = truth.characters.filter((c) => c.role !== "victim");
  const [characterId, setCharacterId] = useState(suspects[0]?.id ?? "");
  const [evidenceId, setEvidenceId] = useState("");

  const character = suspects.find((c) => c.id === characterId);
  const conversation = state.conversations.find((c) => c.characterId === characterId);
  const discoveredEvidence = truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id));
  const found = state.foundContradictionIds ?? [];
  const outOfMoves = state.movesUsed >= DAILY_MOVES_BUDGET;

  function say(playerText: string, npcText: string, shownId?: string) {
    const now = new Date().toISOString();
    const player: DialogueTurn = { id: crypto.randomUUID(), speaker: "player", text: playerText, evidenceShownId: shownId, timestamp: now };
    const npc: DialogueTurn = { id: crypto.randomUUID(), speaker: "npc", text: npcText, timestamp: now };
    appendTurn(characterId, player);
    appendTurn(characterId, npc);
  }

  function ask(topic: TopicId, label: string) {
    if (!character || outOfMoves) return;
    say(label, answerTopic(truth, character, topic));
  }

  function confrontWith() {
    const ev = truth.evidence.find((e) => e.id === evidenceId);
    if (!character || !ev || outOfMoves) return;
    const result = confront(truth, character, ev.id);
    result.contradictionIds.forEach(markContradiction);
    say(`You said otherwise, but: ${ev.description}`, result.text, ev.id);
    setEvidenceId("");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 sm:p-6">
        <div className="panel p-4 flex flex-col gap-2">
          <h2 className="text-sm uppercase tracking-widest text-[var(--muted)]">Suspects</h2>
          {suspects.map((c) => {
            const caught = truth.contradictions.some((x) => x.characterId === c.id && found.includes(x.id));
            return (
              <button
                key={c.id}
                onClick={() => setCharacterId(c.id)}
                className={`text-left px-3 py-2 rounded ${
                  c.id === characterId ? "bg-[var(--surface-raised)] border border-[var(--accent)]" : "hover:bg-[var(--surface-raised)]"
                }`}
              >
                {c.name}
                {caught && <span className="block text-xs text-[var(--accent)]">Lie exposed</span>}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3 panel p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 min-h-40">
            {(conversation?.turns ?? []).length === 0 && (
              <p className="text-sm text-[var(--muted)]">Choose a question for {character?.name}. Each costs 1 move.</p>
            )}
            {(conversation?.turns ?? []).map((t) => (
              <div
                key={t.id}
                className={`max-w-[80%] px-3 py-2 rounded text-sm ${
                  t.speaker === "player" ? "self-end bg-[var(--accent)] text-[var(--accent-foreground)]" : "self-start panel-raised"
                }`}
              >
                {t.text}
              </div>
            ))}
          </div>

          {outOfMoves ? (
            <p className="text-sm">
              You are out of moves.{" "}
              <Link href="/accusation" className="accent-text underline">
                Make your accusation
              </Link>
              .
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="text-xs uppercase tracking-widest text-[var(--muted)]">Ask</h3>
                {QUESTION_TOPICS.map((q) => (
                  <button key={q.id} className="btn text-left justify-between" onClick={() => ask(q.id, q.label)}>
                    <span>{q.label}</span>
                    <span className="text-xs text-[var(--muted)]">1 move</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xs uppercase tracking-widest text-[var(--muted)]">Confront with evidence</h3>
                {discoveredEvidence.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Find evidence first. A wrong confrontation still costs a move.</p>
                ) : (
                  <div className="flex gap-2">
                    <select value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} className="flex-1 panel-raised px-2 py-2 text-sm rounded">
                      <option value="">Choose evidence...</option>
                      {discoveredEvidence.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.description.slice(0, 70)}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-primary" disabled={!evidenceId} onClick={confrontWith}>
                      Confront · 1 move
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
