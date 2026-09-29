/**
 * Deterministic seeded PRNG. The same seed string always produces the same
 * sequence — required so a CaseGenerator run with a given seed is
 * reproducible (regenerate a case from its id/seed and get the same case).
 */

/** djb2-style string hash, folded into a 32-bit unsigned int for mulberry32's seed. */
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Pick one element uniformly at random. */
  pick<T>(items: readonly T[]): T;
  /** Pick `count` distinct elements, order randomized, without replacement. */
  sample<T>(items: readonly T[], count: number): T[];
  /** True with probability `p` (0-1). */
  chance(p: number): boolean;
}

export function createRng(seed: string): Rng {
  let state = hashSeed(seed) || 1;

  function next(): number {
    // mulberry32
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(maxExclusive: number): number {
    return Math.floor(next() * maxExclusive);
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Cannot pick from an empty array.");
    return items[int(items.length)];
  }

  function sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items];
    const result: T[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = int(pool.length);
      result.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return result;
  }

  function chance(p: number): boolean {
    return next() < p;
  }

  return { next, int, pick, sample, chance };
}
