"use client";

import { useGame } from "@/lib/state/game-context";

export default function TimelinePage() {
  const { truth, state } = useGame();

  // An event is "unlocked" once evidence or dialogue referencing it has been discovered —
  // approximated here by any discovered evidence item whose relatedEventIds includes it.
  const unlockedEventIds = new Set(
    truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id)).flatMap((e) => e.relatedEventIds)
  );

  const sorted = [...truth.timeline].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="panel p-6">
      <h1 className="text-xl font-semibold mb-4">Timeline</h1>
      <ol className="flex flex-col gap-3">
        {sorted.map((event) => {
          const unlocked = unlockedEventIds.has(event.id);
          const location = truth.locations.find((l) => l.id === event.locationId)?.name;
          return (
            <li key={event.id} className="flex gap-4 items-start">
              <span className="font-mono text-sm w-14 shrink-0 accent-text">{event.time}</span>
              <div className="panel-raised p-3 flex-1">
                {unlocked ? (
                  <>
                    <p className="text-sm">{event.description}</p>
                    <span className="text-xs text-[var(--muted)]">{location}</span>
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted)] italic">Unaccounted for — find evidence to place this hour.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
