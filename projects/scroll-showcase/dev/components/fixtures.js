// Gallery fixtures: each shared component at three states taken from the
// scenes that use it (§4). A fixture is a pure function of the viewport that
// returns the layers to draw, bottom to top, so the gallery grid, the solo
// view and the dev e2e all draw exactly the same data.
//
// Imports name the real source path (so `tsc` checks them); the page's import
// map sends `/site/js/` to `/js/`, where the dev server serves `site/`.

import { bandRects, bandRectsFromWeights, beamW, centre, dotGrid, snap } from '../../site/js/core/geometry.js';

/**
 * @typedef {import('../../site/js/types.js').Viewport} Viewport
 * @typedef {import('../../site/js/types.js').BandRect} BandRect
 * @typedef {import('../../site/js/types.js').DotGridState} DotGridState
 * @typedef {import('../../site/js/types.js').WhitePointState} WhitePointState
 * @typedef {'ink25' | 'ink40' | 'wallDeep'} Ring
 * @typedef {{ kind: 'bands', rects: BandRect[], blend: 'normal' | 'screen', opacities?: number[] }} BandsLayer
 * @typedef {{ kind: 'dots', dg: DotGridState }} DotsLayer
 * @typedef {{ kind: 'point', wp: WhitePointState | null, ring: Ring, host: 'svg' | 'html' }} PointLayer
 * @typedef {BandsLayer | DotsLayer | PointLayer} Layer
 * @typedef {{
 *   id: string, component: 'Bands' | 'DotGrid' | 'WhitePoint', title: string, from: string,
 *   ground: string, layers(vp: Viewport): Layer[]
 * }} Fixture
 */

/**
 * Scene 2's width weights (§4): w_i = 1 + 11·A·exp(−((i − c)/0.6)²).
 * @param {number} c dominance cursor, 0 (vermilion) … 5 (cobalt)
 * @param {number} A accordion amplitude
 */
export function fieldWeights(c, A) {
  return Array.from({ length: 7 }, (_, i) => 1 + 11 * A * Math.exp(-(((i - c) / 0.6) ** 2)));
}

/**
 * Scene 5's beams (§4): band i is centred on c_i + τ·(U/2 − c_i) with width
 * lerp(U/7, beamW, n); edges snapped to device pixels.
 * @param {Viewport} vp
 * @param {number} n narrowing, 0 … 1
 * @param {number} tau convergence, 0 … 1
 * @returns {BandRect[]}
 */
export function beamRects(vp, n, tau) {
  const { U, V, dpr } = vp;
  const W = U / 7 + (beamW(vp) - U / 7) * n;
  return Array.from({ length: 7 }, (_, i) => {
    const ci = ((i + 0.5) / 7) * U;
    const mid = ci + tau * (U / 2 - ci);
    return { u0: snap(mid - W / 2, dpr), u1: snap(mid + W / 2, dpr), v0: 0, v1: V };
  });
}

/**
 * @param {Viewport} vp
 * @param {Partial<Pick<DotGridState, 'vertexWhite' | 'fillWhite' | 'vertexInk' | 'fillInk'>>} tones
 * @returns {DotGridState}
 */
export function dots(vp, tones) {
  return { ...dotGrid(vp), vertexWhite: 0, fillWhite: 0, vertexInk: 0, fillInk: 0, ...tones };
}

