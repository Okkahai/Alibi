import type { CaseTruth } from "@/lib/schema/case-truth";
import type { GameState } from "@/lib/schema/game-state";

/**
 * Timeline events the player has evidence for. Never list `truth.timeline`
 * wholesale in the UI: it contains the crime event itself (culprit, method).
 * Events involving the culprit stay redacted until the reveal, since
 * handcrafted cases describe the crime itself in them.
 */
export function knownEvents(truth: CaseTruth, state: GameState) {
  const ids = new Set(truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id)).flatMap((e) => e.relatedEventIds));
  const culpritId = truth.solution.culpritId;
  return truth.timeline.filter((e) => ids.has(e.id) && !e.involvedCharacterIds.includes(culpritId)).sort((a, b) => a.time.localeCompare(b.time));
}
