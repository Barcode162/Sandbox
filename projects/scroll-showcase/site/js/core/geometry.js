// core/geometry.js — the shared geometry of the piece (architecture §C2).
//
// Seams are equal by construction (spec §5.2, F5): every scene that draws the
// seven bands, the dot grid, the shelf or the beam asks this module for it, so
// the two sides of a seam compute the same numbers from the same code.
//
// All pure: no DOM, no clock. Every length is in CSS px in the abstract
// (u, v) frame of spec §3.2: u runs along the long axis (length U), v across it
// (length V). Portrait is handled by a CSS transpose (K5), never in here.

import { clamp, fin } from './math.js';

/** @typedef {import('../types.js').SceneId} SceneId */
/** @typedef {import('../types.js').SceneMeta} SceneMeta */
/** @typedef {import('../types.js').Slug} Slug */
/** @typedef {import('../types.js').Bp} Bp */
/** @typedef {import('../types.js').Viewport} Viewport */
/** @typedef {import('../types.js').Layout} Layout */
/** @typedef {import('../types.js').BandRect} BandRect */
/** @typedef {import('../types.js').DotGridState} DotGridState */
/** @typedef {import('../types.js').ShelfItem} ShelfItem */

/**
 * @param {SceneId} id
 * @param {Slug} slug
 * @param {string} name
 * @param {number} track svh
 * @param {number} h0 hold band start (p)
 * @param {number} h1 hold band end (p)
 * @param {string | null} creep the driving parameter that creeps in the hold
 * @returns {SceneMeta}
 */
function meta(id, slug, name, track, h0, h1, creep) {
  const hold = /** @type {[number, number]} */ (Object.freeze([h0, h1]));
  return Object.freeze({ id, slug, name, track, hold, creep });
}

/**
 * The six scenes in arc order (spec §3.1): tracks in svh, signature hold bands
 * (§3.1, Appendix A) and the creep parameter named exactly as in §4 / C1
 * (§3.3 rule 2). Scene 6's hold is the designed static rest, so it has none.
 * @type {readonly SceneMeta[]}
 */
export const SCENES = Object.freeze([
  meta(1, 'incidence', 'Incidence', 220, 0.45, 0.6, 'spread'),
  meta(2, 'field', 'Field', 300, 0.722, 0.781, 'c'),
  meta(3, 'refraction', 'Refraction', 260, 0.42, 0.58, 'tri'),
  meta(4, 'dichroic', 'Dichroic', 320, 0.44, 0.56, 'theta'),
  meta(5, 'agreement', 'Agreement', 220, 0.25, 0.4, 'tau'),
  meta(6, 'return', 'Return', 180, 0.4, 0.52, null),
]);

/** The colophon's height in svh; it follows the tracks in normal flow (§4, Scene 6). */
export const COLOPHON_SVH = 70;

/** Sum of every scene track in svh (1,500). */
const TOTAL_SVH = SCENES.reduce((sum, s) => sum + s.track, 0);

/**
 * Global progress G at each scene's start: [0, 220, 520, 780, 1100, 1320] / 1500.
 * Derived from SCENES, so a track change can never leave the ticks behind.
 * @type {readonly number[]}
 */
export const TICK_G = Object.freeze(
  SCENES.map((_, i) => SCENES.slice(0, i).reduce((sum, s) => sum + s.track, 0) / TOTAL_SVH),
);

/**
 * Per-breakpoint gutter and dot pitch (spec §11.1). The 1920 pitch is 36 px;
 * cut item 4 (round(32·vw/1440) above 1440) is a descope that has not been taken.
 * @type {Readonly<Record<Bp, { gutter: number; pitch: number }>>}
 */
const BREAKPOINTS = Object.freeze({
  375: Object.freeze({ gutter: 16, pitch: 24 }),
  768: Object.freeze({ gutter: 24, pitch: 24 }),
  1024: Object.freeze({ gutter: 32, pitch: 28 }),
  1440: Object.freeze({ gutter: 40, pitch: 32 }),
  1920: Object.freeze({ gutter: 48, pitch: 36 }),
});

/**
 * Breakpoint by CSS width: <768 → 375, <1024 → 768, <1440 → 1024, <1920 → 1440, else 1920.
 * @param {number} vw
 * @returns {Bp}
 */
function breakpoint(vw) {
  if (vw < 768) return 375;
  if (vw < 1024) return 768;
  if (vw < 1440) return 1024;
  if (vw < 1920) return 1440;
  return 1920;
}

/**
 * A measured length as a usable px value: finite and at least 1. A collapsed
 * or hidden viewport (0 × 0) still yields finite geometry instead of NaN.
 * @param {number} x
 * @returns {number}
 */
