// The `DotGrid` component (§4 Scene 2; Scenes 3 and 4 inherit it; §21).
//
// The grid has two disjoint subsets of one pitch-spaced lattice:
// - vertex dots: every other dot in both axes, a 2·pitch lattice through
//   (originU, originV). Scene 4's facet lattice uses exactly these points.
// - fill dots: every other pitch position.
// Each subset is drawn in an ink tone (`--ink`) and a white tone (`--beam`),
// so there are four `<pattern>` fills and four full-frame rects, each with its
// own opacity from `DotGridState`.
//
// One pattern tile is 2·pitch square and starts half a pitch before a vertex
// dot, so every dot sits at least pitch/2 from a tile edge and no dot is ever
// cut by tiling. Pattern ids carry `idPrefix`, so several grids (scenes and
// their reduced-motion `a`/`b` instances) coexist in one document.

import { el, setAttrs, setStyles } from './svg.js';

/**
 * @typedef {import('../types.js').DotGridState} DotGridState
 * @typedef {import('../types.js').Viewport} Viewport
 * @typedef {'vertex' | 'fill'} Subset
 * @typedef {'ink' | 'white'} Tone
 * @typedef {{ set(dg: DotGridState, vp: Viewport): void }} DotGrid
 */

/** Draw order: the ink shadow first, then the white tones over it. */
const LAYERS = /** @type {const} */ ([
  ['vertex', 'ink', 'vertexInk'],
  ['fill', 'ink', 'fillInk'],
  ['vertex', 'white', 'vertexWhite'],
  ['fill', 'white', 'fillWhite'],
]);

const TONE_FILL = { ink: 'var(--ink)', white: 'var(--beam)' };

/**
 * Dot centres inside one tile, in units of pitch. The vertex dot is at
 * (½, ½); the three fill dots are one pitch to its right, below, and both.
 * @type {Record<Subset, ReadonlyArray<readonly [number, number]>>}
 */
const TILE_DOTS = {
  vertex: [[0.5, 0.5]],
  fill: [[1.5, 0.5], [0.5, 1.5], [1.5, 1.5]],
};

/**
 * @param {SVGElement} svg the SVG in (u, v) space that the grid draws into
 * @param {{ idPrefix: string }} options
 * @returns {DotGrid}
 */
export function createDotGrid(svg, { idPrefix }) {
  const defs = el('defs', {}, svg);
  const group = el('g', { class: 'dotgrid', 'data-dotgrid': idPrefix }, svg);

  const layers = LAYERS.map(([subset, tone, key]) => {
    const id = `${idPrefix}-dots-${subset}-${tone}`;
    const pattern = el('pattern', { id, patternUnits: 'userSpaceOnUse' }, defs);
    const dots = TILE_DOTS[subset].map(([tu, tv]) => {
      const dot = el('circle', {}, pattern);
      setStyles(dot, { fill: TONE_FILL[tone] });
      return { dot, tu, tv };
    });
    const rect = el('rect', { x: 0, y: 0, fill: `url(#${id})`, 'data-subset': subset, 'data-tone': tone }, group);
    return { key, pattern, dots, rect };
  });

  return {
    set(dg, vp) {
      const { pitch, r } = dg;
      if (!(pitch > 0)) throw new RangeError(`DotGrid.set: pitch must be positive, got ${pitch}`);
      const tile = 2 * pitch;
      for (const { key, pattern, dots, rect } of layers) {
        setAttrs(pattern, {
          x: dg.originU - pitch / 2,
          y: dg.originV - pitch / 2,
          width: tile,
          height: tile,
        });
        for (const { dot, tu, tv } of dots) setAttrs(dot, { cx: tu * pitch, cy: tv * pitch, r });
        const alpha = dg[key];
        setAttrs(rect, {
          width: vp.U,
          height: vp.V,
          opacity: alpha,
          visibility: alpha > 0 ? null : 'hidden',
        });
      }
    },
  };
}