/** @type {Fixture[]} */
export const FIXTURES = [
  {
    id: 'bands-chorus',
    component: 'Bands',
    title: 'Chorus',
    from: 'Scene 1 p 1 · Scene 2 p 0 · Scene 4 p 1 · Scene 5 p 0',
    ground: 'ink',
    layers: (vp) => [{ kind: 'bands', rects: bandRects(vp), blend: 'normal' }],
  },
  {
    id: 'bands-field',
    component: 'Bands',
    title: 'Field, saffron meets jade',
    from: 'Scene 2 p 0.5 (c 2.54), unsheared',
    ground: 'ink',
    layers: (vp) => [{ kind: 'bands', rects: bandRectsFromWeights(fieldWeights(2.54, 1), vp), blend: 'normal' }],
  },
  {
    id: 'bands-agreement',
    component: 'Bands',
    title: 'Agreement, beams screening',
    from: 'Scene 5 p 0.5 (n 1, τ 0.55), screen over ink',
    ground: 'ink',
    layers: (vp) => [{ kind: 'bands', rects: beamRects(vp, 1, 0.55), blend: 'screen' }],
  },
  {
    id: 'dots-shadow',
    component: 'DotGrid',
    title: 'Lattice shadow',
    from: 'Scene 2 p 0.62: vertex ink 8% over the field',
    ground: 'ink',
    layers: (vp) => [
      { kind: 'bands', rects: bandRectsFromWeights(fieldWeights(3.2, 1), vp), blend: 'normal' },
      { kind: 'dots', dg: dots(vp, { vertexInk: 0.08 }) },
      { kind: 'point', wp: { ...centre(vp), r: 3, alpha: 1 }, ring: 'ink25', host: 'svg' },
    ],
  },
  {
    id: 'dots-dense',
    component: 'DotGrid',
    title: 'Densified, azure room',
    from: 'Scene 2 p 0.86: vertex and fill ink 8%',
    ground: 'ink',
    layers: (vp) => [
      { kind: 'bands', rects: bandRectsFromWeights(fieldWeights(4, 1), vp), blend: 'normal' },
      { kind: 'dots', dg: dots(vp, { vertexInk: 0.08, fillInk: 0.08 }) },
      { kind: 'point', wp: { ...centre(vp), r: 3, alpha: 1 }, ring: 'ink25', host: 'svg' },
    ],
  },
  {
    id: 'dots-cobalt',
    component: 'DotGrid',
    title: 'Cobalt grid',
    from: 'Scene 2 p 1 · Scene 3 ground: white 55%, centre dot',
    ground: 'band-6',
    layers: (vp) => [
      { kind: 'dots', dg: dots(vp, { vertexWhite: 0.55, fillWhite: 0.55 }) },
      { kind: 'point', wp: { ...centre(vp), r: 3, alpha: 1 }, ring: 'ink25', host: 'svg' },
    ],
  },
  {
    id: 'point-glint',
    component: 'WhitePoint',
    title: 'Entry glint',
    from: 'Scene 1: 3 px disc, 1 px wall-deep ring, on the wall',
    ground: 'wall',
    layers: (vp) => [{ kind: 'point', wp: { ...centre(vp), r: 1.5, alpha: 1 }, ring: 'wallDeep', host: 'svg' }],
  },
  {
    id: 'point-centre',
    component: 'WhitePoint',
    title: 'Centre dot',
    from: 'Scene 2: r 3, 1 px ink ring at 25%, on saffron',
    ground: 'band-3',
    layers: (vp) => [{ kind: 'point', wp: { ...centre(vp), r: 3, alpha: 1 }, ring: 'ink25', host: 'svg' }],
  },
  {
    id: 'point-rail',
    component: 'WhitePoint',
    title: 'Rail dot',
    from: 'Chrome: 6 px disc, 1 px ink ring at 40%, HTML host',
    ground: 'wall-deep',
    layers: (vp) => [{ kind: 'point', wp: { ...centre(vp), r: 3, alpha: 1 }, ring: 'ink40', host: 'html' }],
  },
];

/** Grounds a fixture or the solo `ground=` parameter may name: tokens only. */
export const GROUNDS = ['ink', 'wall', 'wall-deep', 'beam', 'band-3', 'band-6', 'sentinel', 'black'];

/**
 * CSS for a ground name. `sentinel` (pure magenta) and `black` are test
 * grounds: neither is a band colour, so any exposed ground pixel is caught.
 * @param {string} name
 */
export function groundCss(name) {
  if (name === 'sentinel') return '#FF00FF';
  if (name === 'black') return '#000000';
  return `var(--${name})`;
}