function px(x) {
  return Number.isFinite(x) && x >= 1 ? x : 1;
}

/**
 * Build the Viewport record (C1) from the three measured inputs.
 * @param {number} vw documentElement.clientWidth, CSS px
 * @param {number} sh height of a 100svh probe, CSS px
 * @param {number} dpr devicePixelRatio
 * @returns {Viewport}
 */
export function viewport(vw, sh, dpr) {
  const w = px(vw);
  const h = px(sh);
  const ratio = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const landscape = w / h >= 1;
  const bp = breakpoint(w);
  const { gutter, pitch } = BREAKPOINTS[bp];
  return {
    vw: w,
    sh: h,
    dpr: ratio,
    landscape,
    U: landscape ? w : h,
    V: landscape ? h : w,
    vmin: Math.min(w, h) / 100,
    bp,
    gutter,
    pitch,
    lattice: 2 * pitch,
  };
}

/**
 * Scroll layout (spec §3.2): L_s = track_s × svh in px (never dvh), Y_s the
 * running sum, D the total. Y[s] + L[s] === Y[s+1] exactly, by construction.
 * @param {Viewport} vp
 * @returns {Layout}
 */
export function trackLayout(vp) {
  const L = SCENES.map((s) => (s.track * vp.sh) / 100);
  /** @type {number[]} */
  const Y = [];
  let D = 0;
  for (const len of L) {
    Y.push(D);
    D += len;
  }
  return { vp, Y, L, D };
}

/**
 * Which scene a scroll offset is in, and where (spec §3.2).
 * y ∈ [Y_s, Y_s + L_s) → scene s with p = (y − Y_s) / L_s; y ≥ D → scene 6 at
 * p 1; y < 0 clamps to 0. G = clamp(y / D, 0, 1). Throws on a non-finite y.
 * @param {number} y scrollY, CSS px
 * @param {Layout} layout
 * @returns {{ scene: SceneId; p: number; G: number }}
 */
export function locate(y, layout) {
  const { Y, L, D } = layout;
  const yy = clamp(fin(y), 0, D);
  const last = SCENES.length - 1;
  if (yy >= D) return { scene: SCENES[last].id, p: 1, G: 1 };
  let s = last;
  while (s > 0 && yy < Y[s]) s--;
  return {
    scene: SCENES[s].id,
    p: fin(clamp((yy - Y[s]) / L[s], 0, 1)),
    G: fin(clamp(yy / D, 0, 1)),
  };
}

/**
 * Snap a CSS px coordinate to the device-pixel grid: Math.round(x·dpr)/dpr.
 * The root of gapless bands (polish #4). Never returns −0.
 * @param {number} x
 * @param {number} dpr
 * @returns {number}
 */
export function snap(x, dpr) {
  const s = Math.round(x * dpr) / dpr;
  return s === 0 ? 0 : s;
}

/**
 * Seven equal full-bleed bands over U × V (spec §4, the chorus). Identical to
 * bandRectsFromWeights with equal weights, so the 1 → 2 and 4 → 5 seams share
 * one computation.
 * @param {Viewport} vp
 * @returns {BandRect[]}
 */
export function bandRects(vp) {
  return bandRectsFromWeights([1, 1, 1, 1, 1, 1, 1], vp);
}

/**
 * Full-bleed bands whose widths follow `w`, normalised to U. Each interior edge
 * is snap(U · Σw[<i] / Σw) clamped to [0, U]; the first edge is exactly 0 and
 * the last exactly U. Neighbours read the same edge value, so band i's u1 is
 * band i+1's u0 bit for bit: no gap and no overlap at any DPR. Zero weights
 * give zero-width bands.
 * @param {readonly number[]} w non-negative finite weights, not all zero
 * @param {Viewport} vp
 * @returns {BandRect[]}
 */
export function bandRectsFromWeights(w, vp) {
  const n = w.length;
  if (n === 0) throw new RangeError('bandRectsFromWeights(): no weights');
  let total = 0;
  for (let i = 0; i < n; i++) {
    const wi = w[i];
    if (!Number.isFinite(wi) || wi < 0) {
      throw new RangeError(`bandRectsFromWeights(): weight ${i} is ${String(wi)}; weights must be finite and >= 0`);
    }
    total += wi;
  }
  if (!(total > 0)) throw new RangeError('bandRectsFromWeights(): weights sum to 0');

  const { U, V, dpr } = vp;
  /** @type {number[]} */
  const edges = [0];
  let acc = 0;
  for (let i = 1; i < n; i++) {
    acc += w[i - 1];
    edges.push(clamp(snap((U * acc) / total, dpr), 0, U));
  }
  edges.push(U);

  /** @type {BandRect[]} */
  const rects = [];
  for (let i = 0; i < n; i++) rects.push({ u0: edges[i], u1: edges[i + 1], v0: 0, v1: V });
  return rects;
}

