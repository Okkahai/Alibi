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
        <div className="absolute left-1 md:left-2 top-8 flex flex-col mono text-[0.6rem] leading-none text-[var(--on-ink-muted)]" aria-hidden="true">
          {["6′6″", "", "6′0″", "", "5′6″", "", "5′0″"].map((h, i) => (
            <span key={i} className="h-[28px] -translate-y-1/2">{h}</span>
          ))}
        </div>
        <div
          className="relative pl-8 pr-3 md:pl-12 md:pr-8 pt-8 pb-3 grid gap-2 md:gap-4"
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
                  <Portrait seed={c.name} view="profile" ink="var(--on-ink)" highlight="var(--brass)" framed={false} className="w-full h-auto group-hover:[&_g]:fill-[var(--brass-light)]" />
                </div>
              </a>
            );
          })}
        </div>
        <div className="grid gap-2 md:gap-4 pl-8 pr-3 md:pl-12 md:pr-8 pb-4 border-t border-[var(--brass)]" style={{ gridTemplateColumns: `repeat(${people.length}, minmax(0, 1fr))` }}>
          {people.map((c, i) => (
            <div key={c.id} className="pt-2 text-center">
              <span className="label text-[var(--brass-light)]">{recordNo(i)}</span>
              <span className="hidden md:block text-xs text-[var(--on-ink-muted)] truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </figure>

      <ol className="mt-10">
        {people.map((c, i) => (
          <li key={c.id} id={recordNo(i)} className="scroll-mt-6 border-t-2 border-[var(--rule-strong)] pt-3 pb-8 grid gap-x-8 gap-y-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
            <div className="grid grid-cols-2 gap-2 self-start max-w-[15rem]">
              <figure>
                <Portrait seed={c.name} view="front" className="w-full h-auto bg-[var(--surface)]" title={`Front view silhouette of ${c.name}`} />
                <figcaption className="label text-[var(--muted)] mt-1">Front</figcaption>
              </figure>
              <figure>
                <Portrait seed={c.name} view="profile" className="w-full h-auto bg-[var(--surface)]" title={`Profile silhouette of ${c.name}`} />
                <figcaption className="label text-[var(--muted)] mt-1">Profile</figcaption>
              </figure>
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-4">
                <span className="mono text-[var(--copper)]">{recordNo(i)}</span>
                <span className="label text-[var(--muted)]">Identification record · {c.role === "witness" ? "Witness" : "Person of interest"}</span>
              </div>
              <h2 className="mt-1 text-[2.1rem] leading-tight">{c.name}</h2>

              <dl className="mt-3 grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-x-8 text-sm border-t border-[var(--border)]">
                <div className="py-2 border-b border-[var(--border)]">
                  <dt className="label text-[var(--muted)]">Relation to the deceased</dt>
                  <dd className="mt-0.5">{c.relationshipToVictim}</dd>
                </div>
                <div className="py-2 border-b border-[var(--border)] sm:row-span-2">
                  <dt className="label text-[var(--muted)]">Stated whereabouts</dt>
                  <dd className="mt-0.5">
                    <span className="display text-2xl italic text-[var(--accent)]">“{locationName(c.claimedLocation)}”</span>
                    <span className="block label text-[var(--muted)] mt-1">As stated · unverified</span>
                  </dd>
                </div>
                <div className="py-2 border-b border-[var(--border)]">
                  <dt className="label text-[var(--muted)]">Demeanour</dt>
                  <dd className="mt-0.5 text-[var(--muted)]">{c.personality}</dd>
                </div>
              </dl>

              <Link href="/interrogation" className="btn mt-4">
                Call for interrogation <span aria-hidden="true">→</span>
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
