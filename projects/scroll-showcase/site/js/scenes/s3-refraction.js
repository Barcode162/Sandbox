// scenes/s3-refraction.js: Scene 3 *Refraction* (spec §4 Scene 3, D3; WO-009).
//
// Three glass shapes (triangle, circle, diamond) travel over Scene 2's cobalt
// dot field and come to rest on the shelf. Each shape is a window onto a
// magnified copy of the ground: three copies of an inner dot pattern (r 2.75,
// 100%), tinted --ch-r, --ch-g and --ch-b, screen-blended and scaled about the
// shape centre by 1.25 / 1.40 / 1.55. A source dot at distance s from the
// centre therefore lands as three images 0.15·s apart: one white dot on the
// optical axis, and separate red, green and blue dots towards the rim (§17 #6).
// Where the triangle and circle overlap, light passes both glasses, so the
// channel scales compound (s_k² about the two centres) and the triplets spread
// wider still (cut item 1, kept).
//
// Rendering notes:
// - Everything is drawn in the (u, v) frame (K5) into one SVG of U × V px.
// - Each pattern copy's rect is the pre-image of the shape's bounding box under
//   its transform, so no copy is ever larger than its shape (D3, §16.2).
// - Phase lock: the inner pattern shares the ground's pitch and origin, but on
//   the shelf the triangle and diamond centres do not sit on a ground dot (at
//   1440 the triangle centre is a quarter pitch from one). So the inner pattern
//   is shifted by at most half a pitch, ramped in with smooth(f) over each
//   shape's travel f, so that a dot lies exactly on every resting shape's
//   centre and that centre reads white. The circle rests on the grid centre,
//   so its shift is 0.
// - The glass edge (1.5 px --glass-edge) is drawn above every clipped region
//   and centred on the clip boundary, so it covers the clip's anti-aliased
//   edge (#7). A 1 px --fringe-c line sits just inside the upper-left edge.

import { fin, keys, lin, smooth } from '../core/math.js';
import { SCENES, centre, dotGrid, shelf } from '../core/geometry.js';
import { el, setAttrs } from '../components/svg.js';
import { createDotGrid } from '../components/dotgrid-svg.js';
import { createWhitePoint } from '../components/white-point.js';

/** @typedef {import('../types.js').SceneState} SceneState */
/** @typedef {import('../types.js').Viewport} Viewport */
/** @typedef {import('../types.js').SceneHost} SceneHost */
/** @typedef {import('../types.js').SceneView} SceneView */
/** @typedef {import('../types.js').ShelfItem} ShelfItem */
/** @typedef {import('../types.js').AmbientSample} AmbientSample */
/** @typedef {import('../types.js').Key} Key */
/** @typedef {'tri' | 'cir' | 'dia'} Kind */

/** @type {import('../types.js').SceneMeta} */
export const meta = SCENES[2];

/** Per-channel magnification about the shape centre (D3): red, green, blue. */
export const CHANNEL_SCALES = /** @type {const} */ ([1.25, 1.4, 1.55]);
/** Inner dot radius before magnification (D3: 3.4 / 3.85 / 4.3 px rendered). */
export const INNER_R = 2.75;
/** Scene 2's p 1 dot tones, inherited unchanged (§5.2, 2 → 3 seam). */
const GROUND_WHITE = 0.55;
/** Glass edge stroke, px (§4 glass body). */
const EDGE_W = 1.5;
/** The fringe line's centre sits this far inside the boundary: flush against the edge stroke. */
const FRINGE_INSET = EDGE_W / 2 + 0.5;
/** Extra margin on every bounding box, px, so anti-aliased edges are never cut by a copy's rect. */
const BOX_PAD = 2;

/**
 * Position keyframes in % of U (§4 Scene 3). Each path is one `keys` list: the
 * travel, the hold creep (lin) and the overshoot settling onto the shelf (smooth).
 * @type {Readonly<Record<Kind, readonly Key[]>>}
 */
const PATHS = Object.freeze({
  tri: [[0, 110], [0.42, 43], [0.58, 42, lin], [0.88, 23.8], [0.96, 25, smooth]],
  cir: [[0.12, 112], [0.42, 53], [0.58, 52, lin], [0.9, 49.4], [0.97, 50, smooth]],
  dia: [[0.58, 130], [0.92, 73.5], [0.98, 75, smooth]],
});

