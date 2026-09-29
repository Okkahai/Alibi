/**
 * Deterministic validators run against every CaseTruth — handcrafted or
 * generated — before it is allowed into play. A case that fails any of
 * these is not solvable/consistent and must be rejected, never patched
 * at runtime by the LLM.
 */
import type { CaseTruth } from "@/lib/schema/case-truth";

export interface ValidationIssue {
  rule: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function idSet<T extends { id: string }>(items: T[]): Set<string> {
  return new Set(items.map((i) => i.id));
}

export function validateCaseTruth(truth: CaseTruth): ValidationResult {
  const issues: ValidationIssue[] = [];
  const locationIds = idSet(truth.locations);
  const characterIds = idSet(truth.characters);
  const eventIds = idSet(truth.timeline);
  const evidenceIds = idSet(truth.evidence);

  // 1. Exactly one culprit, and it must match solution.culpritId.
  const culprits = truth.characters.filter((c) => c.isCulprit);
  if (culprits.length !== 1) {
    issues.push({ rule: "single-culprit", message: `Expected exactly 1 culprit, found ${culprits.length}.` });
  } else if (culprits[0].id !== truth.solution.culpritId) {
    issues.push({ rule: "culprit-matches-solution", message: "solution.culpritId does not match the flagged culprit." });
  }

  // 2. Every character location reference must resolve.
  for (const c of truth.characters) {
    if (!locationIds.has(c.actualLocation)) {
      issues.push({ rule: "character-location", message: `${c.id}: actualLocation "${c.actualLocation}" not found.` });
    }
    if (!locationIds.has(c.claimedLocation)) {
      issues.push({ rule: "character-location", message: `${c.id}: claimedLocation "${c.claimedLocation}" not found.` });
    }
  }

  // 3. Every timeline event must reference a real location and real characters.
  for (const e of truth.timeline) {
    if (!locationIds.has(e.locationId)) {
      issues.push({ rule: "event-location", message: `${e.id}: locationId "${e.locationId}" not found.` });
    }
    for (const cid of e.involvedCharacterIds) {
      if (!characterIds.has(cid)) {
        issues.push({ rule: "event-character", message: `${e.id}: involvedCharacterIds references unknown "${cid}".` });
      }
    }
  }

  // 4. Every evidence item must trace to at least one real timeline event (no invented evidence).
  for (const ev of truth.evidence) {
    if (!locationIds.has(ev.locationId)) {
      issues.push({ rule: "evidence-location", message: `${ev.id}: locationId "${ev.locationId}" not found.` });
    }
    for (const eid of ev.relatedEventIds) {
      if (!eventIds.has(eid)) {
        issues.push({ rule: "evidence-traces-to-event", message: `${ev.id}: relatedEventIds references unknown event "${eid}".` });
      }
    }
    for (const cid of ev.relatedCharacterIds) {
      if (!characterIds.has(cid)) {
        issues.push({ rule: "evidence-character", message: `${ev.id}: relatedCharacterIds references unknown "${cid}".` });
      }
    }
  }

  // 5. NPC knowledge must be a strict subset of truth: every knowledge item's relatedEvents
  //    must resolve to real timeline events (an NPC cannot know about an event that never happened).
  for (const c of truth.characters) {
    for (const k of c.knowledge) {
      for (const eid of k.relatedEvents) {
        if (!eventIds.has(eid)) {
          issues.push({
            rule: "knowledge-subset-of-truth",
            message: `${c.id}: knowledge "${k.id}" references unknown event "${eid}".`,
          });
        }
      }
    }
    for (const lie of c.lies) {
      for (const beid of lie.brokenBy) {
        if (!evidenceIds.has(beid)) {
          issues.push({ rule: "lie-broken-by-real-evidence", message: `${c.id}: lie "${lie.id}" brokenBy references unknown evidence "${beid}".` });
        }
      }
    }
  }

  // 6. Solution must be internally consistent and provable from evidence.
  if (!characterIds.has(truth.solution.culpritId)) {
    issues.push({ rule: "solution-culprit-exists", message: "solution.culpritId does not exist." });
  }
  if (truth.solution.keyEvidenceIds.length === 0) {
    issues.push({ rule: "solution-has-key-evidence", message: "Solution must cite at least one key evidence id." });
  }
  for (const id of truth.solution.keyEvidenceIds) {
    if (!evidenceIds.has(id)) {
      issues.push({ rule: "solution-evidence-exists", message: `solution.keyEvidenceIds references unknown evidence "${id}".` });
    }
  }
  for (const id of truth.solution.criticalTimelineEventIds) {
    if (!eventIds.has(id)) {
      issues.push({ rule: "solution-timeline-exists", message: `solution.criticalTimelineEventIds references unknown event "${id}".` });
    }
  }

  // 7. Solvability: at least one piece of evidence must be reliable (not misleading) and
  //    directly implicate the culprit, so the case has a real, discoverable answer.
  const culpritId = truth.solution.culpritId;
  const implicatingEvidence = truth.evidence.filter(
    (e) => e.reliability !== "misleading" && !e.isRedHerring && e.relatedCharacterIds.includes(culpritId)
  );
  if (implicatingEvidence.length === 0) {
    issues.push({
      rule: "solvable-implicating-evidence",
      message: "No reliable, non-red-herring evidence implicates the culprit — case is not solvable.",
    });
  }

  // 8. Every contradiction must reference real evidence that actually reveals it.
  for (const contradiction of truth.contradictions) {
    if (!characterIds.has(contradiction.characterId)) {
      issues.push({ rule: "contradiction-character", message: `${contradiction.id}: unknown character "${contradiction.characterId}".` });
    }
    for (const eid of contradiction.revealingEvidenceIds) {
      if (!evidenceIds.has(eid)) {
        issues.push({ rule: "contradiction-evidence", message: `${contradiction.id}: revealingEvidenceIds references unknown evidence "${eid}".` });
      }
    }
  }

  // 9. Every lie must conceal a fact that is itself real (references a knowledge item id or event id).
  for (const c of truth.characters) {
    const knownIds = idSet(c.knowledge);
    for (const lie of c.lies) {
      if (!knownIds.has(lie.conceals) && !eventIds.has(lie.conceals)) {
        issues.push({
          rule: "lie-conceals-real-fact",
          message: `${c.id}: lie "${lie.id}" conceals unknown fact/event id "${lie.conceals}".`,
        });
      }
    }
  }

  // 10. Difficulty bounds (design doc 09-mvp / case-generation.md ranges).
  const suspectCount = truth.characters.filter((c) => c.role === "suspect").length;
  const bounds: Record<string, [number, number]> = { easy: [3, 3], medium: [4, 6], hard: [6, 8] };
  const [min, max] = bounds[truth.difficulty];
  if (suspectCount < min || suspectCount > max) {
    issues.push({
      rule: "difficulty-suspect-count",
      message: `${truth.difficulty} expects ${min}-${max} suspects, found ${suspectCount}.`,
    });
  }

  return { valid: issues.length === 0, issues };
}
