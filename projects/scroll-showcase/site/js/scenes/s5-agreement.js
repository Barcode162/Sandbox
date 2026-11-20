// scenes/s5-agreement.js: Scene 5 *Agreement*, the climax (spec §4 Scene 5).
//
// Seven screen-blended band divs on an ink room narrow into beams (`n`),
// converge on the centre with an overshoot (`tau`), carry ink hairlines while
// neighbours first touch (`hair`), and are finished by one white overlay (`ov`),
// so p = 1 is exact #FFFFFF. The overlay is needed because the computed
// seven-way screen sum of the band tokens is #FFFEFF (§13.1).
//
// Geometry, exactly at the endpoints:
// - p 0: the beam rects equal `bandRects(vp)` bit for bit (the snapped chorus;
//   lerp returns its start exactly), so the 4 → 5 seam holds (§5.2).
// - p 1: every beam and the overlay share one rect, U/2 ± beamW/2, snapped to
//   device pixels once, so the whole drawn beam is white with no fringe column.
// In between, each beam edge moves from its snapped band edge (n) and then toward
// the centre (tau), and is snapped again by the Bands component (#4).

import { clamp, fin, glide, keys, lerp, lin, r, smooth } from '../core/math.js';
import { SCENES, bandRects, beamW, snap } from '../core/geometry.js';
import { createBands, BAND_COUNT } from '../components/bands-dom.js';
import { el, setStyles } from '../components/svg.js';

/** @typedef {import('../types.js').SceneState} SceneState */
/** @typedef {import('../types.js').Viewport} Viewport */
/** @typedef {import('../types.js').SceneHost} SceneHost */
/** @typedef {import('../types.js').SceneView} SceneView */
/** @typedef {import('../types.js').BandRect} BandRect */
/** @typedef {import('../types.js').AmbientSample} AmbientSample */

/** @type {import('../types.js').SceneMeta} */
export const meta = SCENES[4];

/** The beam colour at p 1 (§5.2 5 → 6 seam). */
const WHITE = '#FFFFFF';

/** Breathing (§7.8): beams sway ±4 px, alternating direction; at p 1 the beam's edges breathe ±1 px. */
const SWAY_PX = 4;
const EDGE_PX = 1;
const PERIOD_S = 9;

/**
 * Convergence (§4): the outer key list carries the hold creep (+0.035 across
 * p .25–.40) and the travel to the overshoot (1.074 at p .88); the settle list
 * brings it back to exactly 1 at p 1.
 * @type {ReadonlyArray<readonly [number, number] | readonly [number, number, (t: number) => number]>}
 */
const TAU_KEYS = [[0.25, 0], [0.4, 0.035, lin], [0.88, 1.074]];
/** @type {ReadonlyArray<readonly [number, number] | readonly [number, number, (t: number) => number]>} */
const TAU_SETTLE = [[0.88, 1.074], [1, 1, smooth]];

/**
 * The §4 driving parameters.
 * @param {number} p
 */
function params(p) {
  return {
    n: fin(glide(r(p, 0, 0.25))),
    tau: fin(p < 0.88 ? keys(p, TAU_KEYS) : keys(p, TAU_SETTLE)),
    hair: fin(r(p, 0.4, 0.46) * (1 - r(p, 0.64, 0.7))),
    ov: fin(r(p, 0.93, 1)),
  };
}

/**
 * Move `from` toward `to` by t (t may exceed 1: the overshoot). Exact at both
 * ends, and a point already on the target never moves (jade, i = 3).
 * @param {number} from
 * @param {number} to
 * @param {number} t
 */
function toward(from, to, t) {
  return from === to ? to : lerp(from, to, t);
}

/**
 * PURE (K6). Scene 5 at local progress p.
 * @param {number} p  local progress, clamped to [0, 1] by the caller
 * @param {Viewport} vp
 * @returns {SceneState}
 */