/** Start and shelf positions, % of U, for the travel fraction f. */
const TRAVEL = Object.freeze({ tri: [110, 25], cir: [112, 50], dia: [130, 75] });

/** Arrival tilt, degrees, at f = 0 (triangle +8°, diamond −8°; the circle does not rotate). */
const TILT = Object.freeze({ tri: 8, cir: 0, dia: -8 });

const KINDS = /** @type {const} */ (['tri', 'cir', 'dia']);

/** Breathing (§7.8): bob ±6 px along v over 7 s with phases 0 / .33 / .66; scales ±0.01 over 9 s. */
const BOB_PX = 6;
const BOB_S = 7;
const BOB_PHASE = Object.freeze({ tri: 0, cir: 0.33, dia: 0.66 });
const SCALE_BREATH = 0.01;
const SCALE_S = 9;

/**
 * Travel fraction f = (u₀ − u) / (u₀ − u_shelf), clamped to [0, 1].
 * @param {Kind} kind
 * @param {number} u % of U
 */
function travel(kind, u) {
  const [u0, u1] = TRAVEL[kind];
  const f = (u0 - u) / (u0 - u1);
  return f <= 0 ? 0 : f >= 1 ? 1 : f;
}

/**
 * The circumscribed radius of a shape of the given `size` (side or diameter), px.
 * Rotation-invariant, so it bounds the shape at every tilt.
 * @param {Kind} kind
 * @param {number} size
 */
export function circumradius(kind, size) {
  if (kind === 'tri') return size / Math.sqrt(3);
  if (kind === 'dia') return size / Math.SQRT2;
  return size / 2;
}

/**
 * Wrap x into (−m/2, m/2].
 * @param {number} x
 * @param {number} m
 */
function wrapHalf(x, m) {
  let w = x - m * Math.round(x / m);
  if (w <= -m / 2) w += m;
  return fin(w);
}

/**
 * PURE (K6). The §4 driving parameters and the seam geometry at progress p.
 * @param {number} p local progress, clamped to [0, 1] by the caller
 * @param {Viewport} vp
 * @returns {SceneState}
 */
export function state(p, vp) {
  const tri = keys(p, PATHS.tri);
  const cir = keys(p, PATHS.cir);
  const dia = keys(p, PATHS.dia);
  const pos = { tri, cir, dia };
  const triRot = fin(TILT.tri * (1 - travel('tri', tri)));
  const diaRot = fin(TILT.dia * (1 - travel('dia', dia)));
  const rot = { tri: triRot, cir: 0, dia: diaRot };

  const rest = shelf(vp);
  const grid = dotGrid(vp);
  const mid = centre(vp);

  /** @type {ShelfItem[]} */
  const items = rest.map((item) => ({
    kind: item.kind,
    u: fin(vp.U * (pos[item.kind] / 100)),
    v: item.v,
    size: item.size,
    rot: rot[item.kind],
  }));

  // Phase lock (see the header): the inner-pattern shift that puts a dot on each
  // resting centre, ramped in with smooth(f) over the shape's travel.
  const innerShift = rest.map((item) => {
    const k = smooth(travel(item.kind, pos[item.kind]));
    return {
      u: fin(k * wrapHalf(item.u - grid.originU, grid.pitch)),
      v: fin(k * wrapHalf(item.v - grid.originV, grid.pitch)),
    };
  });

  // The triangle–circle overlap region is drawn only when the two can touch,
  // with room for both breathing bobs.
  const [t, c] = items;
  const reach = circumradius('tri', t.size) + circumradius('cir', c.size) + 2 * BOX_PAD + 2 * BOB_PX;
  const double = Math.abs(t.u - c.u) < reach ? 1 : 0;

  return {
    scene: 3,
    p: fin(p),
    params: { tri, cir, dia, triRot, diaRot },
    geom: {
      ground: 'cobalt',
      bandRects: null,
      dotGrid: { ...grid, vertexWhite: GROUND_WHITE, fillWhite: GROUND_WHITE, vertexInk: 0, fillInk: 0 },
      whitePoint: { u: mid.u, v: mid.v, r: 3, alpha: 1 },
      shelf: items,
      channelScales: [CHANNEL_SCALES[0], CHANNEL_SCALES[1], CHANNEL_SCALES[2]],
      glassAlpha: 1,
      beamRect: null,
      otherOpacity: 0,
    },
    innerShift,
    double,
  };
}

