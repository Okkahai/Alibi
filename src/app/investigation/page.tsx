"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/lib/state/game-context";
import { MoveCounter } from "@/components/alibi/MoveCounter";
import { DAILY_MOVES_BUDGET } from "@/lib/engines/daily-case";

type Tab = "locations" | "suspects" | "evidence";

const OTHER_ROOMS = [
  { href: "/interrogation", label: "Interrogation" },
  { href: "/timeline", label: "Timeline" },
  { href: "/evidence-board", label: "Evidence Board" },
  { href: "/accusation", label: "Accusation" },
];

export default function InvestigationPage() {
  const { truth, state, visitLocation, discoverEvidence, setNotes } = useGame();
  const [tab, setTab] = useState<Tab>("locations");
  const [activeLocationId, setActiveLocationId] = useState(truth.locations[0]?.id ?? "");

  const activeLocation = truth.locations.find((l) => l.id === activeLocationId);
  const evidenceHere = truth.evidence.filter((e) => e.locationId === activeLocationId);
  const discoveredEvidence = truth.evidence.filter((e) => state.discoveredEvidenceIds.includes(e.id));
  const suspects = truth.characters.filter((c) => c.role !== "victim");

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] min-h-0">
      {/* LEFT — case navigation */}
      <div className="border-b lg:border-b-0 lg:border-r border-[var(--border)] flex flex-col">
        <div className="flex lg:flex-col">
          <TabButton active={tab === "locations"} onClick={() => setTab("locations")}>
            Locations
          </TabButton>
          <TabButton active={tab === "suspects"} onClick={() => setTab("suspects")}>
            Suspects
          </TabButton>
          <TabButton active={tab === "evidence"} onClick={() => setTab("evidence")}>
            Evidence ({discoveredEvidence.length})
          </TabButton>
        </div>

        {tab === "locations" && (
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {truth.locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  setActiveLocationId(loc.id);
                  visitLocation(loc.id);
                }}
                className={`text-left px-3 py-2 rounded text-sm ${
                  loc.id === activeLocationId
                    ? "bg-[var(--surface-raised)] border border-[var(--accent)]"
                    : "hover:bg-[var(--surface-raised)] border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{loc.name}</span>
                  {state.visitedLocationIds.includes(loc.id) && (
                    <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] shrink-0">visited</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-[var(--border)] p-2 flex flex-wrap lg:flex-col gap-1">
          {OTHER_ROOMS.map((r) => (
            <Link key={r.href} href={r.href} className="text-xs px-3 py-1.5 rounded hover:bg-[var(--surface-raised)] text-[var(--muted)]">
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* CENTER — active content */}
      <div className="p-4 sm:p-6 overflow-y-auto">
        {tab === "locations" && activeLocation && (
          <div>
            <h1 className="case-title text-2xl">{activeLocation.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">{activeLocation.description}</p>

            <h2 className="mt-6 text-xs uppercase tracking-widest text-[var(--muted)]">Evidence here</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {evidenceHere.length === 0 && <li className="text-sm text-[var(--muted)]">Nothing found here yet.</li>}
              {evidenceHere.map((ev) => {
                const found = state.discoveredEvidenceIds.includes(ev.id);
                return (
                  <li key={ev.id} className="panel-raised p-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{ev.type.replace("_", " ")}</span>
                      <p className="text-sm mt-0.5">{found ? ev.description : "Something here might be worth a closer look."}</p>
                    </div>
                    {!found && (
                      <button className="btn btn-primary shrink-0 text-xs py-1.5" disabled={state.movesUsed >= DAILY_MOVES_BUDGET} onClick={() => discoverEvidence(ev.id)}>
                        Examine (1 move)
                      </button>
                    )}
                    {found && <span className="text-xs accent-text shrink-0">logged</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "suspects" && (
          <div className="flex flex-col gap-3">
            <h1 className="case-title text-2xl">Suspects</h1>
            {suspects.map((s) => (
              <Link key={s.id} href="/interrogation" className="panel-raised p-4 flex flex-col gap-1 hover:border-[var(--accent)]">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-[var(--muted)]">{s.relationshipToVictim}</span>
              </Link>
            ))}
          </div>
        )}

        {tab === "evidence" && (
          <div className="flex flex-col gap-3">
            <h1 className="case-title text-2xl">Evidence log</h1>
            {discoveredEvidence.length === 0 && <p className="text-sm text-[var(--muted)]">Nothing logged yet. Search the locations.</p>}
            {discoveredEvidence.map((ev) => (
              <div key={ev.id} className="panel-raised p-3">
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{ev.type.replace("_", " ")}</span>
                <p className="text-sm mt-0.5">{ev.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — investigation state */}
      <div className="border-t lg:border-t-0 lg:border-l border-[var(--border)] p-4 flex flex-col gap-4">
        <MoveCounter used={state.movesUsed} budget={DAILY_MOVES_BUDGET} />

        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Notes</p>
          <textarea
            value={state.playerNotes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder="Track your theory as you go..."
            className="w-full panel-raised px-3 py-2 rounded text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 lg:flex-none text-left px-4 py-3 text-sm font-medium border-b-2 lg:border-b-0 lg:border-l-2 ${
        active ? "border-[var(--accent)] text-[var(--foreground)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}
