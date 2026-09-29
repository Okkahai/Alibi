"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/state/game-context";
import { CaseStamp } from "@/components/alibi/CaseStamp";
import { formatDailyShareText, getDailyDayNumber, LAUNCH_DATE, DAILY_MOVES_BUDGET } from "@/lib/engines/daily-case";
import { recordDailyPlay } from "@/lib/engines/streak";
import { loadStreak, saveStreak } from "@/lib/state/streak-storage";

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
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [copied, setCopied] = useState(false);

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

  // Records today's play and refreshes the streak the moment a result exists, once.
  useEffect(() => {
    if (!result) return;
    const today = new Date().toISOString().slice(0, 10);
    const next = recordDailyPlay(loadStreak(), today);
    saveStreak(next);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreak(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!result]);

  if (result) {
    const dayNumber = getDailyDayNumber(new Date(), LAUNCH_DATE);
    const shareText = formatDailyShareText(result.score, new Date(), dayNumber);

    return (
      <div className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg flex flex-col items-center text-center gap-6">
          <CaseStamp tone="accent">Case #{dayNumber} solved</CaseStamp>

          <div>
            <p className="case-title text-5xl font-semibold accent-text">{result.score.percentage}%</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              The culprit was <span className="text-[var(--foreground)]">{result.reveal.culpritName}</span>.
            </p>
          </div>

          <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-2 text-sm">
            <Score label="Culprit" correct={result.score.culprit.correct} />
            <Score label="Motive" correct={result.score.motive.correct} />
            <Score label="Method" correct={result.score.method.correct} />
            <Score label="Evidence" correct={result.score.keyEvidence.missed.length === 0} />
            <Score label="Timeline" correct={result.score.timeline.missed.length === 0} />
          </div>

          <div className="w-full grid grid-cols-3 gap-3">
            <Stat label="Moves used" value={`${state.movesUsed}/${DAILY_MOVES_BUDGET}`} />
            <Stat label="Streak" value={String(streak.current)} />
            <Stat label="Best" value={String(streak.longest)} />
          </div>

          <button
            className="btn btn-primary w-full justify-center py-3"
            onClick={() => {
              navigator.clipboard?.writeText(shareText).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? "Copied" : "Share result"}
          </button>
          <pre className="panel-raised w-full p-3 text-xs whitespace-pre-wrap text-left font-mono text-[var(--muted)]">{shareText}</pre>

          <div className="w-full panel p-5 text-left">
            <h2 className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">What actually happened</h2>
            <p className="text-sm">
              <span className="text-[var(--muted)]">Motive:</span> {result.reveal.motive}
            </p>
            <p className="text-sm mt-1">
              <span className="text-[var(--muted)]">Method:</span> {result.reveal.method}
            </p>
          </div>

          <div className="w-full panel p-5 text-left">
            <h2 className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Full timeline</h2>
            <ol className="flex flex-col gap-1 text-sm">
              {result.reveal.fullTimeline
                .slice()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((e) => (
                  <li key={e.id}>
                    <span className="font-mono accent-text">{e.time}</span> {e.description}
                  </li>
                ))}
            </ol>
          </div>

          <div className="w-full panel p-5 text-left">
            <h2 className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Lies told</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {result.reveal.allLies.map((lie, i) => (
                <li key={i}>
                  <span className="text-[var(--foreground)]">{lie.characterName}</span> claimed &ldquo;{lie.falseClaim}&rdquo;, concealing the truth.
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full panel p-5 text-left">
            <h2 className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Red herrings</h2>
            <ul className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              {result.reveal.redHerrings.map((e) => (
                <li key={e.id}>{e.description}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 panel p-6 m-4 sm:m-6">
      <h1 className="case-title text-2xl">Make your accusation</h1>

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
        {submitting ? "Submitting..." : "Submit accusation"}
      </button>
    </div>
  );
}

function Score({ label, correct }: { label: string; correct: boolean }) {
  return (
    <div className="panel-raised p-2.5">
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
      <p className={correct ? "accent-text" : "text-[var(--muted)]"}>{correct ? "Correct" : "Missed"}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-3">
      <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="case-title text-xl mt-0.5">{value}</p>
    </div>
  );
}
