import type { CaseTruth } from "@/lib/schema/case-truth";
import type { GameState } from "@/lib/schema/game-state";

/**
 * Timeline events the player has evidence for. Never list `truth.timeline`
 * wholesale in the UI: it contains the crime event itself (culprit, method).
 */
export function knownEvents(truth: CaseTruth, state: GameState) {
  const ids = new Set(truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id)).flatMap((e) => e.relatedEventIds));
  return truth.timeline.filter((e) => ids.has(e.id)).sort((a, b) => a.time.localeCompare(b.time));
}
