/**
 * River generator (§4.1 G1–G8). OWNER: WO-002. Pure: (seed, tuning) → River.
 * One PRNG stream, consumed in layer order: per layer count → radii/positions → kinds → rot/phase, then the
 * decor of the gap below it. The G5 slot quota is a final pass that consumes no randomness (still deterministic).
 */
import type { Decor, DecorKind, Pad, PadKind, River, Tuning } from '../contracts';
import { TUNING } from '../tuning';
import { createRng, type Rng } from './rng';

/** Positional slot of pad index i in a layer of c pads (G5 rotation, §4.5 L/F/R). */
export type PosSlot = 'L' | 'F' | 'R';
export function posSlot(index: number, count: number): PosSlot {
  if (count === 3) return index === 0 ? 'L' : index === 1 ? 'F' : 'R';
  return index === 0 ? 'L' : 'R';
}

/** G3 trick probability per hop layer. */
export function pTrick(k: number): number {
  if (k < 6) return 0;
  if (k <= 15) return 0.25;
  if (k <= 27) return 0.4;
  return 0.5;
}

export const SLOTS_3 = [22, 50, 78] as const;
export const SLOTS_2 = [[35, 65], [22, 60], [40, 78]] as const;
export const JITTER_X = 6;
export const JITTER_Y = 4;
export const R_MIN = 8.5;
export const R_MAX = 11;
export const MIN_IN_LAYER = 24;
/** Pads of neighbouring layers never touch: rim-to-rim gap ≥ this (wu). */
export const MIN_RIM_GAP = 2;
/** Decor keeps this far from every pad centre, and clear of the rim (G7). */
export const DECOR_CLEAR = 14;

interface Draft {
  layer: number;
  index: number;
  x: number;
  y: number;
  r: number;
  kind: PadKind;
  rot: number;
  phase: number;
}

const TAU = Math.PI * 2;

export function generateRiver(seed: number, tuning: Tuning = TUNING): River {
  const rng = createRng(seed);
  const P = tuning.pitch;
  const N = tuning.layers;
  const W = tuning.width;
  const drafts: Draft[][] = [];
  const decor: Decor[] = [];

  drafts.push([{ layer: 0, index: 0, x: W / 2, y: 0, r: 0, kind: 'bank', rot: 0, phase: rng.range(0, TAU) }]);
  /** Single-safe slot history for the G5 run rule, in layer order. */
  const singles: PosSlot[] = [];

  for (let k = 1; k <= N; k++) {
    // G1 · count (scripted layer 6 needs three pads: one soggy forward, both sides safe).
    const c = k <= 5 || k === 6 ? 3 : rng.chance(0.65) ? 3 : 2;
    // G2 · positions.
    const base: readonly number[] = c === 3 ? SLOTS_3 : SLOTS_2[rng.int(3)]!;
    const prev = drafts[k - 1]!;
    const layer = placeLayer(rng, k, base, P, prev);
    // G3/G5/G6 · kinds.
    assignKinds(rng, k, N, layer, singles);
    for (const d of layer) {
      d.rot = rng.range(0, TAU);
      d.phase = rng.range(0, TAU);
    }
    drafts.push(layer);
    placeDecor(rng, prev, layer, decor, W);
  }
  const north = N + 1;
  const bankN: Draft = { layer: north, index: 0, x: W / 2, y: north * P, r: 0, kind: 'bank', rot: 0, phase: rng.range(0, TAU) };
  drafts.push([bankN]);
  placeDecor(rng, drafts[N]!, [bankN], decor, W);

  enforceQuota(drafts, N);

  const pads: Pad[] = [];
  const layers: Pad[][] = drafts.map((ds) =>
    ds.map((d) => {
      const p: Pad = Object.freeze({ id: pads.length, layer: d.layer, index: d.index, x: d.x, y: d.y, r: d.r, kind: d.kind, rot: d.rot, phase: d.phase });
      pads.push(p);
      return p;
    }),
  );
  return { seed, layers, pads, decor };
}

