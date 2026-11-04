"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GameProvider, useGame } from "@/lib/state/game-context";
import { resolveCaseTruth, type CaseSelection } from "@/lib/state/case-select";
import { getDailySelection } from "@/lib/engines/daily-case";
import { SiteHeader } from "@/components/dossier/site-header";
import { DossierRail } from "@/components/dossier/dossier-rail";
import { Frontispiece } from "@/components/dossier/frontispiece";
import { caseMeta, readSelection } from "@/components/dossier/case-meta";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<CaseSelection | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hydration step (server always starts with no selection), not a sync loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection(readSelection());
    setHydrated(true);
  }, []);

  const truth = useMemo(() => (selection ? safeResolve(selection) : null), [selection]);

  if (!hydrated) return <SiteHeader />;

  // The tutorial is its own practice file and needs no case on the desk.
  if (pathname === "/tutorial")
    return (
      <>
        <SiteHeader />
        <main id="main">{children}</main>
      </>
    );

  if (!selection || !truth) {
    // No case on the desk: today's daily case is the front page.
    const daily = getDailySelection();
    return (
      <>
        <SiteHeader />
        <main>
          <Frontispiece truth={resolveCaseTruth(daily)} mode={{ kind: "preview", selection: daily }} />
        </main>
      </>
    );
  }

  return (
    <GameProvider key={truth.id} truth={truth}>
      <ActiveCase selection={selection}>{children}</ActiveCase>
    </GameProvider>
  );
}

function safeResolve(selection: CaseSelection) {
  try {
    return resolveCaseTruth(selection);
  } catch {
    return null; // stale/unknown selection: fall back to the front page
  }
}

function ActiveCase({ selection, children }: { selection: CaseSelection; children: ReactNode }) {
  const { truth, state } = useGame();
  const pathname = usePathname();
  const meta = caseMeta(selection);
  const progress = { found: state.discoveredEvidenceIds.length, total: truth.evidence.length };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:m-2 focus:p-3 focus:bg-[var(--surface)] label">
        Skip to content
      </a>
      <SiteHeader caseNumber={meta.number} caseTitle={truth.title} progress={progress} />
      {pathname === "/" ? (
        <main id="main" className="w-full">{children}</main>
      ) : (
        <div className="w-full mx-auto max-w-7xl px-4 md:px-8 py-6 lg:py-10 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
          <DossierRail caseNumber={meta.number} caseTitle={truth.title} />
          <main id="main" className="min-w-0">{children}</main>
        </div>
      )}
    </>
  );
}
