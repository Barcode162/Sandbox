// scenes/s6-return.js: Scene 6 *Return* (spec §4 Scene 6, 180 svh; release).
//
// The single white beam from Scene 5 widens into a doorway and then into the whole gallery wall.
// After a rest on the empty wall, the prism is drawn again in fine line, its glass fills in, the
// beam reaches it and the small spectrum card unfolds: Scene 1's opening frame, without the title.

import { clamp, fin, glide, lerp, r } from '../core/math.js';
import { SCENES, beamW } from '../core/geometry.js';
import { TOKENS } from '../core/tokens.js';
import { el, setAttrs, setStyles } from '../components/svg.js';
import { createPrism } from './prism-svg.js';

/** @type {import('../types.js').SceneMeta} */
export const meta = SCENES[5];

const BREATHE_SPOT = 0.03;
const BREATHE_S = 11;

/** @param {[number, number, number]} a @param {[number, number, number]} b @param {number} t */
const mixHex = (a, b, t) =>
  `#${a.map((x, i) => Math.round(lerp(x, b[i], t)).toString(16).padStart(2, '0')).join('')}`;

/**
 * PURE (K6).
 * @param {number} p
 * @param {import('../types.js').Viewport} vp
 * @returns {import('../types.js').SceneState}
 */
export function state(p, vp) {
  const q = clamp(fin(p), 0, 1);
  const widen = glide(r(q, 0, 0.4));
  const mix = glide(r(q, 0.05, 0.4));
  const spot = r(q, 0.3, 0.4);
  const draw = glide(r(q, 0.52, 0.74));
  const beam = glide(r(q, 0.64, 0.8));
  const glass = r(q, 0.7, 0.84);
  const card = glide(r(q, 0.8, 0.96));
  const width = lerp(beamW(vp), vp.U, widen);
  const color = mixHex(TOKENS.beam.rgb, TOKENS.wall.rgb, mix);
  return {
    scene: 6,
    p: q,
    params: { widen: fin(widen), mix: fin(mix), spot: fin(spot), draw: fin(draw), beam: fin(beam), glass: fin(glass), card: fin(card) },
    geom: {
      ground: widen >= 1 ? 'wall' : 'ink',
      bandRects: null,
      dotGrid: null,
      whitePoint: null,
      shelf: null,
      channelScales: null,
      glassAlpha: fin(glass),
      beamRect: { centreU: vp.U / 2, width: fin(width), v0: 0, v1: vp.V, color },
      otherOpacity: fin(Math.max(draw, card)),
    },
  };
}

/**
 * @param {import('../types.js').SceneHost} host
 * @returns {import('../types.js').SceneView}
 */
export function mount(host) {
  let vp = host.vp;
  const root = el('div', { class: 's6-return', 'data-instance': host.instance }, host.uv);
  const door = el('div', { class: 's6-beam' }, root);
  const spot = el('div', { class: 's6-spot' }, root);
  const svg = /** @type {SVGSVGElement} */ (el('svg', { class: 's6-svg', 'aria-hidden': 'true', focusable: 'false' }, root));
  const prism = createPrism(svg, `scene6-${host.instance}`);
  const size = (/** @type {import('../types.js').Viewport} */ v) => setAttrs(svg, { width: v.U, height: v.V, viewBox: `0 0 ${v.U} ${v.V}` });
  size(vp);

  return {
    apply(st, amb) {
      const k = st.params;
      const b = /** @type {import('../types.js').BeamRect} */ (st.geom.beamRect);
      const wave = amb.a > 0 ? amb.a * Math.sin((2 * Math.PI * amb.t) / BREATHE_S) : 0;
      setStyles(door, {
        transform: `translateX(${fin(b.centreU - b.width / 2)}px) scaleX(${fin(b.width / vp.U)})`,
        'background-color': b.color,
      });
      setStyles(spot, { opacity: fin(k.spot), transform: wave ? `scale(${fin(1 + BREATHE_SPOT * wave)})` : null });
      prism.set(vp, {
        rot: 0,
        spread: 6 * k.card + (k.draw > 0 ? 1.5 * wave : 0),
        s: 0,
        fan: k.card,
        prism: 1,
        shift: 0,
        draw: k.draw,
        glass: k.glass,
        beam: k.beam,
        glintSlide: k.draw > 0 ? 0.06 * wave : 0,
      });
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
