"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cellKey, nextMark, setMark, type Cells } from "@/lib/state/matrix";
import { TUTORIAL_BLOCK, TUTORIAL_STEPS, tutorialMistake } from "@/lib/state/tutorial";

export default function TutorialPage() {
  const [cells, setCells] = useState<Cells>({});
  const [step, setStep] = useState(0);
  const { rows, cols } = TUTORIAL_BLOCK;
  const current = TUTORIAL_STEPS[step];
  const finished = step === TUTORIAL_STEPS.length - 1 && TUTORIAL_STEPS.every((s) => s.done(cells)) && !tutorialMistake(cells);
  // Every lesson so far must still hold, not only the current one.
  const ready = TUTORIAL_STEPS.slice(0, step + 1).every((s) => s.done(cells)) && !tutorialMistake(cells);
  const exhibitRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (step > 0) exhibitRef.current?.focus();
  }, [step]);
  const exhibits = TUTORIAL_STEPS.slice(1, step + 1);

  return (
    <article className="w-full mx-auto max-w-6xl px-4 md:px-8 py-8 lg:py-12">
      <header className="flex flex-col md:flex-row md:items-end gap-3 border-b-2 border-[var(--rule-strong)] pb-4">
        <div>
          <p className="label text-[var(--copper)]">Instruction · A practice file</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.6rem] italic font-medium leading-none">How to read a case</h1>
        </div>
        <p className="md:ml-auto label text-[var(--muted)]">
          Step {step + 1} of {TUTORIAL_STEPS.length}
        </p>
      </header>

      <div className="mt-8 grid gap-10 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_auto] items-start">
        <section>
          {current.exhibit && (
            <p ref={exhibitRef} tabIndex={-1} aria-live="polite" className="flex gap-4 items-baseline border-b border-[var(--border)] pb-3">
              <span className="mono text-[var(--copper)] shrink-0 whitespace-nowrap">EX-{String(step).padStart(2, "0")}</span>
              <span className="display text-2xl italic">&ldquo;{current.exhibit}&rdquo;</span>
            </p>
          )}
          <p className="mt-4 text-lg max-w-[40rem]">{current.lesson}</p>
          {tutorialMistake(cells) && <p role="alert" className="mt-3 text-[var(--danger)]">One of your marks goes against the exhibits so far. Tap it to change it.</p>}
          {finished ? (
            <div className="mt-6 border-l-4 border-[var(--confirmed)] pl-4">
              <p className="display text-2xl italic text-[var(--confirmed)]" aria-live="polite">Cora Lind, in the Library.</p>
              <p className="mt-2 max-w-[40rem]">
                Cora&rsquo;s alibi never cracked on its own: she is the one whose story must be false, because everyone else&rsquo;s held. That is the whole method. A daily case adds a block for the method and more exhibits, but every one works like these: read it, cross out what it rules out, and the answer is what survives. Stuck? The matrix has hints.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/" className="btn btn-primary">
                  Open today&rsquo;s case →
                </Link>
                <button
                  className="btn"
                  onClick={() => {
                    setCells({});
                    setStep(0);
                  }}
                >
                  Start over
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3">
              <button className="btn btn-primary whitespace-nowrap" disabled={!ready} onClick={() => setStep((s) => s + 1)}>
                {step === 0 ? "Show the first exhibit" : "Next exhibit"} →
              </button>
              {!ready && step > 0 && <span className="label text-[var(--muted)]">Mark the grid to continue</span>}
            </div>
          )}

          {exhibits.length > 1 && (
            <ol className="mt-10">
              <li className="label text-[var(--muted)] border-b-2 border-[var(--rule-strong)] pb-2">Exhibits so far</li>
              {exhibits.slice(0, -1).map((s, i) => (
                <li key={i} className="py-2 border-b border-[var(--border)] text-sm text-[var(--muted)] grid grid-cols-[3.5rem_1fr]">
                  <span className="mono">EX-{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.exhibit}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-label="Practice matrix" className="min-w-0 overflow-x-auto">
          <table className="border border-[var(--rule-strong)] bg-[var(--surface)]">
            <thead>
              <tr>
                <th className="on-ink p-3 text-left align-bottom">
                  <span className="label text-[var(--brass-light)]">Persons × rooms</span>
                </th>
                {cols.items.map((c) => (
                  <th key={c.id} scope="col" className="on-ink px-2 py-3 w-16 md:w-20 text-center display text-lg italic font-normal">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.items.map((r) => (
                <tr key={r.id}>
                  <th scope="row" className="text-left px-3 py-2 font-normal whitespace-nowrap border-t border-[var(--border)]">
                    {r.name}
                  </th>
                  {cols.items.map((c) => {
                    const mark = cells[cellKey(rows.key, r.id, cols.key, c.id)];
                    return (
                      <td key={c.id} className="border-t border-l border-[var(--border)] p-0">
                        <button
                          aria-label={`${r.name} in the ${c.name}: ${mark === "o" ? "proven" : mark === "x" ? "ruled out" : "open"}`}
                          onClick={() => setCells((s) => setMark(s, TUTORIAL_BLOCK, r.id, c.id, nextMark(mark), false))}
                          className={`w-16 h-14 md:w-20 md:h-16 grid place-items-center text-2xl hover:bg-[var(--surface-raised)] ${
                            mark === "o" ? "text-[var(--confirmed)] font-bold" : "text-[var(--muted)]"
                          }`}
                        >
                          {mark === "o" ? "✓" : mark === "x" ? "✕" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </article>
  );
}
