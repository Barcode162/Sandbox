import { describe, expect, it } from 'vitest';
import { createRng, hashSeed } from '../../../src/sim/rng';

describe('seeded PRNG (§4.1)', () => {
  it('is reproducible per seed and differs across seeds', () => {
    const a = createRng(7), b = createRng(7), c = createRng(8);
    const sa = Array.from({ length: 64 }, () => a.next());
    expect(Array.from({ length: 64 }, () => b.next())).toEqual(sa);
    expect(Array.from({ length: 64 }, () => c.next())).not.toEqual(sa);
  });

  it('stays in range and is roughly uniform', () => {
    const r = createRng(12345);
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < 100_000; i++) {
      const v = r.next();
      expect(v >= 0 && v < 1).toBe(true);
      buckets[Math.floor(v * 10)]++;
    }
    for (const n of buckets) expect(Math.abs(n - 10_000)).toBeLessThan(500);
    for (let i = 0; i < 1000; i++) expect(r.int(3)).toBeLessThan(3);
  });

  it('hashSeed gives distinct non-negative seeds per run', () => {
    const seen = new Set<number>();
    for (let run = 0; run < 1000; run++) {
      const s = hashSeed(run, 0xdecafbad | 0);
      expect(s).toBeGreaterThanOrEqual(0);
      seen.add(s);
    }
    expect(seen.size).toBe(1000);
  });
});
