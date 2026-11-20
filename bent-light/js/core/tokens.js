// Colour tokens (§13.1) mirrored for JS: hex, sRGB triple and WCAG relative luminance Y.
// `site/css/tokens.css` is the stylesheet source; tests/unit/dev/content/tokens.test.js
// fails if a hex here differs from the CSS. Pure module: no DOM, no clock.

/** @typedef {[number, number, number]} RGB */
/** @typedef {{ hex: string; rgb: RGB; Y: number }} ColourToken */

/**
 * '#RRGGBB' → [r, g, b] in 0–255.
 * @param {string} hex
 * @returns {RGB}
 */
export function hexToRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new TypeError(`not a #RRGGBB colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** @param {number} c 0–255 sRGB channel → linear light */
function linear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * WCAG 2 relative luminance of an sRGB triple.
 * @param {RGB} rgb
 * @returns {number}
 */
export function luminance(rgb) {
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
}

/**
 * WCAG 2 contrast ratio between two relative luminances (order-free).
 * @param {number} y1
 * @param {number} y2
 * @returns {number}
 */
export function contrast(y1, y2) {
  const hi = Math.max(y1, y2);
  const lo = Math.min(y1, y2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Source-over composite of `fg` at `alpha` onto an opaque `bg`, in gamma-encoded
 * sRGB as browsers blend, rounded to 8-bit channels.
 * @param {RGB} fg
 * @param {number} alpha
 * @param {RGB} bg
 * @returns {RGB}
 */
export function composite(fg, alpha, bg) {
  return /** @type {RGB} */ (fg.map((c, i) => Math.round(alpha * c + (1 - alpha) * bg[i])));
}

/** @param {string} hex @returns {ColourToken} */
function token(hex) {
  const rgb = hexToRgb(hex);
  return Object.freeze({ hex, rgb: /** @type {RGB} */ (Object.freeze(rgb)), Y: luminance(rgb) });
}

/**
 * Every opaque colour token, keyed by its CSS name without `--` (light scheme).
 * @type {Readonly<Record<string, ColourToken>>}
 */
export const TOKENS = Object.freeze({
  'wall': token('#F6F3ED'),
  'wall-deep': token('#E2DDD5'),
  'ink': token('#0C0F1A'),
  'beam': token('#FFFFFF'),
  'band-1': token('#F54123'),
  'band-2': token('#F68704'),
  'band-3': token('#F2C50E'),
  'band-4': token('#0BCA86'),
  'band-5': token('#04A7D8'),
  'band-6': token('#2154D8'),
  'band-7': token('#8843DB'),
  'ch-r': token('#FF3B3B'),
  'ch-g': token('#3BFF7A'),
  'ch-b': token('#3B6BFF'),
  'plate-c': token('#00B8F0'),
  'plate-m': token('#E6007E'),
  'plate-y': token('#FFE600'),
  'fringe-c': token('#38D6FF'),
  'fringe-m': token('#FF4FB3'),
  'focus-inner': token('#FFFFFF'),
});

/**
 * The only tokens that change under `prefers-color-scheme: dark` (D9).
 * @type {Readonly<Record<'wall' | 'wall-deep', ColourToken>>}
 */
export const TOKENS_DARK = Object.freeze({
  'wall': token('#F0EDE7'),
  'wall-deep': token('#DDD8D0'),
});

/**
 * Translucent tokens: a colour (its own rgb, or another token's by `ref`) at `alpha`.
 * `chip-light` follows `--wall`, so it adapts to the dark scheme with it.
 * @type {Readonly<Record<string, { rgb: RGB | null; ref: string | null; alpha: number }>>}
 */
export const TRANSLUCENT = Object.freeze({
  'chip-dark': Object.freeze({ rgb: /** @type {RGB} */ ([12, 15, 26]), ref: null, alpha: 0.78 }),
  'chip-light': Object.freeze({ rgb: null, ref: 'wall', alpha: 0.92 }),
  'glass-hi': Object.freeze({ rgb: /** @type {RGB} */ ([255, 255, 255]), ref: null, alpha: 0.22 }),
  'glass-lo': Object.freeze({ rgb: /** @type {RGB} */ ([255, 255, 255]), ref: null, alpha: 0.05 }),
  'glass-edge': Object.freeze({ rgb: /** @type {RGB} */ ([255, 255, 255]), ref: null, alpha: 0.85 }),
});

/** The seven band hexes in spectrum order (vermilion → violet). */
export const BANDS = Object.freeze([1, 2, 3, 4, 5, 6, 7].map((i) => TOKENS[`band-${i}`].hex));
