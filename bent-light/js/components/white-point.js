// The `WhitePoint` component: the one small mark of where the white light is
// (§3.4, F16). A `--beam` disc of radius `r` with a 1 px ring just outside it.
//
// The ring is a circle of radius r + 1 drawn under the disc, so only a 1 px
// annulus of it shows. The disc and ring share one group whose opacity is
// `alpha`, so the ring never shows through the disc as it fades.
//
// The disc diameter never exceeds 6 px (#41): a larger `r` is clamped to 3.
// The ring adds 1 px on each side, outside the disc.

import { SVG_NS, el, setAttrs, setStyles } from './svg.js';

/**
 * @typedef {import('../types.js').WhitePointState} WhitePointState
 * @typedef {'ink25' | 'ink40' | 'wallDeep'} Ring
 * @typedef {{ el: SVGElement, set(wp: WhitePointState | null, ring: Ring): void }} WhitePoint
 */

/** Largest disc radius in px: a 6 px diameter, per §3.4 and #41. */
export const WHITE_POINT_MAX_R = 3;

/** The three rings of §3.4: Scene 2–3's centre dot, the rail's leading dot, and Scene 1's glint. */
const RINGS = {
  ink25: { fill: 'var(--ink)', alpha: 0.25 },
  ink40: { fill: 'var(--ink)', alpha: 0.4 },
  wallDeep: { fill: 'var(--wall-deep)', alpha: 1 },
};

/**
 * @param {Element} parent an SVG element in (u, v) space, or a positioned HTML
 *   box (the point is then placed in a 1 px overflow-visible SVG at its
 *   top-left corner, so u and v are px from that corner; a zero-size SVG
 *   would not render at all)
 * @returns {WhitePoint}
 */
export function createWhitePoint(parent) {
  const inSvg = parent.namespaceURI === SVG_NS;
  /** @type {SVGElement} */
  let host;
  if (inSvg) {
    host = el('g', { class: 'white-point' }, parent);
  } else {
    host = el('svg', { class: 'white-point', width: 1, height: 1, 'aria-hidden': 'true', focusable: 'false' }, parent);
    setStyles(host, { position: 'absolute', left: '0', top: '0', overflow: 'visible', 'pointer-events': 'none' });
  }
  const group = inSvg ? host : el('g', {}, host);
  const ring = el('circle', {}, group);
  const disc = el('circle', {}, group);
  setStyles(disc, { fill: 'var(--beam)' });
  setAttrs(group, { visibility: 'hidden', opacity: 0 });

  return {
    el: host,
    set(wp, ringName) {
      const tone = RINGS[ringName];
      if (!tone) throw new RangeError(`WhitePoint.set: unknown ring "${ringName}"`);
      if (wp === null || !(wp.alpha > 0) || !(wp.r > 0)) {
        setAttrs(group, { visibility: 'hidden', opacity: 0 });
        return;
      }
      const r = Math.min(wp.r, WHITE_POINT_MAX_R);
      setStyles(ring, { fill: tone.fill, 'fill-opacity': tone.alpha });
      setAttrs(ring, { cx: wp.u, cy: wp.v, r: r + 1 });
      setAttrs(disc, { cx: wp.u, cy: wp.v, r });
      setAttrs(group, { visibility: null, opacity: Math.min(wp.alpha, 1) });
    },
  };
}
