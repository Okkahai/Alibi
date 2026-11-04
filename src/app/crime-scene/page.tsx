"use client";

import { useState } from "react";
import { useGame } from "@/lib/state/game-context";
import { SpecimenGlyph } from "@/components/art/specimen";

export default function CrimeScenePage() {
  const { truth, state, visitLocation, discoverEvidence } = useGame();
  const [activeLocationId, setActiveLocationId] = useState(truth.locations[0]?.id ?? "");
  const activeLocation = truth.locations.find((l) => l.id === activeLocationId);
  const evidenceHere = truth.evidence.filter((e) => e.locationId === activeLocationId);
  const exhibitNo = (id: string) => `EX-${String(truth.evidence.findIndex((e) => e.id === id) + 1).padStart(2, "0")}`;

  return (
    <article>
      <header className="flex flex-col md:flex-row md:items-end gap-3 border-b-2 border-[var(--rule-strong)] pb-4">
        <div>
          <p className="label text-[var(--copper)]">Section I · The scene</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium leading-none">Plan of the house</h1>
        </div>
        <p className="md:ml-auto md:max-w-[24rem] text-sm text-[var(--muted)]">
          Choose a room on the plan to enter it. Markers show where something may be recovered; examining one enters it in the catalogue.
        </p>
      </header>

      {/* Ground plan: rooms as a ruled architectural drawing */}
      <figure className="on-ink mt-6 p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-[var(--brass)]" role="group" aria-label="Rooms">
          {truth.locations.map((loc, i) => {
            const active = loc.id === activeLocationId;
            const visited = state.visitedLocationIds.includes(loc.id);
            const found = truth.evidence.filter((e) => e.locationId === loc.id && state.discoveredEvidenceIds.includes(e.id)).length;
            const total = truth.evidence.filter((e) => e.locationId === loc.id).length;
            return (
              <button
                key={loc.id}
                aria-pressed={active}
                onClick={() => {
                  setActiveLocationId(loc.id);
                  visitLocation(loc.id);
                }}
                className={`relative text-left min-h-[6.5rem] md:min-h-[8rem] p-3 flex flex-col border-r border-b border-[var(--brass)] ${i % 3 === 0 ? "md:col-span-2" : ""} ${
                  active ? "bg-[var(--surface)] text-[var(--ink)]" : "text-[var(--on-ink)] hover:bg-[var(--ink-raised)]"
                }`}
              >
                <span className={`label ${active ? "text-[var(--copper)]" : "text-[var(--on-ink-muted)]"}`}>Rm. {String(i + 1).padStart(2, "0")}</span>
                <span className="display block text-xl md:text-2xl italic mt-1">{loc.name}</span>
                <span className={`label mt-auto pt-2 ${active ? "text-[var(--muted)]" : "text-[var(--on-ink-muted)]"}`}>
                  {visited && found === total ? `✓ Searched · ${found}/${total}` : visited ? `◐ Entered · ${found}/${total}` : "· Not yet entered"}
                </span>
              </button>
            );
          })}
        </div>
        <figcaption className="label text-[var(--on-ink-muted)] mt-3">Ground plan, not to scale · rooms on file: {truth.locations.length}</figcaption>
      </figure>

      {activeLocation && (
        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" aria-live="polite">
          <div>
            <h2 className="text-[2.6rem] leading-tight">{activeLocation.name}</h2>
            <p className="mt-2 text-[var(--muted)]">{activeLocation.description}</p>
          </div>

          <div>
            <h3 className="label text-[var(--muted)] border-b-2 border-[var(--rule-strong)] pb-2">Markers in this room</h3>
            {evidenceHere.length === 0 && <p className="py-4 text-sm text-[var(--muted)]">Nothing of note was marked in this room.</p>}
            <ol>
              {evidenceHere.map((ev, i) => {
                const found = state.discoveredEvidenceIds.includes(ev.id);
                return (
                  <li key={ev.id} className="flex items-start gap-4 py-4 border-b border-[var(--border)]">
                    <span className="shrink-0 w-10 h-10 grid place-items-center bg-[var(--accent)] text-[var(--accent-foreground)] mono text-sm [clip-path:polygon(50%_0,100%_100%,0_100%)] pt-3" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {found ? (
                        <>
                          <p className="flex items-baseline gap-3">
                            <span className="mono text-[var(--copper)]">{exhibitNo(ev.id)}</span>
                            <span className="label text-[var(--muted)]">{ev.type.replace(/_/g, " ")}</span>
                          </p>
                          <p className="mt-1">{ev.description}</p>
                        </>
                      ) : (
                        <>
                          <p className="label text-[var(--muted)]">Marker {i + 1} · {ev.type.replace(/_/g, " ")}</p>
                          <p className="mt-1 text-[var(--muted)] italic">Something here may be worth a closer look.</p>
                        </>
                      )}
                    </div>
                    {found ? (
                      <SpecimenGlyph type={ev.type} className="w-12 h-12 shrink-0 text-[var(--ink)]" />
                    ) : (
                      <button className="btn btn-primary shrink-0" onClick={() => discoverEvidence(ev.id)}>
                        Examine
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}
    </article>
  );
}
