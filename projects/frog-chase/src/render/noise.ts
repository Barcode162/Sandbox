/**
 * Cosmetic hashing and value noise for render-only variety (scissor-cut edges, bank props, ambient life).
 * Never used by the sim; deterministic so screenshots are repeatable.
 */

/** 32-bit integer hash (lowbias32). */
export function hash32(n: number): number {
  let x = n | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

/** Hash of up to three integers to [0, 1). */
export function rand3(a: number, b = 0, c = 0): number {
  return hash32(hash32(hash32(a) ^ Math.imul(b | 0, 0x9e3779b1)) ^ Math.imul(c | 0, 0x85ebca77)) / 4294967296;
}

/** Periodic 2D value noise in [0, 1): lattice period `per` cells, so tiles wrap seamlessly. */
export function valueNoise(x: number, y: number, per: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const m = (v: number) => ((v % per) + per) % per;
  const x0 = m(xi), x1 = m(xi + 1), y0 = m(yi), y1 = m(yi + 1);
  const a = rand3(x0, y0, seed), b = rand3(x1, y0, seed), c = rand3(x0, y1, seed), d = rand3(x1, y1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
