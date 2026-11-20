// §4.1 G1–G8 over 10 000 seeds. Checks collect violations (cheap) and assert once per rule.
import { describe, expect, it } from 'vitest';
import type { Pad, River } from '../../../src/contracts';
import { DECOR_CLEAR, generateRiver, JITTER_X, JITTER_Y, MIN_IN_LAYER, MIN_RIM_GAP, posSlot, pTrick, R_MAX, R_MIN, SLOTS_2, SLOTS_3 } from '../../../src/sim/generator';
import { choicesFrom } from '../../../src/sim/sim';
import { TUNING } from '../../../src/tuning';

const SEEDS = 10_000;
const N = TUNING.layers;
const P = TUNING.pitch;
/** Streams the 10 000 test rivers (never more than one in memory: parallel workers share RAM). */
const rivers: Iterable<River> = {
  *[Symbol.iterator]() {
    for (let i = 0; i < SEEDS; i++) yield generateRiver(i * 7919 + 1);
  },
};
const lilies = (layer: readonly Pad[]) => layer.filter((p) => p.kind === 'lily');

const binom = (n: number, k: number): number => (k === 0 || k === n ? 1 : binom(n - 1, k - 1) + binom(n - 1, k));

/** Collects up to 5 failure descriptions per rule. */
function rule() {
  const bad: string[] = [];
  let n = 0;
  return {
    ok(cond: boolean, msg: () => string) {
      if (!cond && n++ < 5) bad.push(msg());
    },
    get fails() {
      return { count: n, first: bad };
    },
  };
}

