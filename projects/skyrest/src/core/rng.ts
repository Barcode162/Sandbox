// src/core/rng.ts — FROZEN (WO-001). Seeded mulberry32 whose whole state is one uint32 in SimState.rng,
// so snapshots are plain JSON and replays are exact. Never use the platform random source in the sim.

export interface RngHolder { rng: number }

/** Normalise any seed to a non-zero uint32. */
export function seedWord(seed: number): number {
  const w = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
  return w === 0 ? 0x6d2b79f5 : w;
}

/** Next float in [0, 1). Advances h.rng. */
export function rand(h: RngHolder): number {
  h.rng = (h.rng + 0x6d2b79f5) >>> 0;
  let t = h.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Float in [min, max). */
export function randRange(h: RngHolder, min: number, max: number): number {
  return min + (max - min) * rand(h);
}

/** Integer in [min, max] inclusive. */
export function randInt(h: RngHolder, min: number, max: number): number {
  return min + Math.floor(rand(h) * (max - min + 1));
}

/** True with probability p. */
export function chance(h: RngHolder, p: number): boolean {
  return rand(h) < p;
}

/** A tiny standalone RNG for render-side scatter (foliage, petals): deterministic per seed, not sim state. */
export function makeRng(seed: number): () => number {
  const h = { rng: seedWord(seed) };
  return () => rand(h);
}