export function state(p, vp) {
  const pp = fin(clamp(p, 0, 1));
  const prm = params(pp);
  const { n, tau, hair, ov } = prm;
  const { U, V, dpr } = vp;
  const h = U / 2;
  const bw = beamW(vp);
  const base = bandRects(vp);

  /** @type {{ centreU: number, width: number }[]} */
  const beams = [];
  /** @type {BandRect[]} */
  const rects = [];
  for (let i = 0; i < BAND_COUNT; i++) {
    // Band i's centre and the spec width W = lerp(U/7, beamW, n) (§4).
    const c = ((2 * i + 1) * U) / 14;
    const w = lerp(U / 7, bw, n);
    beams.push({ centreU: fin(toward(c, h, tau)), width: fin(w) });
    // Drawn edges: from the snapped band edge to the beam edge (n), then toward
    // the centred beam edge (tau). At tau = 1 and n = 1 every beam lands on
    // exactly h ± bw/2, so all seven snap to the same device pixels.
    const a0 = lerp(base[i].u0, c - bw / 2, n);
    const a1 = lerp(base[i].u1, c + bw / 2, n);
    rects.push({
      u0: fin(snap(toward(a0, h - w / 2, tau), dpr)),
      u1: fin(snap(toward(a1, h + w / 2, tau), dpr)),
      v0: 0,
      v1: fin(V),
    });
  }

  // The white beam exists as such only once the colours have agreed (p 1).
  const agreed = ov === 1 && tau === 1;
  return {
    scene: 5,
    p: pp,
    params: prm,
    geom: {
      ground: pp === 0 ? 'bands' : 'ink',
      bandRects: rects,
      dotGrid: null,
      whitePoint: null,
      shelf: null,
      channelScales: null,
      glassAlpha: 0,
      beamRect: agreed ? { centreU: fin(h), width: fin(bw), v0: 0, v1: fin(V), color: WHITE } : null,
      // Hairlines, and the overlay while it is not yet the agreed beam.
      otherOpacity: fin(Math.max(hair, agreed ? 0 : ov)),
    },
    beams,
    beamW: fin(bw),
  };
}

/**
 * Builds the ink room, the seven screen bands, seven hairlines and the white
 * overlay inside .uv. `apply` writes only `transform` and `opacity` per frame
 * (box sizes are rewritten only when U or V changes, through the write cache).
 * @param {SceneHost} host
 * @returns {SceneView}
 */
export function mount(host) {
  const prefix = `scene5-${host.instance}`;
  // The root is the ink room (its background); everything else draws over it.
  const root = el('div', { id: `${prefix}-root`, class: 's5', 'data-instance': host.instance }, host.uv);
  const bands = createBands(root, { blend: 'screen', idPrefix: prefix });
  const hairs = el('div', { id: `${prefix}-hairs`, class: 's5-hairs' }, root);
  /** @type {HTMLDivElement[]} */
  const hairBoxes = [];
  for (let i = 0; i < BAND_COUNT; i++) hairBoxes.push(el('div', { class: 's5-hair', 'data-band': i + 1 }, hairs));
  const overlay = el('div', { id: `${prefix}-overlay`, class: 's5-overlay' }, root);

  let vp = host.vp;

  return {
    apply(s, amb) {
      const { U, V, dpr } = vp;
      const size = { width: `${U}px`, height: `${V}px` };
      setStyles(root, size);

      const { hair, ov } = s.params;
      const rects = /** @type {BandRect[]} */ (s.geom.bandRects);
      const h = U / 2;
      const bw = /** @type {number} */ (s.beamW);

      // Breathing (§7.8), additive and amplitude-scaled; a = 0 gives exactly
      // `s`. The sway hands over to the edge breath as the overlay arrives, so
      // the agreed beam never shows a swayed fringe.
      const wave = amb.a === 0 ? 0 : amb.a * Math.sin((2 * Math.PI * amb.t) / PERIOD_S);
      const sway = SWAY_PX * wave * (1 - ov);
      const edge = EDGE_PX * wave * ov;

      /** @type {BandRect[]} */
      const drawn = [];
      for (let i = 0; i < BAND_COUNT; i++) {
        const d = i % 2 === 0 ? sway : -sway;
        const b = rects[i];
        drawn.push(wave === 0 ? b : { u0: b.u0 + d - edge, u1: b.u1 + d + edge, v0: b.v0, v1: b.v1 });
        const hu = snap(drawn[i].u0, dpr);
        setStyles(hairBoxes[i], { height: `${V}px`, transform: `translate(${hu}px, 0px)` });
      }
      bands.set(drawn, vp);
      setStyles(hairs, { opacity: hair });

      // The overlay is the final beam rect, snapped once on both edges (#10).
      const o0 = snap(h - bw / 2 - edge, dpr);
      const o1 = snap(h + bw / 2 + edge, dpr);
      setStyles(overlay, {
        ...size,
        transform: `translate(${o0}px, 0px) scale(${(o1 - o0) / U}, 1)`,
        opacity: ov,
      });
    },
    resize(next) {
      vp = next;
    },
    destroy() {
      root.remove();
    },
  };
}
