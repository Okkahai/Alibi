"use client";

import { useState } from "react";
import { useGame } from "@/lib/state/game-context";

export default function CrimeScenePage() {
  const { truth, state, visitLocation, discoverEvidence } = useGame();
  const [activeLocationId, setActiveLocationId] = useState(truth.locations[0]?.id ?? "");
  const activeLocation = truth.locations.find((l) => l.id === activeLocationId);
  const evidenceHere = truth.evidence.filter((e) => e.locationId === activeLocationId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel p-4 flex flex-col gap-2">
        <h2 className="text-sm uppercase tracking-widest text-[var(--muted)]">Locations</h2>
        {truth.locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => {
              setActiveLocationId(loc.id);
              visitLocation(loc.id);
            }}
            className={`text-left px-3 py-2 rounded ${
              loc.id === activeLocationId ? "bg-[var(--surface-raised)] border border-[var(--accent)]" : "hover:bg-[var(--surface-raised)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{loc.name}</span>
              {state.visitedLocationIds.includes(loc.id) && <span className="text-xs text-[var(--muted)]">visited</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 panel p-4">
        {activeLocation && (
          <>
            <h1 className="text-xl font-semibold">{activeLocation.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">{activeLocation.description}</p>

            <h3 className="mt-6 text-sm uppercase tracking-widest text-[var(--muted)]">Evidence here</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {evidenceHere.length === 0 && <li className="text-sm text-[var(--muted)]">Nothing found here yet.</li>}
              {evidenceHere.map((ev) => {
                const found = state.discoveredEvidenceIds.includes(ev.id);
                return (
                  <li key={ev.id} className="panel-raised p-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs uppercase text-[var(--muted)]">{ev.type.replace("_", " ")}</span>
                      <p className="text-sm mt-0.5">{found ? ev.description : "Something here might be worth a closer look."}</p>
                    </div>
                    {!found && (
                      <button className="btn btn-primary shrink-0" onClick={() => discoverEvidence(ev.id)}>
                        Examine
                      </button>
                    )}
                    {found && <span className="text-xs text-[var(--accent)] shrink-0">logged</span>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
