// helpers/seeded.js: seeded randomness for test positions (no Math.random in tests either, so a
// failing position is the same position on every run).
//
// mulberry32 is restated here from its published definition rather than imported from
// site/js/core/math.js, so the test positions do not depend on the code under test.

/** @param {number} seed @returns {() => number} uniform in [0, 1) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The suite's own seed (distinct from the piece's 0xB3E7). */
export const TEST_SEED = 0x5eed13;

/**
 * n integer positions per scene, uniformly inside [Y_s + inset·L_s, Y_s + (1 − inset)·L_s].
 * @param {{ Y: number[]; L: number[] }} layout @param {number} perScene @param {number} [seed] @param {number} [inset]
 * @returns {{ y: number; scene: number }[]}
 */
export function positionsPerScene(layout, perScene, seed = TEST_SEED, inset = 0.03) {
  const rnd = mulberry32(seed);
  /** @type {{ y: number; scene: number }[]} */
  const out = [];
  for (let s = 0; s < 6; s++) {
    for (let k = 0; k < perScene; k++) {
      const p = inset + rnd() * (1 - 2 * inset);
      out.push({ y: Math.round(layout.Y[s] + p * layout.L[s]), scene: s + 1 });
    }
  }
  return out;
}

/**
 * Shuffle (Fisher–Yates) with a seeded generator; returns a new array.
 * @template T @param {T[]} xs @param {() => number} rnd @returns {T[]}
 */
export function shuffled(xs, rnd) {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
