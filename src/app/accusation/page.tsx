"use client";

import { useState } from "react";
import { useGame } from "@/lib/state/game-context";

interface ScoreResponse {
  score: {
    culprit: { correct: boolean; points: number };
    motive: { correct: boolean; points: number };
    method: { correct: boolean; points: number };
    keyEvidence: { matched: string[]; missed: string[]; extra: string[]; points: number };
    timeline: { matched: string[]; missed: string[]; points: number };
    totalPoints: number;
    maxPoints: number;
    percentage: number;
  };
  reveal: {
    culpritName: string;
    motive: string;
    method: string;
    fullTimeline: Array<{ id: string; time: string; description: string }>;
    keyEvidence: Array<{ id: string; description: string }>;
    allLies: Array<{ characterName: string; falseClaim: string; truth: string }>;
    redHerrings: Array<{ id: string; description: string }>;
  };
}

export default function AccusationPage() {
  const { truth, state, submitAccusation } = useGame();
  const suspects = truth.characters.filter((c) => c.role !== "victim");
  const discoveredEvidence = truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id));

  const [culpritId, setCulpritId] = useState("");
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [keyEvidenceIds, setKeyEvidenceIds] = useState<string[]>([]);
  const [timelineEventIds, setTimelineEventIds] = useState<string[]>([]);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function submit() {
    if (!culpritId || submitting) return;
    setSubmitting(true);
    const accusation = { culpritId, motive, method, keyEvidenceIds, reconstructedTimelineEventIds: timelineEventIds };
    try {
      const res = await fetch("/api/accusation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: truth.id, ...accusation }),
      });
      const data: ScoreResponse = await res.json();
      setResult(data);
      submitAccusation(accusation);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div className="panel p-6">
          <h1 className="text-2xl font-semibold">
            Case Closed — <span className="accent-text">{result.score.percentage}%</span>
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            The culprit was <span className="text-[var(--foreground)]">{result.reveal.culpritName}</span>.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-sm">
            <Score label="Culprit" points={result.score.culprit.points} correct={result.score.culprit.correct} />
            <Score label="Motive" points={result.score.motive.points} correct={result.score.motive.correct} />
            <Score label="Method" points={result.score.method.points} correct={result.score.method.correct} />
            <Score label="Key evidence" points={result.score.keyEvidence.points} correct={result.score.keyEvidence.missed.length === 0} />
            <Score label="Timeline" points={result.score.timeline.points} correct={result.score.timeline.missed.length === 0} />
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="font-semibold mb-2">What actually happened</h2>
          <p className="text-sm">
            <span className="text-[var(--muted)]">Motive:</span> {result.reveal.motive}
          </p>
          <p className="text-sm mt-1">
            <span className="text-[var(--muted)]">Method:</span> {result.reveal.method}
          </p>
        </div>

        <div className="panel p-6">
          <h2 className="font-semibold mb-2">Full timeline</h2>
          <ol className="flex flex-col gap-1 text-sm">
            {result.reveal.fullTimeline
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((e) => (
                <li key={e.id}>
                  <span className="font-mono accent-text">{e.time}</span> — {e.description}
                </li>
              ))}
          </ol>
        </div>

        <div className="panel p-6">
          <h2 className="font-semibold mb-2">Lies told</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {result.reveal.allLies.map((lie, i) => (
              <li key={i}>
                <span className="text-[var(--foreground)]">{lie.characterName}</span> claimed &ldquo;{lie.falseClaim}&rdquo; — concealing the truth.
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-6">
          <h2 className="font-semibold mb-2">Red herrings</h2>
          <ul className="flex flex-col gap-1 text-sm text-[var(--muted)]">
            {result.reveal.redHerrings.map((e) => (
              <li key={e.id}>{e.description}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 panel p-6">
      <h1 className="text-xl font-semibold">Make Your Accusation</h1>

      <div>
        <label className="text-sm text-[var(--muted)]">Culprit</label>
        <select value={culpritId} onChange={(e) => setCulpritId(e.target.value)} className="w-full mt-1 panel-raised px-3 py-2 rounded text-sm">
          <option value="">Select a suspect...</option>
          {suspects.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-[var(--muted)]">Motive</label>
        <textarea value={motive} onChange={(e) => setMotive(e.target.value)} rows={2} className="w-full mt-1 panel-raised px-3 py-2 rounded text-sm" />
      </div>

      <div>
        <label className="text-sm text-[var(--muted)]">Method</label>
        <textarea value={method} onChange={(e) => setMethod(e.target.value)} rows={2} className="w-full mt-1 panel-raised px-3 py-2 rounded text-sm" />
      </div>

      <div>
        <label className="text-sm text-[var(--muted)]">Key evidence</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {discoveredEvidence.map((ev) => (
            <label key={ev.id} className="panel-raised px-3 py-2 rounded text-sm flex items-start gap-2">
              <input type="checkbox" checked={keyEvidenceIds.includes(ev.id)} onChange={() => toggle(keyEvidenceIds, ev.id, setKeyEvidenceIds)} />
              {ev.description}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-[var(--muted)]">Reconstructed timeline (events you believe occurred)</label>
        <div className="flex flex-col gap-2 mt-1">
          {truth.timeline
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((ev) => (
              <label key={ev.id} className="panel-raised px-3 py-2 rounded text-sm flex items-start gap-2">
                <input type="checkbox" checked={timelineEventIds.includes(ev.id)} onChange={() => toggle(timelineEventIds, ev.id, setTimelineEventIds)} />
                <span className="font-mono accent-text">{ev.time}</span> {ev.description}
              </label>
            ))}
        </div>
      </div>

      <button className="btn btn-primary self-start" onClick={submit} disabled={!culpritId || submitting}>
        {submitting ? "Submitting..." : "Submit Accusation"}
      </button>
    </div>
  );
}

function Score({ label, points, correct }: { label: string; points: number; correct: boolean }) {
  return (
    <div className="panel-raised p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={correct ? "accent-text" : "text-[var(--danger)]"}>{points} pts</p>
    </div>
  );
}
