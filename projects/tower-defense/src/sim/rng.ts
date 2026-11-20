// Seeded deterministic RNG (mulberry32). Implemented in WO-001; owned by WO-002 afterwards.
// The sim must use only this — never Math.random, Date or performance (tests/unit/data/contracts.test.ts).
export interface Rng {
  /** Uniform [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** Uniform [a, b). */
  range(a: number, b: number): number;
  /** Current internal state (for hashing / snapshots). */
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0 || 0x9e3779b9;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n) => Math.floor(next() * n),
    range: (lo, hi) => lo + (hi - lo) * next(),
    get state() { return a; },
  };
}
