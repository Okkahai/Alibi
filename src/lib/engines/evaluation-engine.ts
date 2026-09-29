/**
 * Evaluation Engine: scores an Accusation against the immutable CaseTruth.
 * Deterministic comparison only — no LLM judgment where an exact match
 * is possible, per the design principle in docs/06-anti-hallucination.md.
 */
import type { CaseTruth } from "@/lib/schema/case-truth";
import type { Accusation } from "@/lib/schema/game-state";

export interface ScoreBreakdown {
  culprit: { correct: boolean; points: number };
  motive: { correct: boolean; points: number };
  method: { correct: boolean; points: number };
  keyEvidence: { matched: string[]; missed: string[]; extra: string[]; points: number };
  timeline: { matched: string[]; missed: string[]; points: number };
  totalPoints: number;
  maxPoints: number;
  percentage: number;
}

const WEIGHTS = {
  culprit: 40,
  motive: 15,
  method: 15,
  keyEvidence: 20,
  timeline: 10,
};

/** Loose text match for free-text fields (motive/method): normalized substring containment either way. */
function looseTextMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

export function evaluateAccusation(truth: CaseTruth, accusation: Accusation): ScoreBreakdown {
  const { solution } = truth;

  const culpritCorrect = accusation.culpritId === solution.culpritId;
  const motiveCorrect = looseTextMatch(accusation.motive, solution.motive);
  const methodCorrect = looseTextMatch(accusation.method, solution.method);

  const keySet = new Set(solution.keyEvidenceIds);
  const submittedKeySet = new Set(accusation.keyEvidenceIds);
  const matchedEvidence = [...submittedKeySet].filter((id) => keySet.has(id));
  const missedEvidence = [...keySet].filter((id) => !submittedKeySet.has(id));
  const extraEvidence = [...submittedKeySet].filter((id) => !keySet.has(id));
  // Extras count against you, so ticking every box no longer wins.
  const evidenceRatio = keySet.size > 0 ? matchedEvidence.length / (keySet.size + extraEvidence.length) : 0;

  const criticalSet = new Set(solution.criticalTimelineEventIds);
  const submittedTimelineSet = new Set(accusation.reconstructedTimelineEventIds);
  const matchedTimeline = [...submittedTimelineSet].filter((id) => criticalSet.has(id));
  const missedTimeline = [...criticalSet].filter((id) => !submittedTimelineSet.has(id));
  const extraTimeline = [...submittedTimelineSet].filter((id) => !criticalSet.has(id));
  const timelineRatio = criticalSet.size > 0 ? matchedTimeline.length / (criticalSet.size + extraTimeline.length) : 0;

  const culpritPoints = culpritCorrect ? WEIGHTS.culprit : 0;
  const motivePoints = motiveCorrect ? WEIGHTS.motive : 0;
  const methodPoints = methodCorrect ? WEIGHTS.method : 0;
  const keyEvidencePoints = Math.round(evidenceRatio * WEIGHTS.keyEvidence);
  const timelinePoints = Math.round(timelineRatio * WEIGHTS.timeline);

  const totalPoints = culpritPoints + motivePoints + methodPoints + keyEvidencePoints + timelinePoints;
  const maxPoints = WEIGHTS.culprit + WEIGHTS.motive + WEIGHTS.method + WEIGHTS.keyEvidence + WEIGHTS.timeline;

  return {
    culprit: { correct: culpritCorrect, points: culpritPoints },
    motive: { correct: motiveCorrect, points: motivePoints },
    method: { correct: methodCorrect, points: methodPoints },
    keyEvidence: { matched: matchedEvidence, missed: missedEvidence, extra: extraEvidence, points: keyEvidencePoints },
    timeline: { matched: matchedTimeline, missed: missedTimeline, points: timelinePoints },
    totalPoints,
    maxPoints,
    percentage: Math.round((totalPoints / maxPoints) * 100),
  };
}

export interface CaseReveal {
  culpritName: string;
  motive: string;
  method: string;
  fullTimeline: CaseTruth["timeline"];
  keyEvidence: CaseTruth["evidence"];
  allLies: Array<{ characterName: string; falseClaim: string; truth: string }>;
  redHerrings: CaseTruth["evidence"];
}

export function buildCaseReveal(truth: CaseTruth): CaseReveal {
  const culprit = truth.characters.find((c) => c.id === truth.solution.culpritId);
  const lies = truth.characters.flatMap((c) =>
    c.lies.map((lie) => ({ characterName: c.name, falseClaim: lie.falseClaim, truth: lie.conceals }))
  );
  return {
    culpritName: culprit?.name ?? "Unknown",
    motive: truth.solution.motive,
    method: truth.solution.method,
    fullTimeline: truth.timeline,
    keyEvidence: truth.evidence.filter((e) => truth.solution.keyEvidenceIds.includes(e.id)),
    allLies: lies,
    redHerrings: truth.evidence.filter((e) => e.isRedHerring),
  };
}