/**
 * The dot grid's placement (spec §4 Scene 2, §11.1). The pattern origin is the
 * vertex dot nearest the top-left corner, (U/2, V/2) reduced modulo the lattice
 * (2 · pitch), so a vertex dot lies exactly on the stage centre: U/2 − originU
 * is an exact multiple of the lattice (fmod is exact in IEEE arithmetic, and so
 * is the subtraction, whose result is representable). Fill dots sit at the
 * other pitch positions.
 * @param {Viewport} vp
 * @returns {Pick<DotGridState, 'pitch' | 'originU' | 'originV' | 'r'>}
 */
export function dotGrid(vp) {
  const lattice = 2 * vp.pitch;
  return {
    pitch: vp.pitch,
    originU: (vp.U / 2) % lattice,
    originV: (vp.V / 2) % lattice,
    r: 2.5,
  };
}

/**
 * Shape sizes on the shelf in vmin units of the landscape layout (spec §4
 * Scene 3): triangle side 30, circle diameter 26, diamond side 21.
 */
const SHELF_VMIN = Object.freeze({ tri: 30, cir: 26, dia: 21 });

/**
 * In portrait the shapes are "40vw" (spec §11.1): the triangle, the reference
 * shape, is 40vw and the other two keep their landscape proportions to it.
 */
const PORTRAIT_TRI_VW = 40;

/**
 * Fit cap. Neighbouring shelf centres are U/4 apart. The widest neighbouring
 * pair is triangle + circle, whose circumscribed radii (rotation-invariant, so
 * the ±8° arrival tilt is covered) are 30/√3 + 26/2 units. Where the specified
 * sizes would make those circles intersect (near-square windows, and 768×1024
 * under the 40vw rule), every size scales down together until they touch.
 * At 375×812, 1024×768, 1440×900 and 1920×1080 the cap does not engage.
 */
const SHELF_FIT_UNITS = 4 * (SHELF_VMIN.tri / Math.sqrt(3) + SHELF_VMIN.cir / 2);

/**
 * Scene 3's resting shelf, shared with Scene 4's start (spec §5.2, 3 → 4 seam):
 * triangle, circle and diamond at u = .25 / .50 / .75 U on v = V/2, rot 0.
 * `size` is the triangle's side, the circle's diameter and the diamond's side
 * (a square turned 45°), in px: 30 / 26 / 21 vmin in landscape, 40vw-scaled in
 * portrait (§11.1), never so large that neighbours collide (the fit cap above).
 * @param {Viewport} vp
 * @returns {ShelfItem[]}
 */
export function shelf(vp) {
  const { U, V } = vp;
  const v = V / 2;
  // px per size unit: landscape 1 vmin; portrait so that the triangle is 40vw.
  const specified = vp.landscape ? Math.min(vp.vw, vp.sh) / 100 : (PORTRAIT_TRI_VW * vp.vw) / (SHELF_VMIN.tri * 100);
  const fit = U / SHELF_FIT_UNITS;
  /** @param {number} k the shape's size in units; uncapped sizes keep integer products and one rounding */
  const size = specified <= fit
    ? vp.landscape
      ? (k) => (k * Math.min(vp.vw, vp.sh)) / 100
      : (k) => (PORTRAIT_TRI_VW * k * vp.vw) / (SHELF_VMIN.tri * 100)
    : (k) => k * fit;
  return [
    { kind: 'tri', u: 0.25 * U, v, size: size(SHELF_VMIN.tri), rot: 0 },
    { kind: 'cir', u: 0.5 * U, v, size: size(SHELF_VMIN.cir), rot: 0 },
    { kind: 'dia', u: 0.75 * U, v, size: size(SHELF_VMIN.dia), rot: 0 },
  ];
}

/**
 * Width of the final white beam (spec §4 Scene 5): max(0.09 · U, 32) px.
 * In portrait U is the svh, so this is the spec's max(9svh, 32px) bar.
 * @param {Viewport} vp
 * @returns {number}
 */
export function beamW(vp) {
  // 9·U/100 rounds once; 0.09·U would carry 0.09's binary error (129.6 at 1440 must be exact).
  return Math.max((9 * vp.U) / 100, 32);
}

/**
 * The stage centre in (u, v): where the white point lives (spec §3.4).
 * @param {Viewport} vp
 * @returns {{ u: number; v: number }}
 */
export function centre(vp) {
  return { u: vp.U / 2, v: vp.V / 2 };
}
