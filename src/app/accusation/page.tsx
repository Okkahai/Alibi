"use client";

import { useState } from "react";
import { useGame } from "@/lib/state/game-context";
import { knownEvents } from "@/lib/state/known-events";
import { Portrait } from "@/components/art/portrait";

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
  const [confirming, setConfirming] = useState(false);

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
        body: JSON.stringify({ caseId: truth.id, seed: truth.seed, difficulty: truth.difficulty, ...accusation }),
      });
      const data: ScoreResponse = await res.json();
      setResult(data);
      submitAccusation(accusation);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const timeline = [...result.reveal.fullTimeline].sort((a, b) => a.time.localeCompare(b.time));
    return (
      <article>
        <header className="on-ink px-5 md:px-8 py-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end relative overflow-hidden">
          <div>
            <p className="label text-[var(--brass-light)]">Section VIII · Finding returned</p>
            <h1 className="mt-2 text-[3rem] md:text-[4rem] italic font-medium text-[var(--on-ink)] leading-none">Case closed</h1>
            <p className="mt-4 text-[var(--on-ink-muted)] max-w-[34rem]">
              The person responsible was <span className="text-[var(--on-ink)] display text-2xl italic">{result.reveal.culpritName}</span>.
            </p>
          </div>
          <p className="display text-[6rem] md:text-[8rem] leading-[0.8] text-[var(--brass)]" aria-label={`Score ${result.score.percentage} percent`}>
            {result.score.percentage}
            <span className="text-[2.5rem]">%</span>
          </p>
        </header>

        <dl className="grid grid-cols-2 sm:grid-cols-5 border-b-2 border-[var(--rule-strong)]">
          <Score label="Culprit" points={result.score.culprit.points} correct={result.score.culprit.correct} />
          <Score label="Motive" points={result.score.motive.points} correct={result.score.motive.correct} />
          <Score label="Method" points={result.score.method.points} correct={result.score.method.correct} />
          <Score label="Exhibits" points={result.score.keyEvidence.points} correct={result.score.keyEvidence.missed.length === 0} />
          <Score label="Sequence" points={result.score.timeline.points} correct={result.score.timeline.missed.length === 0} />
        </dl>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section>
            <h2 className="text-[2rem] border-b-2 border-[var(--rule-strong)] pb-2">Reconstruction of the night</h2>
            <p className="mt-3 text-sm">
              <span className="label text-[var(--muted)] mr-2">Motive</span>
              {result.reveal.motive}
            </p>
            <p className="mt-1 text-sm">
              <span className="label text-[var(--muted)] mr-2">Method</span>
              {result.reveal.method}
            </p>
            <ol className="mt-4">
              {timeline.map((e) => (
                <li key={e.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-2.5 border-b border-[var(--border)]">
                  <time className="display text-2xl leading-none">{e.time}</time>
                  <span>{e.description}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-[2rem] border-b-2 border-[var(--rule-strong)] pb-2">False statements</h2>
            <ul>
              {result.reveal.allLies.map((lie, i) => (
                <li key={i} className="py-3 border-b border-[var(--border)]">
                  <span className="label text-[var(--accent)]">✕ {lie.characterName}</span>
                  <p className="display text-lg italic mt-1">&ldquo;{lie.falseClaim}&rdquo;</p>
                </li>
              ))}
            </ul>
            {result.reveal.redHerrings.length > 0 && (
              <>
                <h3 className="mt-8 label text-[var(--muted)]">Exhibits that misled</h3>
                <ul className="mt-2 text-sm text-[var(--muted)]">
                  {result.reveal.redHerrings.map((e) => (
                    <li key={e.id} className="py-2 border-b border-[var(--border)]">
                      {e.description}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </article>
    );
  }

  const field = "w-full mt-2 px-3 py-2 bg-[var(--surface)] border border-[var(--rule-strong)] text-sm";
  const known = knownEvents(truth, state);

  return (
    <article>
      <header className="flex flex-col md:flex-row md:items-end gap-3 border-b-2 border-[var(--rule-strong)] pb-4">
        <div>
          <p className="label text-[var(--copper)]">Section VIII · Conclusion</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium">Finding of the investigation</h1>
        </div>
        <p className="md:ml-auto md:max-w-[22rem] text-sm text-[var(--muted)]">A finding is submitted once and cannot be withdrawn. Name the person; the rest of the form strengthens the case.</p>
      </header>

      <fieldset className="mt-8">
        <legend className="flex items-baseline gap-3">
          <span className="display text-2xl italic text-[var(--copper)]">i.</span>
          <span className="text-[1.6rem] display">The person responsible</span>
        </legend>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" role="radiogroup" aria-label="The person responsible">
          {suspects.map((c) => {
            const chosen = culpritId === c.id;
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={chosen}
                onClick={() => {
                  setCulpritId(c.id);
                  setConfirming(false);
                }}
                className={`text-left border p-2 ${chosen ? "border-[var(--accent)] bg-[var(--surface)] outline outline-2 outline-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--rule-strong)]"}`}
              >
                <Portrait seed={c.name} view="profile" framed={false} className="w-16 h-auto" />
                <span className="block mt-1 font-semibold leading-tight">{c.name}</span>
                <span className={`label ${chosen ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{chosen ? "◆ Named" : "Select"}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline gap-3">
            <span className="display text-2xl italic text-[var(--copper)]">ii.</span>
            <span className="text-[1.6rem] display">Motive</span>
          </span>
          <textarea value={motive} onChange={(e) => setMotive(e.target.value)} rows={3} className={field} />
        </label>
        <label className="block">
          <span className="flex items-baseline gap-3">
            <span className="display text-2xl italic text-[var(--copper)]">iii.</span>
            <span className="text-[1.6rem] display">Method</span>
          </span>
          {truth.methods.length > 0 ? (
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${field} min-h-11`}>
              <option value="">Select the method…</option>
              {truth.methods.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <textarea value={method} onChange={(e) => setMethod(e.target.value)} rows={3} className={field} />
          )}
        </label>
      </div>

      <fieldset className="mt-8">
        <legend className="flex items-baseline gap-3">
          <span className="display text-2xl italic text-[var(--copper)]">iv.</span>
          <span className="text-[1.6rem] display">Exhibits relied upon</span>
        </legend>
        {discoveredEvidence.length === 0 && <p className="mt-2 text-sm text-[var(--muted)]">No exhibits catalogued yet.</p>}
        <div className="mt-2 grid sm:grid-cols-2 gap-x-6">
          {discoveredEvidence.map((ev) => (
            <label key={ev.id} className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5 w-5 h-5 accent-[var(--accent)] shrink-0" checked={keyEvidenceIds.includes(ev.id)} onChange={() => toggle(keyEvidenceIds, ev.id, setKeyEvidenceIds)} />
              {ev.description}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="flex items-baseline gap-3">
          <span className="display text-2xl italic text-[var(--copper)]">v.</span>
          <span className="text-[1.6rem] display">Sequence of events</span>
        </legend>
        {known.length === 0 && <p className="mt-2 text-sm text-[var(--muted)]">No events established yet; recover exhibits first.</p>}
        <div className="mt-2">
          {known.map((ev) => (
            <label key={ev.id} className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5 w-5 h-5 accent-[var(--accent)] shrink-0" checked={timelineEventIds.includes(ev.id)} onChange={() => toggle(timelineEventIds, ev.id, setTimelineEventIds)} />
              <span className="mono text-[var(--copper)] w-12 shrink-0">{ev.time}</span> {ev.description}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-10 on-ink px-5 py-5 flex flex-wrap items-center gap-4">
        <p className="label text-[var(--on-ink-muted)]" aria-live="polite">
          {!culpritId
            ? "Name the person responsible to submit."
            : confirming
              ? `Final: you name ${suspects.find((c) => c.id === culpritId)?.name}. This cannot be withdrawn.`
              : `Named: ${suspects.find((c) => c.id === culpritId)?.name}`}
        </p>
        <div className="ml-auto flex gap-2">
          {confirming && (
            <button className="btn" onClick={() => setConfirming(false)}>
              Revise
            </button>
          )}
          <button className="btn btn-primary" onClick={() => (confirming ? submit() : setConfirming(true))} disabled={!culpritId || submitting}>
            {submitting ? "Submitting…" : confirming ? "Sign and submit" : "Review the finding"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Score({ label, points, correct }: { label: string; points: number; correct: boolean }) {
  return (
    <div className="py-3 px-4 border-r border-[var(--border)] last:border-r-0">
      <dt className="label text-[var(--muted)]">{label}</dt>
      <dd className={`mono mt-1 ${correct ? "text-[var(--confirmed)]" : "text-[var(--danger)]"}`}>
        {correct ? "✓" : "✕"} {points} pts
      </dd>
    </div>
  );
}
