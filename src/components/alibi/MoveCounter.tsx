/**
 * Always-visible moves indicator (docs' MOVE SYSTEM). Deliberately small and
 * unobtrusive — a number, not a progress bar with a filled track.
 */
export function MoveCounter({ used, budget }: { used: number; budget: number }) {
  const remaining = Math.max(budget - used, 0);
  const low = remaining <= 3;
  return (
    <div className="flex items-baseline gap-1.5 font-mono text-sm" aria-label={`${remaining} of ${budget} moves remaining`}>
      <span className={low ? "text-[var(--accent)]" : "text-[var(--foreground)]"}>{remaining}</span>
      <span className="text-[var(--muted)]">/ {budget} moves</span>
    </div>
  );
}
