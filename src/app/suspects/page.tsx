"use client";

import Link from "next/link";
import { useGame } from "@/lib/state/game-context";
import { Portrait } from "@/components/art/portrait";
import { hashString } from "@/components/art/hatch";

function recordNo(i: number) {
  return `S-${String(i + 1).padStart(2, "0")}`;
}

export default function SuspectsPage() {
  const { truth } = useGame();
  const people = truth.characters.filter((c) => c.role !== "victim");
  const locationName = (id: string) => truth.locations.find((l) => l.id === id)?.name ?? id;

  return (
    <article>
      <header className="flex flex-col md:flex-row md:items-end gap-4 border-b-2 border-[var(--rule-strong)] pb-4">
        <div>
          <p className="label text-[var(--copper)]">Section II · Persons of interest</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium">The line-up</h1>
        </div>
        <p className="md:ml-auto md:max-w-[26rem] text-sm text-[var(--muted)]">
          Identification records taken on the night. Each person has given a statement of where they were; the statements are recorded here as given, not as verified.
        </p>
      </header>

      {/* Line-up: profile silhouettes against a height chart */}
      <figure className="on-ink mt-6 relative" aria-label="Line-up of persons of interest">
        <div
          className="relative px-4 md:px-8 pt-8 pb-3 grid gap-2 md:gap-4"
          style={{
            gridTemplateColumns: `repeat(${people.length}, minmax(0, 1fr))`,
            backgroundImage: "repeating-linear-gradient(to bottom, var(--ink-rule) 0 1px, transparent 1px 28px)",
          }}
        >
          {people.map((c, i) => {
            const scale = 0.86 + (hashString(c.id) % 15) / 100;
            return (
              <a key={c.id} href={`#${recordNo(i)}`} className="group flex flex-col items-center justify-end" aria-label={`${c.name}, record ${recordNo(i)}`}>
                <div className="w-full max-w-[9rem]" style={{ width: `${scale * 100}%` }}>
                  <Portrait seed={c.name} view="profile" ink="var(--on-ink)" paper="var(--ink)" framed={false} className="w-full h-auto group-hover:[&_g]:fill-[var(--brass-light)]" />
                </div>
              </a>
            );
          })}
        </div>
        <div className="grid gap-2 md:gap-4 px-4 md:px-8 pb-4 border-t border-[var(--brass)]" style={{ gridTemplateColumns: `repeat(${people.length}, minmax(0, 1fr))` }}>
          {people.map((c, i) => (
            <div key={c.id} className="pt-2 text-center">
              <span className="label text-[var(--brass-light)]">{recordNo(i)}</span>
              <span className="hidden md:block text-xs text-[var(--on-ink-muted)] truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </figure>

      <ol className="mt-10 grid gap-x-12 xl:grid-cols-2">
        {people.map((c, i) => (
          <li key={c.id} id={recordNo(i)} className="scroll-mt-6 border-t-2 border-[var(--rule-strong)] pt-3 pb-10">
            <div className="flex items-baseline justify-between">
              <span className="label text-[var(--muted)]">Identification record</span>
              <span className="mono text-[var(--copper)] text-sm">{recordNo(i)}</span>
            </div>
            <h2 className="mt-2 text-[2rem] leading-tight">{c.name}</h2>
            <p className="label text-[var(--muted)] mt-1">{c.role === "witness" ? "Witness" : "Person of interest"}</p>

            <div className="mt-4 grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)] gap-6 max-sm:grid-cols-1">
              <div className="grid grid-cols-2 gap-2 self-start max-w-[12rem]">
                <figure>
                  <Portrait seed={c.name} view="front" className="w-full h-auto bg-[var(--surface)]" title={`Front view silhouette of ${c.name}`} />
                  <figcaption className="label text-[var(--muted)] mt-1">Front</figcaption>
                </figure>
                <figure>
                  <Portrait seed={c.name} view="profile" className="w-full h-auto bg-[var(--surface)]" title={`Profile silhouette of ${c.name}`} />
                  <figcaption className="label text-[var(--muted)] mt-1">Profile</figcaption>
                </figure>
              </div>

              <dl className="text-sm">
                <div className="py-2 border-b border-[var(--border)]">
                  <dt className="label text-[var(--muted)]">Relation</dt>
                  <dd className="mt-0.5">{c.relationshipToVictim}</dd>
                </div>
                <div className="py-2 border-b border-[var(--border)]">
                  <dt className="label text-[var(--muted)]">Stated whereabouts</dt>
                  <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
                    <span className="display text-xl italic text-[var(--accent)]">“{locationName(c.claimedLocation)}”</span>
                    <span className="label text-[var(--muted)]">As stated · unverified</span>
                  </dd>
                </div>
                <div className="py-2 border-b border-[var(--border)]">
                  <dt className="label text-[var(--muted)]">Demeanour</dt>
                  <dd className="mt-0.5 text-[var(--muted)]">{c.personality}</dd>
                </div>
              </dl>
            </div>

            <Link href="/interrogation" className="btn mt-5">
              Call for interrogation <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </article>
  );
}