/**
 * Outline of a shape centred on (0, 0) at rot 0, as path data. The triangle is
 * equilateral (centroid at the origin) with its tip towards −u; the diamond is
 * a square turned 45°.
 * @param {Kind} kind
 * @param {number} size
 * @param {number} [inset] px, moves every edge inwards (for the fringe line)
 */
function outline(kind, size, inset = 0) {
  if (kind === 'cir') {
    const rr = size / 2 - inset;
    return `M${-rr} 0A${rr} ${rr} 0 1 0 ${rr} 0A${rr} ${rr} 0 1 0 ${-rr} 0Z`;
  }
  const pts = corners(kind, size, inset);
  return `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
}

/**
 * Corners of the triangle or diamond, shrunk about the centre so that each edge
 * moves `inset` px inwards (a regular polygon shrinks uniformly).
 * @param {'tri' | 'dia'} kind
 * @param {number} size
 * @param {number} inset
 * @returns {[number, number][]}
 */
function corners(kind, size, inset) {
  if (kind === 'tri') {
    const inr = size / (2 * Math.sqrt(3));
    const k = (inr - inset) / inr;
    const R = (size / Math.sqrt(3)) * k;
    const half = (size / 2) * k;
    return [[-R, 0], [R / 2, -half], [R / 2, half]];
  }
  const k = (size / 2 - inset) / (size / 2);
  const h = (size / Math.SQRT2) * k;
  return [[-h, 0], [0, -h], [h, 0], [0, h]];
}

/**
 * The fringe highlight: the edge (or arc) facing −u and −v, which is the
 * upper-left on screen in both orientations, because the portrait transpose
 * maps −u to up and −v to left.
 * @param {Kind} kind
 * @param {number} size
 */
function fringe(kind, size) {
  if (kind === 'cir') {
    const rr = size / 2 - FRINGE_INSET;
    const a0 = (200 * Math.PI) / 180;
    const a1 = (250 * Math.PI) / 180;
    const p0 = [rr * Math.cos(a0), rr * Math.sin(a0)];
    const p1 = [rr * Math.cos(a1), rr * Math.sin(a1)];
    return `M${p0[0]} ${p0[1]}A${rr} ${rr} 0 0 1 ${p1[0]} ${p1[1]}`;
  }
  const pts = corners(kind, size, FRINGE_INSET);
  // tri: tip → upper corner; dia: left corner → top corner. Trimmed so the line
  // stops short of the corners, where the edge stroke turns.
  const [a, b] = [pts[0], pts[1]];
  const trim = 0.12;
  const s = [a[0] + (b[0] - a[0]) * trim, a[1] + (b[1] - a[1]) * trim];
  const e = [a[0] + (b[0] - a[0]) * (1 - trim), a[1] + (b[1] - a[1]) * (1 - trim)];
  return `M${s[0]} ${s[1]}L${e[0]} ${e[1]}`;
}

/**
 * An affine map x ↦ a·x + (e, f) with a uniform scale a.
 * @typedef {{ a: number; e: number; f: number }} Affine
 */

/**
 * Scale by s about (cu, cv), applied after `inner`.
 * @param {number} s
 * @param {number} cu
 * @param {number} cv
 * @param {Affine} inner
 * @returns {Affine}
 */
function scaleAbout(s, cu, cv, inner) {
  return { a: s * inner.a, e: s * inner.e + cu * (1 - s), f: s * inner.f + cv * (1 - s) };
}

/**
 * The pre-image of the box (cu ± R, cv ± R) under `m`: the source rect a copy
 * needs so that, transformed, it covers exactly the shape's bounding box.
 * @param {Affine} m
 * @param {number} cu
 * @param {number} cv
 * @param {number} R
 */
function preimage(m, cu, cv, R) {
  return {
    x: (cu - R - m.e) / m.a,
    y: (cv - R - m.f) / m.a,
    width: (2 * R) / m.a,
    height: (2 * R) / m.a,
  };
}

/** @param {Affine} m */
function matrix(m) {
  return `matrix(${m.a} 0 0 ${m.a} ${m.e} ${m.f})`;
}

/**
 * Mount Scene 3 into host.uv. Writes only; reads nothing from layout.
 * @param {SceneHost} host
 * @returns {SceneView}
 */
export function mount(host) {
  const prefix = `scene3-${host.instance}`;
  const id = (/** @type {string} */ name) => `${prefix}-${name}`;
  let vp = host.vp;

  const svg = el('svg', {
    class: 's3',
    'data-instance': host.instance,
    width: vp.U,
    height: vp.V,
    'aria-hidden': 'true',
    focusable: 'false',
  }, host.uv);
  const defs = el('defs', {}, svg);

  // Ground: cobalt and Scene 2's p 1 dot grid (identity seam 2 → 3).
  const ground = el('rect', { class: 's3-ground', x: 0, y: 0, width: vp.U, height: vp.V }, svg);
  const grid = createDotGrid(svg, { idPrefix: prefix });

  // The glass body gradient: light from the upper-left in both orientations
  // (a diagonal is symmetric under the portrait transpose).
  const body = el('linearGradient', { id: id('glass'), x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
  el('stop', { offset: 0, class: 's3-glass-hi' }, body);
  el('stop', { offset: 1, class: 's3-glass-lo' }, body);

  // The inner dot patterns, one per channel, at the ground's pitch and origin.
  const channels = /** @type {const} */ (['r', 'g', 'b']);
  const inner = channels.map((ch) => {
    const pattern = el('pattern', { id: id(`inner-${ch}`), patternUnits: 'userSpaceOnUse' }, defs);
    const dot = el('circle', { class: `s3-dot s3-dot-${ch}`, r: INNER_R }, pattern);
    return { pattern, dot };
  });

  const glassLayer = el('g', { class: 's3-glass' }, svg);
  const edgeLayer = el('g', { class: 's3-edges' }, svg);

  /**
   * One clipped window: an opaque cobalt cover (hides the ground dots), the
   * glass body, and the three screen-blended channel copies.
   * @param {Element} parent
   * @param {string} kind
   * @param {number} bodies how many glass bodies show through (2 in the overlap)
   */
  function makeWindow(parent, kind, bodies) {
    const cover = el('path', { class: 's3-cover' }, parent);
    const bodyPaths = [];
    for (let i = 0; i < bodies; i++) bodyPaths.push(el('path', { class: 's3-body', fill: `url(#${id('glass')})` }, parent));
    const copies = channels.map((ch) => {
      const g = el('g', { class: 's3-copy' }, parent);
      const rect = el('rect', { fill: `url(#${id(`inner-${ch}`)})`, 'data-channel': ch, 'data-shape': kind }, g);
      return { g, rect };
    });
    return { cover, bodyPaths, copies };
  }

  const shapes = KINDS.map((kind) => {
    const clip = el('clipPath', { id: id(`clip-${kind}`), clipPathUnits: 'userSpaceOnUse' }, defs);
    const clipShape = el('path', {}, clip);
    const group = el('g', { class: 's3-window', 'clip-path': `url(#${id(`clip-${kind}`)})`, 'data-shape': kind }, glassLayer);
    const win = makeWindow(group, kind, 1);
    const edgeGroup = el('g', { 'data-shape': kind }, edgeLayer);
    const edge = el('path', { class: 's3-edge' }, edgeGroup);
    const fringeLine = el('path', { class: 's3-fringe' }, edgeGroup);
    return { kind, clipShape, group, win, edgeGroup, edge, fringeLine };
  });

  // The triangle–circle overlap: nested clips (their intersection), drawn above
  // both windows and below every edge, so both outlines stay visible through it.
  const doubleOuter = el('g', { class: 's3-double', 'clip-path': `url(#${id('clip-cir')})` }, glassLayer);
  const doubleInner = el('g', { 'clip-path': `url(#${id('clip-tri')})` }, doubleOuter);
  const doubleWin = makeWindow(doubleInner, 'double', 2);

  const point = createWhitePoint(svg);

  /** @param {Viewport} next */
  function size(next) {
    setAttrs(svg, { width: next.U, height: next.V });
    setAttrs(ground, { width: next.U, height: next.V });
  }

  return {
    apply(st, amb) {
      const g = st.geom;
      const items = /** @type {ShelfItem[]} */ (g.shelf);
      const shift = /** @type {{ u: number; v: number }[]} */ (st.innerShift);
      const a = amb.a > 0 ? amb.a : 0;
      const t = amb.t;

      size(vp);
      grid.set(/** @type {import('../types.js').DotGridState} */ (g.dotGrid), vp);

      const { pitch, originU, originV } = /** @type {import('../types.js').DotGridState} */ (g.dotGrid);
      for (const { pattern, dot } of inner) {
        setAttrs(pattern, { x: originU - pitch / 2, y: originV - pitch / 2, width: pitch, height: pitch });
        setAttrs(dot, { cx: pitch / 2, cy: pitch / 2 });
      }

      // Breathing: the outer channels widen and close; green holds.
      const breath = a > 0 ? a * SCALE_BREATH * Math.sin((2 * Math.PI * t) / SCALE_S) : 0;
      const scales = [CHANNEL_SCALES[0] - breath, CHANNEL_SCALES[1], CHANNEL_SCALES[2] + breath];

      /** @type {{ cu: number; cv: number; R: number; base: Affine }[]} */
      const placed = [];
      shapes.forEach((s, i) => {
        const item = items[i];
        const bob = a > 0 ? a * BOB_PX * Math.sin(2 * Math.PI * (t / BOB_S + BOB_PHASE[s.kind])) : 0;
        const cu = item.u;
        const cv = item.v + bob;
        const R = circumradius(s.kind, item.size) + BOX_PAD;
        const place = `translate(${cu} ${cv}) rotate(${item.rot})`;
        const d = outline(s.kind, item.size);

        setAttrs(s.clipShape, { d, transform: place });
        setAttrs(s.win.cover, { d, transform: place });
        setAttrs(s.win.bodyPaths[0], { d, transform: place });
        setAttrs(s.edgeGroup, { transform: place });
        setAttrs(s.edge, { d });
        setAttrs(s.fringeLine, { d: fringe(s.kind, item.size) });

        /** @type {Affine} the source shift (phase lock), before magnification */
        const base = { a: 1, e: shift[i].u, f: shift[i].v };
        s.win.copies.forEach((copy, k) => {
          const m = scaleAbout(scales[k], cu, cv, base);
          setAttrs(copy.g, { transform: matrix(m) });
          setAttrs(copy.rect, preimage(m, cu, cv, R));
        });
        placed.push({ cu, cv, R, base });
      });

      // Double refraction: light through the triangle, then the circle.
      const [tp, cp] = placed;
      const on = st.double === 1;
      setAttrs(doubleOuter, { visibility: on ? null : 'hidden' });
      if (on) {
        const triItem = items[0];
        const cirItem = items[1];
        setAttrs(doubleWin.cover, { d: outline('cir', cirItem.size), transform: `translate(${cp.cu} ${cp.cv})` });
        setAttrs(doubleWin.bodyPaths[0], {
          d: outline('tri', triItem.size),
          transform: `translate(${tp.cu} ${tp.cv}) rotate(${triItem.rot})`,
        });
        setAttrs(doubleWin.bodyPaths[1], { d: outline('cir', cirItem.size), transform: `translate(${cp.cu} ${cp.cv})` });
        doubleWin.copies.forEach((copy, k) => {
          const m = scaleAbout(scales[k], cp.cu, cp.cv, scaleAbout(scales[k], tp.cu, tp.cv, tp.base));
          setAttrs(copy.g, { transform: matrix(m) });
          setAttrs(copy.rect, preimage(m, cp.cu, cp.cv, cp.R));
        });
      }

      point.set(g.whitePoint, 'ink25');
    },
    resize(next) {
      vp = next;
      size(vp);
    },
    destroy() {
      svg.remove();
    },
  };
}
