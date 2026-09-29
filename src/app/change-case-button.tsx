"use client";

export function ChangeCaseButton() {
  return (
    <button
      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-2"
      onClick={() => {
        // A full reload, not client-side navigation, so AppShell's in-memory
        // selection and the GameProvider tree underneath it actually reset.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/?practice";
      }}
    >
      Practice mode: pick a different case
    </button>
  );
}
