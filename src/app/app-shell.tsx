"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GameProvider } from "@/lib/state/game-context";
import { CASE_SELECTION_KEY, resolveCaseTruth, type CaseSelection } from "@/lib/state/case-select";
import { CasePicker } from "./case-picker";

export function AppShell({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<CaseSelection | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(CASE_SELECTION_KEY);
    if (raw) {
      try {
        // Hydration step (server always starts with no selection), not a sync loop.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelection(JSON.parse(raw));
      } catch {
        // corrupted selection, fall through to the picker
      }
    }
    setHydrated(true);
  }, []);

  const truth = useMemo(() => (selection ? resolveCaseTruth(selection) : null), [selection]);

  if (!hydrated) return null;

  if (!selection || !truth) {
    return (
      <CasePicker
        onSelect={(next) => {
          window.localStorage.setItem(CASE_SELECTION_KEY, JSON.stringify(next));
          setSelection(next);
        }}
      />
    );
  }

  return (
    <GameProvider key={truth.id} truth={truth}>
      {children}
    </GameProvider>
  );
}
