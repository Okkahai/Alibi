"use client";

import { CASE_SELECTION_KEY } from "@/lib/state/case-select";

export function ChangeCaseButton() {
  return (
    <button
      className="px-2 py-1 rounded hover:bg-[var(--surface-raised)] whitespace-nowrap text-sm"
      onClick={() => {
        window.localStorage.removeItem(CASE_SELECTION_KEY);
        // A full reload, not client-side navigation, so AppShell's in-memory
        // selection and the GameProvider tree underneath it actually reset.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/";
      }}
    >
      Change case
    </button>
  );
}
