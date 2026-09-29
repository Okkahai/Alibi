"use client";

import { useGame } from "@/lib/state/game-context";

export default function EvidencePage() {
  const { truth, state } = useGame();
  const discovered = truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        Evidence Log <span className="text-sm text-[var(--muted)]">({discovered.length} / {truth.evidence.length})</span>
      </h1>
      {discovered.length === 0 && (
        <p className="text-sm text-[var(--muted)]">Nothing logged yet. Search the Crime Scene locations to find evidence.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {discovered.map((ev) => {
          const location = truth.locations.find((l) => l.id === ev.locationId)?.name;
          return (
            <div key={ev.id} className="panel p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-[var(--muted)]">{ev.type.replace("_", " ")}</span>
                <span className="text-xs text-[var(--muted)]">{location}</span>
              </div>
              <p className="text-sm mt-2">{ev.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
