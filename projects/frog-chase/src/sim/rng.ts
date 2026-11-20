/**
 * Seedable PRNG (§4.1). Implemented in WO-001 (frozen algorithm: sfc32 seeded via splitmix32).
 * Owner after wave 0: WO-002. Changing the algorithm changes every seeded river and every screenshot.
 */

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** Uniform in [a, b). */
  range(a: number, b: number): number;
  /** true with probability p. */
  chance(p: number): boolean;
}

function splitmix32(a: number): () => number {
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    t ^= t >>> 15;
    return t >>> 0;
  };
}

export function createRng(seed: number): Rng {
  const sm = splitmix32(seed | 0);
  let a = sm(), b = sm(), c = sm(), d = sm();
  const u32 = (): number => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };
  for (let i = 0; i < 12; i++) u32();
  const next = (): number => u32() / 4294967296;
  return {
    next,
    int: (n) => Math.floor(next() * n),
    range: (lo, hi) => lo + (hi - lo) * next(),
    chance: (p) => next() < p,
  };
}

/** Default per-run seed (§4.1): hash(runCounter, sessionSalt) → positive 31-bit int. */
export function hashSeed(runCounter: number, sessionSalt: number): number {
  let h = Math.imul((runCounter | 0) ^ 0x5bd1e995, 0x27d4eb2d) ^ (sessionSalt | 0);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) & 0x7fffffff;
}
