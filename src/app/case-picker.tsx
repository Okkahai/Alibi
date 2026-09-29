"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/schema/case-truth";
import type { CaseSelection } from "@/lib/state/case-select";
import { cases } from "@/data/cases";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function CasePicker({ onSelect }: { onSelect: (selection: CaseSelection) => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Case Files</p>
        <h1 className="text-2xl font-semibold mt-1">Pick a case</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Play the handcrafted case, or generate a new one on the spot.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        {Object.values(cases).map((c) => (
          <button
            key={c.id}
            className="panel-raised p-4 text-left flex flex-col gap-1 hover:border-[var(--accent)]"
            onClick={() => onSelect({ kind: "static", id: c.id })}
          >
            <span className="font-medium">{c.title}</span>
            <span className="text-xs text-[var(--muted)] capitalize">
              {c.difficulty} · {c.characters.filter((ch) => ch.role === "suspect").length} suspects · {c.locations.length} locations
            </span>
          </button>
        ))}
      </section>

      <section className="panel p-6 flex flex-col gap-3">
        <span className="font-medium">Generate a new case</span>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`btn capitalize ${difficulty === d ? "btn-primary" : ""}`}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary self-start"
          onClick={() => onSelect({ kind: "generated", seed: crypto.randomUUID(), difficulty })}
        >
          Generate case
        </button>
      </section>
    </div>
  );
}