function placeLayer(rng: Rng, k: number, base: readonly number[], P: number, prev: readonly Draft[]): Draft[] {
  const radii = base.map(() => rng.range(R_MIN, R_MAX));
  const ok = (xs: number[], ys: number[], rs: number[]): boolean => {
    for (let i = 0; i < xs.length; i++) {
      for (let j = i + 1; j < xs.length; j++) if (Math.hypot(xs[i]! - xs[j]!, ys[i]! - ys[j]!) < MIN_IN_LAYER) return false;
      for (const q of prev) {
        if (q.kind === 'bank') continue;
        if (Math.hypot(xs[i]! - q.x, ys[i]! - q.y) < rs[i]! + q.r + MIN_RIM_GAP) return false;
      }
    }
    return true;
  };
  for (let attempt = 0; attempt < 24; attempt++) {
    const xs = base.map((x) => x + rng.range(-JITTER_X, JITTER_X));
    const ys = base.map(() => k * P + rng.range(-JITTER_Y, JITTER_Y));
    if (ok(xs, ys, radii)) return base.map((_, i) => draft(k, i, xs[i]!, ys[i]!, radii[i]!));
  }
  // Deterministic fallback: no jitter and minimum radius always fits (rim gap ≥ 26 − 4 − 17 > 2).
  return base.map((x, i) => draft(k, i, x, k * P, R_MIN));
}

function draft(layer: number, index: number, x: number, y: number, r: number): Draft {
  return { layer, index, x, y, r, kind: 'lily', rot: 0, phase: 0 };
}

function trickKind(rng: Rng, k: number): PadKind {
  return k >= 10 && rng.chance(0.4) ? 'curl' : 'soggy';
}

function safeSlots(layer: readonly Draft[]): PosSlot[] {
  const out: PosSlot[] = [];
  layer.forEach((d, i) => d.kind === 'lily' && out.push(posSlot(i, layer.length)));
  return out;
}

/** G5 run rule: a single-safe slot may not appear a third time in a row (in the sequence of single-safe layers). */
function breaksRun(singles: readonly PosSlot[], s: PosSlot): boolean {
  const n = singles.length;
  return n >= 2 && singles[n - 1] === s && singles[n - 2] === s;
}

function assignKinds(rng: Rng, k: number, N: number, layer: Draft[], singles: PosSlot[]): void {
  const c = layer.length;
  if (k <= 5) return; // G6: onboarding layers are all lily.
  if (k === 6) {
    layer[1]!.kind = 'soggy'; // G6: the soggy sits forward, both sides honest.
    return;
  }
  if (k === 10) {
    // G6: the first curl, off-centre, alone (one novelty at a time).
    let i = rng.chance(0.5) ? 0 : c - 1;
    if (c === 2 && breaksRun(singles, posSlot(1 - i, 2))) i = 1 - i; // G5 holds here too
    layer[i]!.kind = 'curl';
    if (c === 2) singles.push(posSlot(1 - i, 2));
    return;
  }
  const maxTricks = k === N ? c - 2 : c - 1; // G6: the last layer keeps two safe pads.
  const roll = (): void => {
    for (let a = 0; a < 8; a++) {
      let tricks = 0;
      for (const d of layer) {
        d.kind = rng.chance(pTrick(k)) ? trickKind(rng, k) : 'lily';
        if (d.kind !== 'lily') tricks++;
      }
      if (tricks <= maxTricks) return;
    }
    // Forced: keep the first maxTricks tricks from the west, the rest become lily.
    let kept = 0;
    for (const d of layer) if (d.kind !== 'lily' && ++kept > maxTricks) d.kind = 'lily';
  };
  roll();
  let safe = safeSlots(layer);
  for (let a = 0; a < 8 && safe.length === 1 && breaksRun(singles, safe[0]!); a++) {
    roll();
    safe = safeSlots(layer);
  }
  if (safe.length === 1 && breaksRun(singles, safe[0]!)) {
    // Forced swap: move the lily to another slot (picked from the stream).
    const from = layer.findIndex((d) => d.kind === 'lily');
    const others = layer.map((_, i) => i).filter((i) => i !== from);
    const to = others[rng.int(others.length)]!;
    layer[from]!.kind = layer[to]!.kind;
    layer[to]!.kind = 'lily';
    safe = safeSlots(layer);
  }
  if (safe.length === 1) singles.push(safe[0]!);
}

