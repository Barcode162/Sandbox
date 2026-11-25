// src/world/noise.ts — owned by WO-002. Pure, deterministic, allocation-free value noise (no three, no DOM):
// the arena shape (ground.ts, used by the sim) and the procedural art share it.

/** Integer lattice hash → [0, 1). */
function hash2(ix: number, iz: number, seed: number): number {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Smooth 2D value noise in [-1, 1] (C2-continuous). */
export function noise2(x: number, z: number, seed = 0): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const u = fade(fx), v = fade(fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

/** Fractal sum of `octaves` noise2 layers, normalised to [-1, 1]. */
export function fbm2(x: number, z: number, octaves: number, seed = 0): number {
  let sum = 0, amp = 1, norm = 0, f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * f, z * f, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

/** Periodic 1D noise over an angle (period 2π), in [-1, 1]: value noise sampled round a circle. */
export function noiseAngle(theta: number, freq: number, seed = 0): number {
  return noise2(Math.cos(theta) * freq + 31.7, Math.sin(theta) * freq - 12.3, seed);
}