describe('generator (§4.1)', () => {
  it('G8 · pure data, deterministic per seed, flat ids, banks', () => {
    expect(JSON.stringify(generateRiver(7))).toBe(JSON.stringify(generateRiver(7)));
    expect(JSON.stringify(generateRiver(7))).not.toBe(JSON.stringify(generateRiver(8)));
    const r = rule();
    for (const rv of rivers) {
      r.ok(rv.layers.length === N + 2, () => `seed ${rv.seed} layers ${rv.layers.length}`);
      rv.pads.forEach((p, i) => r.ok(p.id === i, () => `seed ${rv.seed} id ${p.id}≠${i}`));
      r.ok(rv.layers.flat().every((p, i) => rv.pads[i] === p), () => `seed ${rv.seed} flat order`);
      for (const k of [0, N + 1]) {
        const b = rv.layers[k]!;
        r.ok(b.length === 1 && b[0]!.kind === 'bank' && b[0]!.x === 50 && b[0]!.y === k * P && b[0]!.r === 0, () => `seed ${rv.seed} bank ${k}`);
      }
    }
    expect(r.fails).toEqual({ count: 0, first: [] });
  });

  it('G1 · three pads to layer 5 (and the scripted layer 6), then about 65% three', () => {
    const r = rule();
    let threes = 0, total = 0;
    for (const rv of rivers)
      for (let k = 1; k <= N; k++) {
        const c = rv.layers[k]!.length;
        r.ok(c === 2 || c === 3, () => `seed ${rv.seed} k${k} c=${c}`);
        if (k <= 6) r.ok(c === 3, () => `seed ${rv.seed} k${k} c=${c}`);
        else {
          total++;
          if (c === 3) threes++;
        }
      }
    expect(r.fails).toEqual({ count: 0, first: [] });
    expect(Math.abs(threes / total - 0.65)).toBeLessThan(0.01);
  });

  it('G2 · slot centres, jitter, radii, in-layer spacing, no overlap across layers, all in the river', () => {
    const r = rule();
    let maxHop = 0;
    for (const rv of rivers)
      for (let k = 1; k <= N; k++) {
        const L = rv.layers[k]!;
        const bases = L.length === 3 ? [SLOTS_3] : SLOTS_2;
        const at = `seed ${rv.seed} k${k}`;
        r.ok(bases.some((b) => L.every((p, i) => Math.abs(p.x - b[i]!) <= JITTER_X)), () => `${at} x off-slot`);
        L.forEach((p, i) => {
          r.ok(p.layer === k && p.index === i, () => `${at} layer/index`);
          r.ok(Math.abs(p.y - k * P) <= JITTER_Y, () => `${at} y ${p.y}`);
          r.ok(p.r >= R_MIN && p.r <= R_MAX, () => `${at} r ${p.r}`);
          r.ok(p.x - p.r > 0 && p.x + p.r < TUNING.width, () => `${at} outside river`);
          r.ok(p.rot >= 0 && p.rot < Math.PI * 2 && p.phase >= 0 && p.phase < Math.PI * 2, () => `${at} angles`);
          if (i > 0) r.ok(p.x > L[i - 1]!.x, () => `${at} not west→east`);
          for (let j = i + 1; j < L.length; j++) r.ok(Math.hypot(p.x - L[j]!.x, p.y - L[j]!.y) >= MIN_IN_LAYER, () => `${at} in-layer spacing`);
          for (const q of rv.layers[k - 1]!) {
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            maxHop = Math.max(maxHop, d);
            if (q.kind !== 'bank') r.ok(d >= p.r + q.r + MIN_RIM_GAP, () => `${at} overlaps layer below`);
          }
        });
      }
    expect(r.fails).toEqual({ count: 0, first: [] });
    // §4.1 says "max hop 1.9P by construction"; with 22/78 slots, ±6 jitter and complete bipartite hops the
    // real bound is ≈2.9P. The hop takes 260 ms whatever the distance, so we assert the real bound.
    expect(maxHop).toBeLessThan(2.95 * P);
  });

  it('G3 · trick rates per band, curl share 40% from layer 11, at most c−1 tricks', () => {
    const r = rule();
    const band: Record<number, [number, number]> = { 0.25: [0, 0], 0.4: [0, 0], 0.5: [0, 0] };
    let curls = 0, tricksLate = 0;
    for (const rv of rivers)
      for (let k = 1; k <= N; k++) {
        const L = rv.layers[k]!;
        const t = L.filter((p) => p.kind !== 'lily');
        r.ok(t.length <= L.length - 1, () => `seed ${rv.seed} k${k} all tricks`);
        if (k < 6) r.ok(t.length === 0, () => `seed ${rv.seed} k${k} trick before 6`);
        if (k < 10) r.ok(!L.some((p) => p.kind === 'curl'), () => `seed ${rv.seed} k${k} curl before 10`);
        if (k <= 6 || k === 10 || k === N) continue; // scripted
        band[pTrick(k)]![0] += t.length;
        band[pTrick(k)]![1] += L.length;
        if (k > 10) {
          tricksLate += t.length;
          curls += t.filter((p) => p.kind === 'curl').length;
        }
      }
    expect(r.fails).toEqual({ count: 0, first: [] });
    // Each pad is a trick with pTrick(k), conditioned on "at most c−1 tricks" (rerolled). The expected
    // per-pad rate is therefore below pTrick: ≈0.23 / 0.34 / 0.40 for the three bands. Assert that model.
    const rate = (p: number) => band[p]![0] / band[p]![1];
    const model = (p: number): number => {
      const cond = (c: number) => {
        let num = 0, den = 0;
        for (let t = 0; t < c; t++) {
          const w = binom(c, t) * p ** t * (1 - p) ** (c - t);
          num += w * t;
          den += w;
        }
        return num / den / c;
      };
      return (0.65 * 3 * cond(3) + 0.35 * 2 * cond(2)) / (0.65 * 3 + 0.35 * 2);
    };
    for (const p of [0.25, 0.4, 0.5]) expect(Math.abs(rate(p) - model(p))).toBeLessThan(0.03);
    expect(Math.abs(curls / tricksLate - 0.4)).toBeLessThan(0.03);
  });

  it('G4 · every layer has a lily; from every pad, every next-layer pad answers exactly one chip', () => {
    const r = rule();
    for (const rv of rivers) {
      for (let k = 1; k <= N; k++) r.ok(lilies(rv.layers[k]!).length >= 1, () => `seed ${rv.seed} k${k} no lily`);
      for (let k = 0; k <= N; k++)
        for (const from of rv.layers[k]!) {
          const ch = choicesFrom(rv, from);
          const ids = ch.map((c) => c.padId).sort((a, b) => a - b).join();
          r.ok(ids === rv.layers[k + 1]!.map((p) => p.id).join(), () => `seed ${rv.seed} k${k} not complete`);
          for (const key of ['L', 'F', 'R'] as const)
            r.ok(ch.filter((c) => c.slot === key || c.alsoAnswers.includes(key)).length === 1, () => `seed ${rv.seed} k${k} key ${key}`);
          r.ok(new Set(ch.map((c) => c.slot)).size === ch.length, () => `seed ${rv.seed} k${k} duplicate chip`);
        }
    }
    expect(r.fails).toEqual({ count: 0, first: [] });
  });

  it('G5 · single-safe slot never three times running; each slot ≥ 25% of single-safe layers 6–36', () => {
    const r = rule();
    let sizes = 0;
    for (const rv of rivers) {
      const seq: string[] = [];
      for (let k = 6; k <= N; k++) {
        const L = rv.layers[k]!;
        const s = lilies(L);
        if (s.length === 1) seq.push(posSlot(s[0]!.index, L.length));
      }
      sizes += seq.length;
      for (let i = 2; i < seq.length; i++) r.ok(!(seq[i] === seq[i - 1] && seq[i] === seq[i - 2]), () => `seed ${rv.seed} run ${seq.join('')}`);
      for (const slot of ['L', 'F', 'R']) r.ok(seq.filter((s) => s === slot).length * 4 >= seq.length, () => `seed ${rv.seed} quota ${slot} ${seq.join('')}`);
    }
    expect(r.fails).toEqual({ count: 0, first: [] });
    expect(sizes / SEEDS).toBeGreaterThan(8); // the rule has teeth: many single-safe layers per river
  });

  it('G6 · scripted: 1–5 lily; 6 soggy forward between two lily; 10 one off-centre curl; 36 two safe', () => {
    const r = rule();
    for (const rv of rivers) {
      for (let k = 1; k <= 5; k++) r.ok(rv.layers[k]!.every((p) => p.kind === 'lily'), () => `seed ${rv.seed} k${k}`);
      r.ok(rv.layers[6]!.map((p) => p.kind).join() === 'lily,soggy,lily', () => `seed ${rv.seed} k6`);
      const ten = rv.layers[10]!;
      const curls = ten.filter((p) => p.kind === 'curl');
      r.ok(curls.length === 1 && (curls[0]!.index === 0 || curls[0]!.index === ten.length - 1), () => `seed ${rv.seed} k10 curl`);
      r.ok(lilies(ten).length === ten.length - 1, () => `seed ${rv.seed} k10 others`);
      r.ok(lilies(rv.layers[N]!).length >= 2, () => `seed ${rv.seed} k36`);
    }
    expect(r.fails).toEqual({ count: 0, first: [] });
  });

  it('G7 · decor: 0–2 per gap, clear of every pad, inside the river', () => {
    const r = rule();
    let total = 0;
    for (const rv of rivers) {
      total += rv.decor.length;
      r.ok(rv.decor.length <= 2 * (N + 1), () => `seed ${rv.seed} decor ${rv.decor.length}`);
      for (const d of rv.decor) {
        r.ok(['bud', 'petal', 'flower'].includes(d.kind), () => `kind ${d.kind}`);
        r.ok(d.x > 0 && d.x < TUNING.width && d.y >= 0 && d.y <= (N + 1) * P, () => `seed ${rv.seed} decor outside`);
        for (const p of rv.pads)
          if (p.kind !== 'bank') r.ok(Math.hypot(d.x - p.x, d.y - p.y) >= Math.max(DECOR_CLEAR, p.r + d.size), () => `seed ${rv.seed} decor on pad ${p.id}`);
      }
    }
    expect(r.fails).toEqual({ count: 0, first: [] });
    expect(total / SEEDS).toBeGreaterThan(20); // the pond is dressed, not bare
  });
});
