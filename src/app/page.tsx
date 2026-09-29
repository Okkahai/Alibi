"use client";

import Link from "next/link";
import { useGame } from "@/lib/state/game-context";

export default function CaseDesk() {
  const { truth, state, resetSave } = useGame();
  const evidenceFound = state.discoveredEvidenceIds.length;
  const evidenceTotal = truth.evidence.length;

  return (
    <div className="flex flex-col gap-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Case File</p>
        <h1 className="text-2xl font-semibold mt-1">{truth.title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Victim: <span className="text-[var(--foreground)]">{truth.victim.name}</span> — {truth.victim.description}
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="text-[var(--muted)]">Difficulty</span>
            <p className="capitalize">{truth.difficulty}</p>
          </div>
          <div>
            <span className="text-[var(--muted)]">Suspects</span>
            <p>{truth.characters.filter((c) => c.role === "suspect").length}</p>
          </div>
          <div>
            <span className="text-[var(--muted)]">Locations</span>
            <p>{truth.locations.length}</p>
          </div>
          <div>
            <span className="text-[var(--muted)]">Evidence found</span>
            <p>
              {evidenceFound} / {evidenceTotal}
            </p>
          </div>
          <div>
            <span className="text-[var(--muted)]">Status</span>
            <p className="capitalize">{state.status.replace("_", " ")}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DeskLink href="/crime-scene" title="Crime Scene" description="Walk the locations and search for evidence." />
        <DeskLink href="/suspects" title="Suspects" description="Review who was where, and who had reason." />
        <DeskLink href="/interrogation" title="Interrogation" description="Ask questions. Confront lies with evidence." />
        <DeskLink href="/evidence" title="Evidence" description="Everything discovered so far." />
        <DeskLink href="/timeline" title="Timeline" description="Reconstruct the night, in order." />
        <DeskLink href="/evidence-board" title="Evidence Board" description="Connect suspects, evidence, and events." />
        <DeskLink href="/accusation" title="Accusation" description="Name the culprit, motive, method, and proof." />
      </section>

      <div>
        <button className="btn text-[var(--muted)]" onClick={resetSave}>
          Start over
        </button>
      </div>
    </div>
  );
}

function DeskLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="panel-raised p-4 flex flex-col gap-1 hover:border-[var(--accent)]">
      <span className="font-medium">{title}</span>
      <span className="text-xs text-[var(--muted)]">{description}</span>
    </Link>
  );
}
