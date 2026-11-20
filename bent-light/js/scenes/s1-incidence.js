// scenes/s1-incidence.js: Scene 1 *Incidence* (spec §4 Scene 1, 220 svh).
//
// A glass prism on a spotlit gallery wall turns, and the small spectrum card it throws opens into a
// fan that fills the wall. The fan's rays then stand up into seven full-bleed bands, which is
// exactly Scene 2 at p = 0. The title prints out of register as the light starts to move.

import { clamp, fin, glide, lead, r, settle } from '../core/math.js';
import { SCENES, bandRects } from '../core/geometry.js';
import { el, setAttrs, setStyles } from '../components/svg.js';
import { createPrism } from './prism-svg.js';

/** @type {import('../types.js').SceneMeta} */
export const meta = SCENES[0];

const BREATHE_SPREAD = 1.5;
const BREATHE_S = 8;

/**
 * PURE (K6).
 * @param {number} p
 * @param {import('../types.js').Viewport} vp
 * @returns {import('../types.js').SceneState}
 */
export function state(p, vp) {
  const q = clamp(fin(p), 0, 1);
  const rot = 22 * settle(r(q, 0, 0.5));
  const spread = 6 + 52.5 * lead(r(q, 0, 0.45)) + 1.5 * r(q, 0.45, 0.6);
  const split = 14 * settle(r(q, 0, 0.25));
  const titleOpacity = 1 - r(q, 0.22, 0.4);
  const cueOpacity = 1 - r(q, 0, 0.06);
  const s = glide(r(q, 0.6, 1));
  const prismOpacity = 1 - r(q, 0.72, 0.9);
  const prismShift = -0.18 * vp.U * r(q, 0.72, 0.9);
  const done = q >= 1;
  return {
    scene: 1,
    p: q,
    params: {
      rot: fin(rot),
      spread: fin(spread),
      split: fin(split),
      titleOpacity: fin(titleOpacity),
      cueOpacity: fin(cueOpacity),
      s: fin(s),
      prismOpacity: fin(prismOpacity),
      prismShift: fin(prismShift),
    },
    geom: {
      ground: done ? 'bands' : 'wall',
      bandRects: done ? bandRects(vp) : null,
      dotGrid: null,
      whitePoint: null,
      shelf: null,
      channelScales: null,
      glassAlpha: 0,
      beamRect: null,
      otherOpacity: fin(Math.max(prismOpacity, titleOpacity)),
    },
  };
}

/**
 * @param {import('../types.js').SceneHost} host
 * @returns {import('../types.js').SceneView}
 */
export function mount(host) {
  let vp = host.vp;
  const prefix = `scene1-${host.instance}`;
  const root = el('div', { class: 's1-incidence', 'data-instance': host.instance }, host.uv);
  const svg = /** @type {SVGSVGElement} */ (el('svg', { class: 's1-svg', 'aria-hidden': 'true', focusable: 'false' }, root));
  const prism = createPrism(svg, prefix);
  const title = host.section.querySelector('.title');
  const plates = [...host.section.querySelectorAll('.plate')];
  const subtitle = host.section.querySelector('.subtitle');
  const cue = host.section.querySelector('.cue');
  const size = (/** @type {import('../types.js').Viewport} */ v) => setAttrs(svg, { width: v.U, height: v.V, viewBox: `0 0 ${v.U} ${v.V}` });
  size(vp);

  return {
    apply(st, amb) {
      const k = st.params;
      const wave = amb.a > 0 ? amb.a * Math.sin((2 * Math.PI * amb.t) / BREATHE_S) : 0;
      prism.set(vp, {
        rot: k.rot,
        spread: k.spread + BREATHE_SPREAD * wave * (1 - k.s),
        s: k.s,
        fan: 1,
        prism: k.prismOpacity,
        shift: k.prismShift,
        draw: 1,
        glass: 1,
        beam: 1,
        glintSlide: 0.06 * wave,
      });
      setStyles(root, { '--wall-alpha': fin(1 - k.s) });
      const o = fin(k.titleOpacity);
      if (title instanceof HTMLElement) title.style.opacity = String(o);
      if (subtitle instanceof HTMLElement) subtitle.style.opacity = String(o);
      if (cue instanceof HTMLElement) cue.style.opacity = String(fin(k.cueOpacity));
      const d = k.split;
      const offs = [[-d * 0.7, -d * 0.7], [d, 0], [0, d]];
      plates.forEach((pl, i) => {
        if (!(pl instanceof HTMLElement)) return;
        pl.style.opacity = String(o);
        pl.style.transform = d ? `translate(${fin(offs[i][0])}px, ${fin(offs[i][1])}px)` : '';
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
