// scenes/s2-field.js: Scene 2 *Field* (spec §4 Scene 2, 300 svh; the long rest).
//
// Seven full-bleed bands become a width accordion. A dominance cursor c(p)
// walks the spectrum from vermilion (0) to cobalt (5) in five steps, each a
// short plateau that creeps (+0.06) and then a long smooth change, so every
// plateau frame is a still life of one colour. The whole band group shears
// (skewX, up to −18°) and is overscanned to 140%, so a sheared edge never
// shows ground. Over the long middle a tone-on-tone dot lattice appears (ink
// vertex dots first, then the fill dots), and at the end the other bands fade
// out, leaving cobalt with a white dot grid and the white centre dot: exactly
// Scene 3's ground (§5.2, the 2 → 3 seam).
//
// Photosensitivity (§10.1 rules 2–4): the walk is monotonic in hue, so frame
// luminance makes one hill (0.32 → 0.27 → 0.48 → 0.12); each field change
// moves over 32.8 svh after a 17.6 svh plateau; vermilion peaks at 63% of U.
//
// Rendering: `Bands` (snapped edges, transforms only) inside a shear wrapper,
// then one SVG with the `DotGrid` and the `WhitePoint` above it, unsheared.
// `apply` writes only transforms, opacities and SVG attributes, all through
// the per-node write cache, so a still frame writes nothing.

import { clamp, fin, r, smooth } from '../core/math.js';
import { SCENES, bandRectsFromWeights, centre, dotGrid } from '../core/geometry.js';
import { el, setAttrs, setStyles } from '../components/svg.js';
import { createBands } from '../components/bands-dom.js';
import { createDotGrid } from '../components/dotgrid-svg.js';
import { createWhitePoint } from '../components/white-point.js';

/** @typedef {import('../types.js').SceneState} SceneState */
/** @typedef {import('../types.js').Viewport} Viewport */
/** @typedef {import('../types.js').SceneHost} SceneHost */
/** @typedef {import('../types.js').SceneView} SceneView */
/** @typedef {import('../types.js').AmbientSample} AmbientSample */
/** @typedef {import('../types.js').BandRect} BandRect */

/** @type {import('../types.js').SceneMeta} */
export const meta = SCENES[1];

/** Index of the cobalt band, the one that survives the fade and becomes Scene 3's ground. */
const COBALT = 5;

/** The cursor schedule (§4): 5 steps of 0.168 from p 0.05 to p 0.89. */
const CURSOR_START = 0.05;
const STEP = 0.168;
const STEPS = 5;
/** Within a step: the plateau is the first 35% of t, and creeps by 0.06 (§3.3 rule 2). */
const PLATEAU = 0.35;
const CREEP = 0.06;

/** Width weights (§4): w_i = 1 + PEAK · A · exp(−((i − c) / SPREAD)²). */
const PEAK = 11;
const SPREAD = 0.6;

/** Maximum group shear, degrees (§4; §10.2 limits large-area rotation to this skew). */
const SHEAR_MAX = -18;

/** Dot tones (§4). */
const INK_ALPHA = 0.08;
const WHITE_ALPHA = 0.55;

/** The centre dot (§3.4): r 3 px, with a 1 px ring of --ink at 25%. */
const WHITE_POINT_R = 3;

/**
 * Overscan per side, as a fraction of U (horizontally) and V (vertically):
 * 0.2 + 1 + 0.2 = 140% (§4). skewX moves points only along u, by at most
 * tan(18.8°) · V/2 ≈ 0.17 U at a square viewport (V ≤ U always), so 0.2 U
 * covers the maximum shear plus breathing at every aspect ratio.
 */
const OVERSCAN = 0.2;

/** Breathing (§7.8): dominant band width ±2.5% every 10 s; shear ±0.8° every 13 s. */
const BREATHE_WIDTH = 0.025;
const BREATHE_WIDTH_S = 10;
const BREATHE_SHEAR = 0.8;
const BREATHE_SHEAR_S = 13;

/**
 * The dominance cursor c(p) (§4): 0 (vermilion) → 5 (cobalt). Before p 0.05
 * it is 0; after p 0.89 it is 5. Within step k, at local t ∈ [0, 1]:
 * c = k + 0.06 · t / 0.35 on the plateau (t < 0.35), then
 * c = k + 0.06 + 0.94 · smooth((t − 0.35) / 0.65). Continuous, and monotone.
 * @param {number} p
 */
function cursor(p) {
  const x = (p - CURSOR_START) / STEP;
  if (x <= 0) return 0;
  if (x >= STEPS) return STEPS;
  const k = Math.floor(x);
  const t = x - k;
  if (t < PLATEAU) return k + (CREEP * t) / PLATEAU;
  return k + CREEP + (1 - CREEP) * smooth((t - PLATEAU) / (1 - PLATEAU));
}

/**
 * Normalised band widths (fractions of U, summing to 1) for amplitude A,
 * cursor c and fade (§4). Every band except cobalt is multiplied by `fade`.
 * @param {number} A
 * @param {number} c
 * @param {number} fade
 * @returns {number[]}
 */
function widthsFor(A, c, fade) {
  const w = [];
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const wi = (1 + PEAK * A * Math.exp(-(((i - c) / SPREAD) ** 2))) * (i === COBALT ? 1 : fade);
    w.push(wi);
    total += wi;
  }
  return w.map((wi) => fin(wi / total));
}

/**
 * PURE (K6). The §4 driving parameters, the derived band widths, and the
 * seam geometry (§5.2) for local progress p at viewport vp.
 * @param {number} p local progress, clamped to [0, 1] by the caller
 * @param {Viewport} vp
 * @returns {SceneState}
 */
