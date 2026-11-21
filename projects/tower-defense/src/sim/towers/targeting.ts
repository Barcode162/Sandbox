// §7 Targeting (WO-003): First / Last / Strong / Close with stable tie-breaks (ties → First → lower id).
// Allocation-free: module scratch buffers, reused by every sim (the sim is single-threaded, never re-entrant).
import type { SimContext } from '../../contracts/sim-context';
import type { Blot, TargetMode, Tower } from '../../contracts/types';
import { BLOTS } from '../../data/blots';

export const QUERY_CAP = 2048;
/** Raw query output (pool indices). */
export const QBUF = new Int32Array(QUERY_CAP);
/** Selected / sorted pool indices. */
export const SBUF = new Int32Array(QUERY_CAP);
/** Sort keys parallel to SBUF. */
export const KBUF = new Float64Array(QUERY_CAP);

/** Remaining red-blot-equivalent: current hp plus the children's RBE (§7 Strong). */
export function remainingRbe(b: Readonly<Blot>): number {
  const d = BLOTS[b.kind];
  return d.rbe - d.hp + b.hp;
}

/** True if a is further along the path than b (First order; ties → lower id). */
export function firstBefore(a: Readonly<Blot>, b: Readonly<Blot>): boolean {
  return a.s > b.s || (a.s === b.s && a.id < b.id);
}

/** Is a a better target than b for this mode, seen from (tx, ty)? */
export function betterTarget(mode: TargetMode, a: Readonly<Blot>, b: Readonly<Blot>, tx: number, ty: number): boolean {
  switch (mode) {
    case 'first':
      return firstBefore(a, b);
    case 'last':
      return a.s < b.s || (a.s === b.s && a.id < b.id);
    case 'strong': {
      const ra = remainingRbe(a), rb = remainingRbe(b);
      return ra > rb || (ra === rb && firstBefore(a, b));
    }
    case 'close': {
      const da = (a.x - tx) * (a.x - tx) + (a.y - ty) * (a.y - ty);
      const db = (b.x - tx) * (b.x - tx) + (b.y - ty) * (b.y - ty);
      return da < db || (da === db && firstBefore(a, b));
    }
  }
}

/** In range iff centre distance − R ≤ range (§7). */
export function inRange(b: Readonly<Blot>, x: number, y: number, range: number): boolean {
  const reach = range + BLOTS[b.kind].radius;
  const dx = b.x - x, dy = b.y - y;
  return dx * dx + dy * dy <= reach * reach;
}

/** Best visible target for an aimed tower, or null. */
export function selectTarget(ctx: SimContext, tower: Tower, range: number, mode: TargetMode): Blot | null {
  const n = ctx.queryBlots(tower.x, tower.y, range, QBUF);
  let best: Blot | null = null;
  for (let i = 0; i < n; i++) {
    const b = ctx.blotAt(QBUF[i]);
    if (!b.alive || !inRange(b, tower.x, tower.y, range) || !ctx.canSee(tower, b)) continue;
    if (best === null || betterTarget(mode, b, best, tower.x, tower.y)) best = b;
  }
  return best;
}

/**
 * Up to `max` live blots from QBUF[0..n) in First order, written to SBUF; returns the count.
 * `keep` decides membership (range, visibility). Partial insertion sort: O(n·max), no allocation.
 */
export function topFirst(ctx: SimContext, n: number, max: number, keep: (b: Blot) => boolean): number {
  if (max <= 0) return 0;
  let m = 0;
  for (let i = 0; i < n; i++) {
    const idx = QBUF[i];
    const b = ctx.blotAt(idx);
    if (!b.alive || !keep(b)) continue;
    let j = m < max ? m++ : max;
    if (j === max) {
      // full: only insert if it beats the current last
      if (!firstBefore(b, ctx.blotAt(SBUF[max - 1]))) continue;
      j = max - 1;
    }
    while (j > 0 && firstBefore(b, ctx.blotAt(SBUF[j - 1]))) { SBUF[j] = SBUF[j - 1]; j--; }
    SBUF[j] = idx;
  }
  return m;
}
