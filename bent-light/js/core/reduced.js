// The reduced-motion still plan (experience spec §10.4, contract C1 `StillPlan`).
// Under `prefers-reduced-motion: reduce` each scene shows three authored stills,
// state(0), state(0.5) and state(1), held over [0, .17], [.33, .67] and [.83, 1],
// with opacity-only crossfades over (.17, .33) and (.67, .83). The engine draws
// `base` at opacity 1 and `over` on top at `overAlpha` (K7). Pure: no DOM, no clock.

/** @typedef {import('../types.js').StillPlan} StillPlan */

/** Fade windows, as [start, end] in p. */
const FADE_1 = /** @type {const} */ ([0.17, 0.33]);
const FADE_2 = /** @type {const} */ ([0.67, 0.83]);

/**
 * Linear ramp of p across [a, b], clamped to [0, 1] (the same function as math.r).
 * @param {number} p @param {number} a @param {number} b
 */
function ramp(p, a, b) {
  const t = (p - a) / (b - a);
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
}

/**
 * @param {number} p scene progress; clamped to [0, 1]
 * @returns {StillPlan}
 */
export function stillPlan(p) {
  if (!Number.isFinite(p)) throw new RangeError(`p must be finite, got ${p}`);
  const q = p < 0 ? 0 : p > 1 ? 1 : p;

  if (q <= FADE_1[0]) return { base: 0, over: null, overAlpha: 0, pShown: 0 };
  if (q < FADE_1[1]) {
    const overAlpha = ramp(q, FADE_1[0], FADE_1[1]);
    return { base: 0, over: 0.5, overAlpha, pShown: overAlpha > 0.5 ? 0.5 : 0 };
  }
  if (q <= FADE_2[0]) return { base: 0.5, over: null, overAlpha: 0, pShown: 0.5 };
  if (q < FADE_2[1]) {
    const overAlpha = ramp(q, FADE_2[0], FADE_2[1]);
    return { base: 0.5, over: 1, overAlpha, pShown: overAlpha > 0.5 ? 1 : 0.5 };
  }
  return { base: 1, over: null, overAlpha: 0, pShown: 1 };
}
