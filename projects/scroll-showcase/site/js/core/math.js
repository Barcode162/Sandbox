// core/math.js — the pure maths every scene and the engine share (architecture §C2).
//
// Everything here is a pure function of its arguments: no clock, no DOM, no
// Math.random. Position curves are maps of [0, 1] onto [0, 1] with f(0) = 0
// and f(1) = 1 exactly (spec §3.5). They clamp their input, so a caller can
// never extrapolate a curve past its endpoints by accident.

/**
 * Clamp x into [a, b].
 * @param {number} x
 * @param {number} a lower bound
 * @param {number} b upper bound (b >= a)
 * @returns {number}
 */
export function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}

/**
 * Linear interpolation. Written as (1 − t)·a + t·b so that t = 0 returns a
 * and t = 1 returns b exactly; seams and endpoint tables depend on that.
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

/**
 * Remap: r(p, a, b) = clamp((p − a) / (b − a), 0, 1) (spec §3.5).
 * A degenerate window (a === b) is a step at a: 0 before it, 1 from it on.
 * @param {number} p
 * @param {number} a window start
 * @param {number} b window end (b >= a)
 * @returns {number}
 */
export function r(p, a, b) {
  if (b === a) return p < a ? 0 : 1;
  return clamp((p - a) / (b - a), 0, 1);
}

/** @param {number} t @returns {number} t clamped to [0, 1] */
function unit(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * smooth = smoothstep, 3t² − 2t³.
 * @param {number} t
 * @returns {number}
 */
export function smooth(t) {
  const x = unit(t);
  return x * x * (3 - 2 * x);
}

/**
 * glide = easeInOutCubic (peak slope 3× average).
 * @param {number} t
 * @returns {number}
 */
export function glide(t) {
  const x = unit(t);
  if (x < 0.5) return 4 * x * x * x;
  const q = 2 - 2 * x;
  return 1 - (q * q * q) / 2;
}

/**
 * easeOutCubic, 1 − (1 − t)³.
 * @param {number} t
 * @returns {number}
 */
export function easeOutCubic(t) {
  const q = 1 - unit(t);
  return 1 - q * q * q;
}

/**
 * settle = easeOutCubic (spec §3.5).
 * @param {number} t
 * @returns {number}
 */
export function settle(t) {
  return easeOutCubic(t);
}

/**
 * lead = easeOutQuad, 1 − (1 − t)²: the early-responsive curve for the hook.
 * @param {number} t
 * @returns {number}
 */
export function lead(t) {
  const q = 1 - unit(t);
  return 1 - q * q;
}

/**
 * lin = identity on [0, 1].
 * @param {number} t
 * @returns {number}
 */
export function lin(t) {
  return unit(t);
}

/**
 * easeInOutSine, (1 − cos πt) / 2. Used by the ambient breathing.
 * @param {number} t
 * @returns {number}
 */
export function easeInOutSine(t) {
  const x = unit(t);
  if (x === 0 || x === 1) return x;
  return (1 - Math.cos(Math.PI * x)) / 2;
}

/**
 * Keyframe interpolation (spec §3.5, U-2).
 *
 * `list` is `[[p0, v0], [p1, v1, ease?], …]` with non-decreasing p. The ease on
 * a key applies to the segment that ends at that key; the default is `glide`.
 * Before p0 the first value holds; from the final key on, the last value holds.
 * At a key's own position the key's value is returned exactly. Two keys at the
 * same p make a step: the later key wins from that p on.
 *
 * @param {number} p
 * @param {ReadonlyArray<readonly [number, number] | readonly [number, number, (t: number) => number]>} list
 * @returns {number}
 */
export function keys(p, list) {
  const n = list.length;
  if (n === 0) throw new RangeError('keys(): at least one key is required');
  for (let i = 1; i < n; i++) {
    if (!(list[i][0] >= list[i - 1][0])) {
      throw new RangeError(`keys(): key ${i} at p ${list[i][0]} precedes key ${i - 1} at p ${list[i - 1][0]}`);
    }
  }
  if (p < list[0][0]) return list[0][1];
  const last = list[n - 1];
  if (p >= last[0]) return last[1];
  // p0 <= p < p_last: find the segment [k_i, k_{i+1}) holding p.
  let i = 0;
  while (p >= list[i + 1][0]) i++;
  const from = list[i];
  const to = list[i + 1];
  const t = (p - from[0]) / (to[0] - from[0]);
  if (t === 0) return from[1];
  const ease = to[2] ?? glide;
  return lerp(from[1], to[1], ease(t));
}

/** The one seed for every random draw in the piece (K6, spec §3.2). */
export const SEED = 0xb3e7;

/**
 * mulberry32: a small, fast 32-bit PRNG. Each call returns a number in [0, 1).
 * Identical seeds give identical sequences on every engine (U-8).
 * @param {number} seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Finite-number gate for state output (C1: JSON-clean, finite, no −0).
 * Returns x with −0 normalised to 0; throws on NaN, ±Infinity and non-numbers
 * so a broken state surfaces as an error the engine records, never as a
 * silently wrong frame.
 * @param {number} x
 * @returns {number}
 */
export function fin(x) {
  if (typeof x !== 'number' || !Number.isFinite(x)) {
    throw new TypeError(`fin(): expected a finite number, got ${String(x)}`);
  }
  return x === 0 ? 0 : x;
}
