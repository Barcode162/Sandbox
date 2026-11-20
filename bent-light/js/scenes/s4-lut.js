// scenes/s4-lut.js: the Scene 4 colour lookup table (spec §4 Scene 4, with the CEO ruling in the
// mission log: the frame table is authoritative, so the hue range is wide enough to reach gold and
// vermilion when the light swings right). Pure.
//
// The LUT maps a facet's n·L (light along its tilt, [-0.6, 0.6]) to an sRGB colour in OKLCH:
// lightness rises with n·L, and hue = base(θ) + 200°·(n·L), so ±120° about the base. base(θ) moves the whole surface from
// cool teal-blue (light low on the left) through magenta-violet (overhead) to gold-vermilion
// (light on the right).

const DEG = Math.PI / 180;
export const LUT_SIZE = 256;
export const NL_MAX = 0.6;

/** @param {number} x linear channel */
const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

/**
 * OKLCH → 8-bit sRGB (clipped).
 * @param {number} L @param {number} C @param {number} hDeg
 * @returns {[number, number, number]}
 */
export function oklchToRgb(L, C, hDeg) {
  const a = C * Math.cos(hDeg * DEG);
  const b = C * Math.sin(hDeg * DEG);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return /** @type {[number, number, number]} */ (rgb.map((c) => Math.round(255 * Math.min(1, Math.max(0, gamma(c))))));
}

/** Hue at n·L = 0 for light direction θ (degrees). Piecewise linear through three anchors. */
export function baseHue(thetaDeg) {
  const k = [
    [200, 215],
    [270, 300],
    [340, 405],
  ];
  if (thetaDeg <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (thetaDeg <= k[i][0]) {
      const t = (thetaDeg - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return k[i - 1][1] + t * (k[i][1] - k[i - 1][1]);
    }
  }
  return k[k.length - 1][1];
}

/**
 * A 256-entry LUT for light direction θ.
 * @param {number} thetaDeg
 * @returns {[number, number, number][]}
 */
export function buildLut(thetaDeg) {
  const base = baseHue(thetaDeg);
  const out = [];
  for (let i = 0; i < LUT_SIZE; i++) {
    const nl = -NL_MAX + (2 * NL_MAX * i) / (LUT_SIZE - 1);
    const L = Math.min(0.82, Math.max(0.32, 0.5 + 0.47 * nl));
    out.push(oklchToRgb(L, 0.17, base + 200 * nl));
  }
  return out;
}

/** @param {number} nl */
export const lutIndex = (nl) => Math.round(((Math.min(NL_MAX, Math.max(-NL_MAX, nl)) + NL_MAX) / (2 * NL_MAX)) * (LUT_SIZE - 1));
