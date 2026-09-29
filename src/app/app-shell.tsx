"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GameProvider } from "@/lib/state/game-context";
import { CASE_SELECTION_KEY, resolveCaseTruth, type CaseSelection } from "@/lib/state/case-select";
import { getDailySelection } from "@/lib/engines/daily-case";
import { CasePicker } from "./case-picker";

export function AppShell({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<CaseSelection | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Hydration step (server always starts with nothing selected), not a sync loop.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("practice")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowPicker(true);
    }
    const raw = window.localStorage.getItem(CASE_SELECTION_KEY);
    if (raw) {
      try {
        setSelection(JSON.parse(raw));
      } catch {
        // corrupted selection, fall through to today's daily case
      }
    } else {
      // Daily-first UX: a first-time visitor lands straight in today's case,
      // not a picker. Practice/generated cases stay reachable at /?practice.
      const daily = getDailySelection();
      window.localStorage.setItem(CASE_SELECTION_KEY, JSON.stringify(daily));
      setSelection(daily);
    }
    setHydrated(true);
  }, []);

  const truth = useMemo(() => (selection ? resolveCaseTruth(selection) : null), [selection]);

  if (!hydrated) return null;

  if (showPicker || !selection || !truth) {
    return (
      <CasePicker
        onSelect={(next) => {
          window.localStorage.setItem(CASE_SELECTION_KEY, JSON.stringify(next));
          setSelection(next);
          setShowPicker(false);
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