export function state(p, vp) {
  const pp = clamp(fin(p), 0, 1);
  const A = smooth(r(pp, 0, 0.1));
  const c = cursor(pp);
  const fade = 1 - smooth(r(pp, 0.86, 0.97));
  const shear = SHEAR_MAX * smooth(r(pp, 0, 0.15)) * (1 - smooth(r(pp, 0.8, 0.95)));
  const vertexInk = INK_ALPHA * r(pp, 0.45, 0.7) * (1 - r(pp, 0.9, 1));
  const fillInk = INK_ALPHA * r(pp, 0.8, 0.9) * (1 - r(pp, 0.9, 1));
  const white = WHITE_ALPHA * r(pp, 0.9, 1);
  const whitePoint = r(pp, 0.02, 0.1);

  const widths = widthsFor(A, c, fade);
  const { u, v } = centre(vp);

  return {
    scene: 2,
    p: fin(pp),
    params: {
      A: fin(A),
      c: fin(c),
      shear: fin(shear),
      vertexInk: fin(vertexInk),
      fillInk: fin(fillInk),
      white: fin(white),
      whitePoint: fin(whitePoint),
      fade: fin(fade),
    },
    widths,
    geom: {
      // Once the other bands have faded to nothing, the frame is one cobalt field (the 2 → 3 seam).
      ground: fade === 0 ? 'cobalt' : 'bands',
      bandRects: bandRectsFromWeights(widths, vp),
      dotGrid: {
        ...dotGrid(vp),
        vertexWhite: fin(white),
        fillWhite: fin(white),
        vertexInk: fin(vertexInk),
        fillInk: fin(fillInk),
      },
      whitePoint: { u, v, r: WHITE_POINT_R, alpha: fin(whitePoint) },
      shelf: null,
      channelScales: null,
      glassAlpha: 0,
      beamRect: null,
      otherOpacity: 0,
    },
  };
}

/**
 * Breathing on the widths (§7.8): the dominant band grows or shrinks by up to
 * ±2.5% of its own width, and the others give or take the difference in
 * proportion, so the field stays full bleed. A field that is all one band
 * cannot breathe in width (there is nothing to give), only in shear.
 * @param {number[]} widths fractions of U, summing to 1
 * @param {number} k relative change, e.g. 0.025
 * @returns {number[]}
 */
function breatheWidths(widths, k) {
  let d = 0;
  for (let i = 1; i < widths.length; i++) if (widths[i] > widths[d]) d = i;
  const rest = 1 - widths[d];
  if (!(rest > 1e-9)) return widths;
  const wd = Math.min(1, widths[d] * (1 + k));
  const scale = (1 - wd) / rest;
  return widths.map((w, i) => (i === d ? wd : w * scale));
}

/**
 * The rects actually drawn: the state's rects, with the outermost visible band
 * on each side extended by the overscan, and every band extended across v by
 * it. The outermost band with width is used (not band 1 or 7 blindly), so a
 * band that has faded to zero width can never reappear as a sheared corner.
 * @param {BandRect[]} rects
 * @param {Viewport} vp
 * @returns {BandRect[]}
 */
function overscanned(rects, vp) {
  const oU = OVERSCAN * vp.U;
  const oV = OVERSCAN * vp.V;
  const out = rects.map((b) => ({ u0: b.u0, u1: b.u1, v0: -oV, v1: vp.V + oV }));
  let first = 0;
  while (first < out.length - 1 && !(out[first].u1 > out[first].u0)) first++;
  let last = out.length - 1;
  while (last > 0 && !(out[last].u1 > out[last].u0)) last--;
  out[first].u0 = -oU;
  out[last].u1 = vp.U + oU;
  return out;
}

/**
 * Mount one instance (main, or the reduced-motion a / b) into host.uv.
 * Builds the DOM once; `apply` only writes.
 * @param {SceneHost} host
 * @returns {SceneView}
 */
export function mount(host) {
  const prefix = `scene2-${host.instance}`;
  /** @type {Viewport} */
  let vp = host.vp;

  const root = el('div', { class: 's2-field', 'data-instance': host.instance }, host.uv);
  const shearBox = el('div', { class: 's2-shear' }, root);
  const bands = createBands(shearBox, { blend: 'normal', idPrefix: prefix });
  const svg = el('svg', { class: 's2-dots', 'aria-hidden': 'true', focusable: 'false' }, root);
  const grid = createDotGrid(svg, { idPrefix: prefix });
  const point = createWhitePoint(svg);

  /** @param {Viewport} next */
  function size(next) {
    setAttrs(svg, { width: next.U, height: next.V });
  }
  size(vp);

  return {
    apply(s, amb) {
      const a = amb.a > 0 ? amb.a : 0;
      const { params, geom } = s;

      let rects = geom.bandRects;
      let shear = params.shear;
      if (a > 0) {
        const widthWave = Math.sin((2 * Math.PI * amb.t) / BREATHE_WIDTH_S);
        const shearWave = Math.sin((2 * Math.PI * amb.t) / BREATHE_SHEAR_S);
        rects = bandRectsFromWeights(breatheWidths(/** @type {number[]} */ (s.widths), BREATHE_WIDTH * a * widthWave), vp);
        shear += BREATHE_SHEAR * a * shearWave;
      }

      bands.set(overscanned(rects, vp), vp);
      // No transform at all when unsheared, so p 0 rasterises exactly like Scene 1's bands (the 1 → 2 seam).
      setStyles(shearBox, { transform: shear === 0 ? null : `skewX(${fin(shear)}deg)` });
      grid.set(geom.dotGrid, vp);
      point.set(geom.whitePoint, 'ink25');
    },
    resize(next) {
      vp = next;
      size(next);
    },
    destroy() {
      root.remove();
    },
  };
}
