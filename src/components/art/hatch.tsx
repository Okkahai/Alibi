/**
 * Engraving primitives shared by the hand-authored SVG plates. Every plate
 * draws in two inks only (line colour + paper) and gets its tone from line
 * hatching, the way a Victorian copper engraving does — never from gradients.
 */

/** Small deterministic string hash, so a character's portrait never changes between visits. */
export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // final avalanche so ids differing only in a trailing digit still spread across features
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Parallel-line hatch pattern. `id` must be unique per SVG (use React's useId). */
export function Hatch({ id, color, gap = 3, angle = 45, weight = 0.6 }: { id: string; color: string; gap?: number; angle?: number; weight?: number }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform={`rotate(${angle})`}>
      <line x1="0" y1="0" x2="0" y2={gap} stroke={color} strokeWidth={weight} />
    </pattern>
  );
}
