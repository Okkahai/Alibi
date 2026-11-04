"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CaseTruth, Difficulty } from "@/lib/schema/case-truth";
import type { CaseSelection } from "@/lib/state/case-select";
import { resolveCaseTruth } from "@/lib/state/case-select";
import { getDailySelection, getUtcDateString, dailyCaseNumber } from "@/lib/engines/daily-case";
import { cases } from "@/data/cases";
import { WatchPlate, Seal, Fleuron } from "@/components/art/plates";
import { DOSSIER } from "./sections";
import { caseMeta, formatCaseDate, openCase, plateTime } from "./case-meta";

type Mode =
  | { kind: "preview"; selection: CaseSelection }
  | { kind: "active"; selection: CaseSelection | null; found: number; status: string };

/**
 * The case's title page: an ink frontispiece (giant case number, title,
 * record of particulars, Plate I) over an ivory contents-and-archive spread.
 */
export function Frontispiece({ truth, mode }: { truth: CaseTruth; mode: Mode }) {
  const meta = caseMeta(mode.selection);
  const suspects = truth.characters.filter((c) => c.role === "suspect");
  const time = plateTime(truth);
  const active = mode.kind === "active";

  const particulars: [string, string][] = [
    ["Deceased", truth.victim.name],
    ["Persons of interest", String(suspects.length).padStart(2, "0")],
    ["Rooms on file", String(truth.locations.length).padStart(2, "0")],
    active ? ["Exhibits recovered", `${String(mode.found).padStart(2, "0")} / ${String(truth.evidence.length).padStart(2, "0")}`] : ["Difficulty", truth.difficulty],
  ];

  return (
    <>
      <section className="on-ink relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10 pb-14 lg:pt-14 lg:pb-20 grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 items-start">
          <div>
            <p className="label text-[var(--brass-light)]">{meta.kicker}</p>

            <div className="mt-6 flex items-start gap-4">
              <span className="label text-[var(--on-ink-muted)] pt-3 md:pt-5 leading-tight">
                Case
                <br />
                Nº
              </span>
              <span className="display text-[6.5rem] md:text-[10rem] leading-[0.78] font-semibold text-[var(--brass)] tracking-tight" aria-label={`Case number ${meta.number ?? ""}`}>
                {meta.number ?? "—"}
              </span>
            </div>

            <h1 className="mt-8 text-[2.8rem] md:text-[4.6rem] italic font-medium text-[var(--on-ink)] leading-[0.95] max-w-[18ch]">{truth.title}</h1>

            <p className="mt-6 max-w-[38rem] text-[1.0625rem] leading-relaxed text-[var(--on-ink-muted)]">
              <span className="text-[var(--on-ink)]">{truth.victim.name}.</span> {truth.victim.description} {suspects.length} persons of interest each swear
              they were elsewhere. <span className="text-[var(--on-ink)]">One of them is lying, and the one whose story breaks is the killer.</span>
            </p>

            <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 border-t border-[var(--ink-rule)]">
              {particulars.map(([k, v], i) => (
                <div key={k} className={`pt-3 pb-1 pr-4 ${i > 0 ? "md:border-l md:pl-4" : ""} ${i % 2 === 1 ? "border-l pl-4" : ""} border-[var(--ink-rule)]`}>
                  <dt className="label text-[var(--on-ink-muted)]">{k}</dt>
                  <dd className="mt-1 mono text-[var(--on-ink)] capitalize">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              {active ? (
                <Link href="/crime-scene" className="btn btn-primary px-7 min-h-[3.25rem]">
                  {mode.found > 0 ? "Resume the investigation" : "Begin the investigation"} <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <button className="btn btn-primary px-7 min-h-[3.25rem]" onClick={() => openCase(mode.selection)}>
                  Open the case file <span aria-hidden="true">→</span>
                </button>
              )}
              <p className="label text-[var(--on-ink-muted)]">
                {active ? `Status · ${mode.status.replace("_", " ")}` : "One provable answer · no guessing"}
              </p>
              <Link href="/tutorial" className="label text-[var(--brass-light)] underline underline-offset-4 min-h-11 flex items-center">
                First time? How to read a case
              </Link>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[28rem] lg:mt-6">
            <WatchPlate time={time} className="w-full h-auto block" />
            <Seal caseNumber={meta.number ?? "—"} className="absolute -top-10 -right-1 md:-right-10 w-24 md:w-32 rotate-[-14deg]" />
            <figcaption className="mt-3 text-[0.8125rem] leading-snug text-[var(--on-ink-muted)]">
              <span className="label text-[var(--brass-light)]">Pl. I</span> — Pocket watch recovered with the deceased, its hands at{" "}
              <time className="mono text-[var(--on-ink)]">{time}</time>. <i className="display text-base">a</i> crown and bow; <i className="display text-base">b</i> chapter
              ring; <i className="display text-base">c</i> examining lens.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 py-14 grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionMark index="§ 1" title="Contents of the dossier" />
          <ol className="mt-2">
            {DOSSIER.map((s) => {
              const inner = (
                <>
                  <span className="display italic text-2xl text-[var(--copper)] w-12 shrink-0">{s.numeral}</span>
                  <span className="min-w-0">
                    <span className="display text-[1.55rem] leading-tight block group-hover:text-[var(--accent)]">{s.label}</span>
                    <span className="text-sm text-[var(--muted)]">{s.gloss}</span>
                  </span>
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className="label text-[var(--muted)] group-hover:text-[var(--accent)]" aria-hidden="true">
                    →
                  </span>
                </>
              );
              const cls = "group flex items-baseline gap-3 py-3 border-b border-[var(--border)] w-full text-left";
              return (
                <li key={s.href}>
                  {active ? (
                    <Link href={s.href} className={cls}>
                      {inner}
                    </Link>
                  ) : (
                    <button className={cls} onClick={() => openCase(mode.selection, s.href)}>
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="lg:col-span-5" id="archive">
          <SectionMark index="§ 2" title="The archive" />
          <ArchiveLedger current={mode.selection} />
          <OtherFiles />
        </aside>
      </section>

      <footer className="on-ink">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 flex flex-col md:flex-row gap-3 md:items-center">
          <Fleuron className="w-28 text-[var(--brass)]" />
          <p className="label text-[var(--on-ink-muted)] md:ml-auto">Every daily case is checked by a solver to have exactly one solution.</p>
        </div>
      </footer>
    </>
  );
}

function SectionMark({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b-2 border-[var(--rule-strong)] pb-2">
      <span className="label text-[var(--copper)]">{index}</span>
      <h2 className="text-[2rem]">{title}</h2>
    </div>
  );
}

function saveStatus(caseId: string): string | null {
  try {
    const raw = window.localStorage.getItem(`coldcase:save:${caseId}`);
    return raw ? (JSON.parse(raw).status as string) : null;
  } catch {
    return null;
  }
}

function ArchiveLedger({ current }: { current: CaseSelection | null }) {
  const today = getUtcDateString();
  const rows = useMemo(() => {
    const out: { seed: string; number: string; title: string; victim: string; status: string | null }[] = [];
    for (let i = 0; i < 7; i++) {
      const seed = getUtcDateString(new Date(Date.parse(`${today}T00:00:00Z`) - i * 86400000));
      const number = dailyCaseNumber(seed);
      if (!number) break;
      const selection = getDailySelection(new Date(`${seed}T00:00:00Z`));
      const truth = resolveCaseTruth(selection);
      out.push({ seed, number, title: truth.title, victim: truth.victim.name, status: saveStatus(truth.id) });
    }
    return out;
  }, [today]);

  return (
    <table className="w-full mt-2 text-sm">
      <caption className="sr-only">Daily cases, most recent first</caption>
      <thead>
        <tr className="label text-[var(--muted)] text-left">
          <th className="py-2 font-normal w-14">Nº</th>
          <th className="py-2 font-normal">Case</th>
          <th className="py-2 font-normal text-right">Record</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const isCurrent = current?.kind === "generated" && current.seed === r.seed;
          return (
            <tr key={r.seed} className="border-t border-[var(--border)]">
              <td className="py-2.5 mono text-[var(--copper)] align-top">{r.number}</td>
              <td className="py-2.5">
                <button className="text-left min-h-11 hover:text-[var(--accent)] underline-offset-4 hover:underline" onClick={() => openCase(getDailySelection(new Date(`${r.seed}T00:00:00Z`)))}>
                  <span className="display text-lg leading-tight block">{r.title}</span>
                  <span className="block text-sm text-[var(--muted)]">The late {r.victim}</span>
                  <span className="label text-[var(--muted)]">{r.seed === today ? "Today" : formatCaseDate(r.seed)}</span>
                </button>
              </td>
              <td className="py-2.5 text-right label align-top">
                {r.status === "accused" ? (
                  <span className="text-[var(--confirmed)] whitespace-nowrap">✓ Closed</span>
                ) : isCurrent ? (
                  <span className="text-[var(--copper)] whitespace-nowrap">◆ On desk</span>
                ) : r.status ? (
                  <span className="text-[var(--accent)] whitespace-nowrap">◐ In progress</span>
                ) : (
                  <span className="text-[var(--muted)] whitespace-nowrap">Unopened</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function OtherFiles() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  return (
    <div className="mt-10 border-t-2 border-[var(--rule-strong)] pt-4">
      <p className="label text-[var(--copper)]">Other files</p>
      <ul className="mt-2">
        {Object.values(cases).map((c) => (
          <li key={c.id} className="border-b border-[var(--border)]">
            <button className="w-full text-left py-3 flex items-baseline gap-3 hover:text-[var(--accent)]" onClick={() => openCase({ kind: "static", id: c.id })}>
              <span className="mono text-[var(--copper)] w-14 shrink-0">H-01</span>
              <span className="display text-lg">{c.title}</span>
              <span className="ml-auto label text-[var(--muted)]">Handcrafted</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="label text-[var(--muted)]">Practice file</span>
        <div role="radiogroup" aria-label="Practice difficulty" className="flex">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              role="radio"
              aria-checked={difficulty === d}
              onClick={() => setDifficulty(d)}
              className={`label px-3 min-h-[2.75rem] border border-[var(--rule-strong)] -ml-px ${difficulty === d ? "bg-[var(--ink)] text-[var(--on-ink)]" : ""}`}
            >
              {d}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => openCase({ kind: "generated", seed: crypto.randomUUID(), difficulty })}>
          Draw a file
        </button>
      </div>
    </div>
  );
}
