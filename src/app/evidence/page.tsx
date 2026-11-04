"use client";

import Link from "next/link";
import { useGame } from "@/lib/state/game-context";
import { SpecimenGlyph } from "@/components/art/specimen";

const RELIABILITY = {
  reliable: { glyph: "✓", text: "Corroborated", cls: "text-[var(--confirmed)]" },
  circumstantial: { glyph: "◐", text: "Circumstantial", cls: "text-[var(--copper)]" },
  misleading: { glyph: "?", text: "Doubtful", cls: "text-[var(--danger)]" },
} as const;

export default function EvidencePage() {
  const { truth, state } = useGame();
  const exhibits = truth.evidence
    .map((ev, i) => ({ ev, no: `EX-${String(i + 1).padStart(2, "0")}` }))
    .filter(({ ev }) => state.discoveredEvidenceIds.includes(ev.id));
  const roomName = (id: string) => truth.locations.find((l) => l.id === id)?.name ?? id;

  return (
    <article>
      <header className="on-ink px-5 md:px-8 py-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="label text-[var(--brass-light)]">Section IV · Exhibits</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium text-[var(--on-ink)]">Catalogue of specimens</h1>
          <p className="mt-2 max-w-[36rem] text-sm text-[var(--on-ink-muted)]">
            Every item recovered from the scene, entered in the order it was catalogued at the house. Reliability is the examiner&apos;s note, not a verdict.
          </p>
        </div>
        <p className="display text-[5rem] leading-none text-[var(--brass)]" aria-label={`${exhibits.length} of ${truth.evidence.length} exhibits catalogued`}>
          {String(exhibits.length).padStart(2, "0")}
          <span className="text-[2rem] text-[var(--on-ink-muted)]"> / {String(truth.evidence.length).padStart(2, "0")}</span>
        </p>
      </header>

      {exhibits.length === 0 ? (
        <div className="border-b-2 border-[var(--rule-strong)] py-10 text-center">
          <p className="display text-2xl italic">The catalogue is empty.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Search the rooms of the house to recover exhibits.</p>
          <Link href="/crime-scene" className="btn btn-primary mt-5">
            Go to the scene <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <ol className="mt-2">
          {exhibits.map(({ ev, no }) => {
            const r = RELIABILITY[ev.reliability];
            return (
              <li key={ev.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] md:grid-cols-[6rem_minmax(0,1fr)_12rem] gap-x-5 gap-y-2 py-5 border-b border-[var(--border)]">
                <div className="row-span-2 md:row-span-1 border border-[var(--rule-strong)] bg-[var(--surface)] p-2 text-[var(--ink)] self-start">
                  <SpecimenGlyph type={ev.type} className="w-full h-auto" />
                </div>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="mono text-[var(--copper)]">{no}</span>
                    <span className="label text-[var(--muted)]">{ev.type.replace(/_/g, " ")}</span>
                  </p>
                  <p className="mt-1 text-[1.0625rem] leading-snug">{ev.description}</p>
                </div>
                <dl className="text-sm md:border-l md:border-[var(--border)] md:pl-4 grid grid-cols-2 md:grid-cols-1 gap-2 content-start">
                  <div>
                    <dt className="label text-[var(--muted)]">Recovered in</dt>
                    <dd className="display text-lg italic">{roomName(ev.locationId)}</dd>
                  </div>
                  <div>
                    <dt className="label text-[var(--muted)]">Examiner&apos;s note</dt>
                    <dd className={`label ${r.cls}`}>
                      {r.glyph} {r.text}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
