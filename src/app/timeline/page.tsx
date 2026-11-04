"use client";

import { useGame } from "@/lib/state/game-context";
import { knownEvents } from "@/lib/state/known-events";

export default function TimelinePage() {
  const { truth, state } = useGame();

  // An event is "unlocked" once evidence or dialogue referencing it has been discovered —
  // approximated here by any discovered evidence item whose relatedEventIds includes it.
  const unlockedEventIds = new Set(knownEvents(truth, state).map((e) => e.id));

  const sorted = [...truth.timeline].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <article>
      <header className="flex flex-col md:flex-row md:items-end gap-3 border-b-2 border-[var(--rule-strong)] pb-4">
        <div>
          <p className="label text-[var(--copper)]">Section V · Chronology</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium">The night, in order</h1>
        </div>
        <p className="md:ml-auto md:max-w-[24rem] text-sm text-[var(--muted)]">
          Entries stay redacted until an exhibit places them. {unlockedEventIds.size > 0 ? `${unlockedEventIds.size} of ${sorted.length} entries established.` : "No entries established yet."}
        </p>
      </header>

      <ol className="mt-6 relative">
        <span className="absolute left-[4.5rem] md:left-[7.5rem] top-0 bottom-0 w-px bg-[var(--rule-strong)]" aria-hidden="true" />
        {sorted.map((event) => {
          const unlocked = unlockedEventIds.has(event.id);
          const location = truth.locations.find((l) => l.id === event.locationId)?.name;
          return (
            <li key={event.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] md:grid-cols-[7.5rem_minmax(0,1fr)] items-start">
              <time className="display text-[1.5rem] md:text-[2.6rem] leading-none pt-4 pr-3 md:pr-4 text-right text-[var(--foreground)] [font-variant-numeric:lining-nums_tabular-nums]">{event.time}</time>
              <div className="relative pl-6 py-4 border-b border-[var(--border)]">
                <span className={`absolute -left-[5px] top-6 w-[9px] h-[9px] rotate-45 ${unlocked ? "bg-[var(--accent)]" : "bg-[var(--background)] border border-[var(--rule-strong)]"}`} aria-hidden="true" />
                {unlocked ? (
                  <>
                    <p className="label text-[var(--copper)]">{location}</p>
                    <p className="mt-1 text-[1.0625rem]">{event.description}</p>
                  </>
                ) : (
                  <>
                    <p className="label text-[var(--muted)]">Unplaced</p>
                    <p className="mt-2 flex flex-wrap gap-1.5" aria-label="Redacted: find an exhibit to place this hour">
                      <span className="h-3.5 w-40 bg-[var(--ink)]" />
                      <span className="h-3.5 w-24 bg-[var(--ink)]" />
                      <span className="h-3.5 w-56 max-w-full bg-[var(--ink)]" />
                    </p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