/** G5 quota: across layers 6..N each slot holds ≥ 25% of the single-safe layers. Uses no randomness. */
function enforceQuota(drafts: Draft[][], N: number): void {
  const scripted = (k: number) => k === 6 || k === 10 || k === N;
  for (let iter = 0; iter < 64; iter++) {
    const seq: { k: number; s: PosSlot }[] = [];
    for (let k = 6; k <= N; k++) {
      const safe = safeSlots(drafts[k]!);
      if (safe.length === 1) seq.push({ k, s: safe[0]! });
    }
    const count = { L: 0, F: 0, R: 0 } as Record<PosSlot, number>;
    for (const e of seq) count[e.s]++;
    const n = seq.length;
    const need = (['L', 'F', 'R'] as const).filter((s) => count[s] * 4 < n).sort((a, b) => count[a] - count[b]);
    if (need.length === 0) return;
    const want = need[0]!;
    const runOk = (k: number, s: PosSlot): boolean => {
      const slots = seq.map((e) => (e.k === k ? s : e.s));
      if (!seq.some((e) => e.k === k)) {
        const at = seq.findIndex((e) => e.k > k);
        slots.splice(at < 0 ? slots.length : at, 0, s);
      }
      for (let i = 2; i < slots.length; i++) if (slots[i] === slots[i - 1] && slots[i] === slots[i - 2]) return false;
      return true;
    };
    const order = seq.filter((e) => !scripted(e.k)).sort((a, b) => count[b.s] - count[a.s] || a.k - b.k);
    // A · swap: a single-safe layer of an over-full slot moves its lily to `want`.
    const swap = (): boolean => {
      for (const e of order) {
        if (e.s === want || count[e.s] * 4 <= n) continue;
        const layer = drafts[e.k]!;
        const to = layer.findIndex((_, i) => posSlot(i, layer.length) === want);
        if (to < 0 || !runOk(e.k, want)) continue;
        const from = layer.findIndex((d) => d.kind === 'lily');
        layer[from]!.kind = layer[to]!.kind;
        layer[to]!.kind = 'lily';
        return true;
      }
      return false;
    };
    // B · add: a 3-pad layer whose `want` pad is lily keeps only that lily (n + 1).
    const add = (): boolean => {
      for (let k = 7; k < N; k++) {
        const layer = drafts[k]!;
        if (scripted(k) || layer.length !== 3 || safeSlots(layer).length < 2) continue;
        const keep = layer.findIndex((_, i) => posSlot(i, 3) === want);
        if (layer[keep]!.kind !== 'lily' || !runOk(k, want)) continue;
        layer.forEach((d, i) => {
          if (i !== keep && d.kind === 'lily') d.kind = k >= 10 && (k + i) % 2 === 0 ? 'curl' : 'soggy';
        });
        return true;
      }
      return false;
    };
    // C · relieve: a single-safe layer of the most common slot gets a second lily (n − 1).
    const relieve = (): boolean => {
      for (const e of order) {
        const rest = seq.filter((q) => q !== e).map((q) => q.s);
        if (rest.some((s, i) => i >= 2 && s === rest[i - 1] && s === rest[i - 2])) continue;
        const layer = drafts[e.k]!;
        layer.find((d) => d.kind !== 'lily')!.kind = 'lily';
        return true;
      }
      return false;
    };
    // With n ∈ {1, 2, 5} no split gives every slot 25% (3·⌈n/4⌉ > n), so n must change first.
    const feasible = 3 * Math.ceil(n / 4) <= n;
    const fixed = feasible ? swap() || add() || relieve() : n <= 2 ? add() || relieve() : relieve() || add();
    if (!fixed) return;
  }
}

const DECOR_KINDS: readonly DecorKind[] = ['bud', 'petal', 'flower'];
const DECOR_SIZE: Record<DecorKind, [number, number]> = { bud: [2.6, 4], petal: [1.4, 2.4], flower: [2.8, 3.8] };

/** G7: 0–2 decor items in the gap between two layers, clear of every pad there. */
function placeDecor(rng: Rng, below: readonly Draft[], above: readonly Draft[], out: Decor[], W: number): void {
  const n = rng.int(3);
  const yLo = below.reduce((m, d) => Math.max(m, d.y), -Infinity);
  const yHi = above.reduce((m, d) => Math.min(m, d.y), Infinity);
  const near = [...below, ...above].filter((d) => d.kind !== 'bank');
  for (let i = 0; i < n; i++) {
    const kind = DECOR_KINDS[rng.int(3)]!;
    const [s0, s1] = DECOR_SIZE[kind];
    const size = rng.range(s0, s1);
    for (let a = 0; a < 12; a++) {
      const x = rng.range(4, W - 4);
      const y = rng.range(yLo, yHi);
      const clear = near.every((d) => Math.hypot(x - d.x, y - d.y) >= Math.max(DECOR_CLEAR, d.r + size + 2));
      if (clear) {
        out.push({ kind, x, y, rot: rng.range(0, TAU), size, phase: rng.range(0, TAU) });
        break;
      }
    }
  }
}
