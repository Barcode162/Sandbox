// The `Bands` component: the seven spectrum bands as DOM boxes (§4 Scenes 1,
// 2 and 5; §21). Scenes that hand off through bands draw the same
// `BandRect[]` through this one renderer, so their pixels agree.
//
// Each band is one flat box (§13.4: no gradients) sized once to the U×V frame
// and placed per call by `translate(u0, v0) scale(w/U, h/V)` with origin 0 0.
// Per call only `transform` and `opacity` change; the box size is written
// again only when the viewport's U or V changes. Edges are snapped to device
// pixels (#4), and a shared edge snaps to the same value on both sides, so
// adjacent bands neither gap nor overlap at any DPR.
//
// The group is isolated, so with `blend: 'screen'` the bands screen against
// each other only and then composite normally over whatever lies beneath
// (Scene 5's ink room). A lone band therefore keeps its exact token colour.

import { el, setStyles } from './svg.js';
import { snap } from '../core/geometry.js';

export const BAND_COUNT = 7;

/**
 * @typedef {import('../types.js').BandRect} BandRect
 * @typedef {import('../types.js').Viewport} Viewport
 * @typedef {{ blend?: 'normal' | 'screen', idPrefix: string }} BandsOptions
 * @typedef {{ el: HTMLDivElement, set(rects: BandRect[], vp: Viewport, opacities?: number[]): void }} Bands
 */

/**
 * @param {Element} parent a positioned box in (u, v) space, normally the scene's `.uv`
 * @param {BandsOptions} options
 * @returns {Bands}
 */
export function createBands(parent, { blend = 'normal', idPrefix }) {
  if (blend !== 'normal' && blend !== 'screen') throw new RangeError(`createBands: unknown blend "${blend}"`);
  const root = el('div', { id: `${idPrefix}-bands`, class: 'bands', 'data-blend': blend }, parent);
  setStyles(root, {
    position: 'absolute',
    left: '0',
    top: '0',
    isolation: 'isolate',
    'pointer-events': 'none',
  });

  /** @type {HTMLDivElement[]} */
  const boxes = [];
  for (let i = 0; i < BAND_COUNT; i++) {
    const box = el('div', { class: 'band', 'data-band': i + 1 }, root);
    setStyles(box, {
      position: 'absolute',
      left: '0',
      top: '0',
      'transform-origin': '0 0',
      'background-color': `var(--band-${i + 1})`,
      'mix-blend-mode': blend === 'screen' ? 'screen' : null,
    });
    boxes.push(box);
  }

  return {
    el: root,
    set(rects, vp, opacities) {
      if (rects.length !== BAND_COUNT) throw new RangeError(`Bands.set: expected ${BAND_COUNT} rects, got ${rects.length}`);
      if (opacities && opacities.length !== BAND_COUNT) throw new RangeError(`Bands.set: expected ${BAND_COUNT} opacities, got ${opacities.length}`);
      const { U, V, dpr } = vp;
      const size = { width: `${U}px`, height: `${V}px` };
      setStyles(root, size);
      for (let i = 0; i < BAND_COUNT; i++) {
        const r = rects[i];
        const u0 = snap(r.u0, dpr);
        const u1 = snap(r.u1, dpr);
        const v0 = snap(r.v0, dpr);
        const v1 = snap(r.v1, dpr);
        if (u1 < u0 || v1 < v0) throw new RangeError(`Bands.set: band ${i + 1} has negative extent`);
        setStyles(boxes[i], {
          ...size,
          transform: `translate(${u0}px, ${v0}px) scale(${(u1 - u0) / U}, ${(v1 - v0) / V})`,
          opacity: opacities ? opacities[i] : 1,
        });
      }
    },
  };
}
