// scenes/prism-svg.js: the prism, beam and seven-wedge fan shared by Scene 1 (Incidence) and
// Scene 6 (Return, which redraws it in line). Pure geometry plus one SVG builder.
//
// Geometry is in the scene's (u, v) frame, v pointing down. The prism is an equilateral triangle,
// apex up, centroid at (36% U, 52% V), side 34 vmin capped at 400 px. Light enters the left face and
// leaves the right face as a fan of seven wedges (vermilion on top). Straightening (s) lerps every
// wedge vertex to the matching corner of its column, so adjacent wedges share vertices for every s
// and the fan can never overlap itself or open a gap (spec §4 Scene 1).

import { bandRects } from '../core/geometry.js';
import { el, setAttrs, setStyles } from '../components/svg.js';
import { BANDS } from '../core/tokens.js';
import { fin } from '../core/math.js';

const DEG = Math.PI / 180;
/** Near vertices are spaced 2 px apart along the exit face. */
const NEAR_GAP = 2;

/**
 * @param {import('../types.js').Viewport} vp
 * @param {number} rotDeg prism rotation, degrees
 */
export function prismGeom(vp, rotDeg) {
  const side = Math.min(34 * vp.vmin, 400);
  const cu = 0.36 * vp.U;
  const cv = 0.52 * vp.V;
  const R = side / Math.sqrt(3); // centroid to vertex
  const a = rotDeg * DEG;
  /** @type {[number, number][]} apex, bottom-right, bottom-left */
  const pts = [-90, 30, 150].map((d) => [cu + R * Math.cos(d * DEG + a), cv + R * Math.sin(d * DEG + a)]);
  const mid = (/** @type {number} */ i, /** @type {number} */ j) =>
    /** @type {[number, number]} */ ([(pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2]);
  const entry = mid(0, 2); // left face midpoint
  const exit = mid(0, 1); // right face midpoint
  const fu = pts[1][0] - pts[0][0];
  const fv = pts[1][1] - pts[0][1];
  const fl = Math.hypot(fu, fv) || 1;
  return { side, cu, cv, pts, entry, exit, face: /** @type {[number, number]} */ ([fu / fl, fv / fl]) };
}

/**
 * The seven wedge quads [nearTop, farTop, farBottom, nearBottom].
 * @param {import('../types.js').Viewport} vp
 * @param {number} rotDeg
 * @param {number} spreadDeg total fan angle
 * @param {number} s straighten, 0..1
 * @returns {[number, number][][]}
 */
export function wedges(vp, rotDeg, spreadDeg, s) {
  const g = prismGeom(vp, rotDeg);
  const cols = bandRects(vp);
  const reach = vp.U - g.exit[0];
  /** @param {number} k boundary 0..7 */
  const near = (k) => [g.exit[0] + g.face[0] * (k - 3.5) * NEAR_GAP, g.exit[1] + g.face[1] * (k - 3.5) * NEAR_GAP];
  /** @param {number} k */
  const far = (k) => [vp.U, g.exit[1] + reach * Math.tan((-spreadDeg / 2 + (k * spreadDeg) / 7) * DEG)];
  const L = (/** @type {number[]} */ a, /** @type {number[]} */ b) =>
    /** @type {[number, number]} */ ([fin(a[0] + (b[0] - a[0]) * s), fin(a[1] + (b[1] - a[1]) * s)]);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const u0 = cols[i].u0;
    const u1 = cols[i].u1;
    out.push([L(near(i), [u0, vp.V]), L(far(i), [u0, 0]), L(far(i + 1), [u1, 0]), L(near(i + 1), [u1, vp.V])]);
  }
  return out;
}

const pathOf = (/** @type {number[][]} */ q) => `M${q.map((p) => `${fin(p[0])} ${fin(p[1])}`).join('L')}Z`;

/**
 * Builds the prism group inside `svg`. `set()` writes only attributes and styles.
 * @param {SVGSVGElement} svg
 * @param {string} prefix unique id prefix (scene + instance)
 */
export function createPrism(svg, prefix) {
  const defs = el('defs', {}, svg);
  const grad = el('linearGradient', { id: `${prefix}-glass`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#FFFFFF', 'stop-opacity': 0.55 }, grad);
  el('stop', { offset: 1, 'stop-color': '#FFFFFF', 'stop-opacity': 0.12 }, grad);

  const fan = el('g', { class: 'prism-fan' }, svg);
  const wedgePaths = BANDS.map((hex) => el('path', { fill: hex }, fan));
  const body = el('g', { class: 'prism-body' }, svg);
  const under = el('line', { class: 'prism-beam-under' }, body);
  const beam = el('line', { class: 'prism-beam' }, body);
  const glass = el('path', { class: 'prism-glass', fill: `url(#${prefix}-glass)` }, body);
  const fc = el('line', { class: 'prism-fringe prism-fringe-c' }, body);
  const fm = el('line', { class: 'prism-fringe prism-fringe-m' }, body);
  const edge = el('path', { class: 'prism-edge', pathLength: 1 }, body);
  const glint = el('circle', { class: 'prism-glint', r: 2.5 }, body);

  /**
   * @param {import('../types.js').Viewport} vp
   * @param {{ rot: number; spread: number; s: number; fan: number; prism: number; shift: number;
   *   draw: number; glass: number; beam: number; glintSlide?: number }} o
   */
  function set(vp, o) {
    const g = prismGeom(vp, o.rot);
    const ws = wedges(vp, o.rot, o.spread, o.s);
    const fill = 0.92 + 0.08 * o.s;
    ws.forEach((q, i) => setAttrs(wedgePaths[i], { d: pathOf(q), 'fill-opacity': fin(fill) }));
    setStyles(fan, { opacity: fin(o.fan) });

    setStyles(body, { opacity: fin(o.prism), transform: o.shift ? `translateX(${fin(o.shift)}px)` : null });
    setAttrs(glass, { d: pathOf(g.pts), opacity: fin(o.glass) });
    setAttrs(edge, { d: pathOf(g.pts), 'stroke-dasharray': 1, 'stroke-dashoffset': fin(1 - o.draw) });
    const inset = (/** @type {number} */ i, /** @type {number} */ j, /** @type {number} */ k) => {
      const c = [g.cu, g.cv];
      const p = (/** @type {number[]} */ v) => [v[0] + (c[0] - v[0]) * k, v[1] + (c[1] - v[1]) * k];
      const a = p(g.pts[i]);
      const b = p(g.pts[j]);
      return { x1: fin(a[0]), y1: fin(a[1]), x2: fin(b[0]), y2: fin(b[1]), opacity: fin(o.glass) };
    };
    setAttrs(fc, inset(2, 0, 0.08));
    setAttrs(fm, inset(0, 1, 0.08));

    const bx = g.entry[0] * o.beam;
    const by = g.entry[1];
    setAttrs(beam, { x1: 0, y1: fin(by), x2: fin(bx), y2: fin(by) });
    setAttrs(under, { x1: 0, y1: fin(by + 1.5), x2: fin(bx), y2: fin(by + 1.5) });
    const slide = o.glintSlide ?? 0;
    setAttrs(glint, {
      cx: fin(g.entry[0] + (g.pts[0][0] - g.pts[2][0]) * slide),
      cy: fin(g.entry[1] + (g.pts[0][1] - g.pts[2][1]) * slide),
      opacity: fin(o.beam >= 1 ? 1 : 0),
    });
  }

  return { set };
}
