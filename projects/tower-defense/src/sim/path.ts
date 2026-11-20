// Path geometry over the §5 polyline. Implemented in WO-001 (pure, allocation-free); owned by WO-002 afterwards.
import { PATH_POINTS } from '../data/map';

const N = PATH_POINTS.length;
const XS = new Float64Array(N);
const YS = new Float64Array(N);
/** CUM[i] = path distance at vertex i. */
const CUM = new Float64Array(N);
for (let i = 0; i < N; i++) {
  XS[i] = PATH_POINTS[i].x;
  YS[i] = PATH_POINTS[i].y;
  if (i > 0) CUM[i] = CUM[i - 1] + Math.hypot(XS[i] - XS[i - 1], YS[i] - YS[i - 1]);
}
/** Exact polyline length (≈ 2570.54). Reaching it = leak. */
export const PATH_TOTAL = CUM[N - 1];

export interface MutVec { x: number; y: number }

function segmentAt(s: number): number {
  if (s <= 0) return 0;
  if (s >= PATH_TOTAL) return N - 2;
  let lo = 0, hi = N - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUM[mid] <= s) lo = mid; else hi = mid;
  }
  return lo;
}

/** Writes the centreline point at distance s (clamped to [0, PATH_TOTAL]) into out. */
export function pointAt(s: number, out: MutVec): MutVec {
  const i = segmentAt(s);
  const len = CUM[i + 1] - CUM[i];
  const t = len > 0 ? Math.min(1, Math.max(0, (s - CUM[i]) / len)) : 0;
  out.x = XS[i] + (XS[i + 1] - XS[i]) * t;
  out.y = YS[i] + (YS[i + 1] - YS[i]) * t;
  return out;
}

/** Writes the unit travel direction at distance s into out. */
export function tangentAt(s: number, out: MutVec): MutVec {
  const i = segmentAt(s);
  const dx = XS[i + 1] - XS[i], dy = YS[i + 1] - YS[i];
  const len = Math.hypot(dx, dy) || 1;
  out.x = dx / len;
  out.y = dy / len;
  return out;
}

/** Euclidean distance from (x,y) to the nearest point of the centreline. */
export function distanceToPath(x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < N - 1; i++) {
    const ax = XS[i], ay = YS[i], dx = XS[i + 1] - ax, dy = YS[i + 1] - ay;
    const l2 = dx * dx + dy * dy;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
    const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
    if (d < best) best = d;
  }
  return best;
}

/** Path length covered by a circle — used by tests and the best-spot check (§5). Sampled at 1 px. */
export function pathCoverage(x: number, y: number, r: number): number {
  const p = { x: 0, y: 0 };
  let n = 0;
  for (let s = 0; s < PATH_TOTAL; s += 1) {
    pointAt(s, p);
    if ((p.x - x) ** 2 + (p.y - y) ** 2 <= r * r) n++;
  }
  return n;
}
