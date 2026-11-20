// The shared-component gallery (WO-004). Two modes:
//   /__dev/components/index.html                 every fixture as a live panel
//   /__dev/components/index.html?solo=<id>       one fixture, full window, at (0, 0)
// Solo mode also takes `ground=<name>` (see GROUNDS) and `blend=normal|screen`
// for the dev e2e's pixel scans. `window.__gallery` exposes what was drawn.

import { createBands } from '../../site/js/components/bands-dom.js';
import { createDotGrid } from '../../site/js/components/dotgrid-svg.js';
import { createWhitePoint } from '../../site/js/components/white-point.js';
import { el, setAttrs, setStyles } from '../../site/js/components/svg.js';
import { bandRects, bandRectsFromWeights, dotGrid, viewport } from '../../site/js/core/geometry.js';
import { FIXTURES, GROUNDS, groundCss } from './fixtures.js';

/**
 * @typedef {import('../../site/js/types.js').Viewport} Viewport
 * @typedef {import('./fixtures.js').Fixture} Fixture
 * @typedef {import('./fixtures.js').Layer} Layer
 * @typedef {{ layer: Layer, instance: { set: Function } }} Drawn
 */

/** Panel size in CSS px: a 16:10 mini viewport, even so 1.5× lands on whole device px. */
const PANEL = { w: 416, h: 260 };
/** WhitePoint loupe: 112 px window at 8× (vector, not pixels). */
const LOUPE = { size: 112, zoom: 8 };

/**
 * Draw a fixture's layers into `art`, a positioned U×V box.
 * @param {HTMLElement} art
 * @param {Fixture} fixture
 * @param {Viewport} vp
 * @param {string} prefix id prefix, unique per drawing
 * @param {{ ground?: string, blend?: 'normal' | 'screen' }} [override]
 * @returns {Drawn[]}
 */
function draw(art, fixture, vp, prefix, override = {}) {
  setStyles(art, { 'background-color': groundCss(override.ground ?? fixture.ground) });
  /** @type {SVGSVGElement | null} */
  let svg = null;
  const overlay = () => {
    if (!svg) {
      svg = el('svg', { class: 'overlay', width: vp.U, height: vp.V, 'aria-hidden': 'true', focusable: 'false' }, art);
    }
    return svg;
  };
  return fixture.layers(vp).map((layer, i) => {
    const idPrefix = `${prefix}-${i}`;
    if (layer.kind === 'bands') {
      const instance = createBands(art, { blend: override.blend ?? layer.blend, idPrefix });
      instance.set(layer.rects, vp, layer.opacities);
      return { layer, instance };
    }
    if (layer.kind === 'dots') {
      const instance = createDotGrid(overlay(), { idPrefix });
      instance.set(layer.dg, vp);
      return { layer, instance };
    }
    const instance = createWhitePoint(layer.host === 'svg' ? overlay() : art);
    instance.set(layer.wp, layer.ring);
    return { layer, instance };
  });
}

/**
 * An 8× vector loupe on the panel's white point, in the panel's top-right corner.
 * @param {HTMLElement} art
 * @param {Fixture} fixture
 * @param {Viewport} vp
 */
function loupe(art, fixture, vp) {
  const point = fixture.layers(vp).find((layer) => layer.kind === 'point');
  if (!point || point.kind !== 'point' || !point.wp) return;
  const span = LOUPE.size / LOUPE.zoom;
  const box = el('div', { class: 'loupe', 'aria-hidden': 'true' }, art);
  const svg = el('svg', {
    width: LOUPE.size,
    height: LOUPE.size,
    viewBox: `${point.wp.u - span / 2} ${point.wp.v - span / 2} ${span} ${span}`,
  }, box);
  const ground = el('rect', { x: point.wp.u - span, y: point.wp.v - span, width: 2 * span, height: 2 * span }, svg);
  setStyles(ground, { fill: groundCss(fixture.ground) });
  createWhitePoint(svg).set(point.wp, point.ring);
  el('span', { class: 'loupe-label' }, box).textContent = `×${LOUPE.zoom}`;
}

/** @param {Fixture} fixture @param {Viewport} vp */
function describe(fixture, vp) {
  return fixture.layers(vp).map((layer) => {
    if (layer.kind === 'bands') {
      const widths = layer.rects.map((r) => Math.round((r.u1 - r.u0) * 10) / 10);
      return `bands ${layer.blend}: ${widths.join(' / ')} px`;
    }
    if (layer.kind === 'dots') {
      const { pitch, vertexInk, fillInk, vertexWhite, fillWhite } = layer.dg;
      return `dots pitch ${pitch}: ink ${vertexInk}/${fillInk}, white ${vertexWhite}/${fillWhite}`;
    }
    return layer.wp ? `point r ${layer.wp.r}, ring ${layer.ring}` : 'point hidden';
  }).join(' · ');
}

/** @param {HTMLElement} root */
function grid(root) {
  const vp = viewport(PANEL.w, PANEL.h, window.devicePixelRatio);
  /** @type {Record<string, Drawn[]>} */
  const drawn = {};
  for (const component of ['Bands', 'DotGrid', 'WhitePoint']) {
    const section = el('section', { class: 'row', 'aria-labelledby': `h-${component}` }, root);
    el('h2', { id: `h-${component}` }, section).textContent = component;
    const panels = el('div', { class: 'panels' }, section);
    for (const fixture of FIXTURES.filter((f) => f.component === component)) {
      const figure = el('figure', { class: 'panel', 'data-fixture': fixture.id }, panels);
      const art = el('div', { class: 'art', role: 'img', 'aria-label': `${component}: ${fixture.title}` }, figure);
      setStyles(art, { width: `${vp.U}px`, height: `${vp.V}px` });
      drawn[fixture.id] = draw(art, fixture, vp, `g-${fixture.id}`);
      if (component === 'WhitePoint') loupe(art, fixture, vp);
      const caption = el('figcaption', {}, figure);
      el('strong', {}, caption).textContent = fixture.title;
      el('span', { class: 'from' }, caption).textContent = fixture.from;
      el('code', {}, caption).textContent = describe(fixture, vp);
    }
  }
  return { vp, drawn };
}

/**
 * @param {HTMLElement} root
 * @param {Fixture} fixture
 * @param {URLSearchParams} params
 */
function solo(root, fixture, params) {
  document.documentElement.dataset.mode = 'solo';
  const vp = viewport(window.innerWidth, window.innerHeight, window.devicePixelRatio);
  const ground = params.get('ground');
  const blend = params.get('blend');
  const art = el('div', { class: 'art art--solo', role: 'img', 'aria-label': `${fixture.component}: ${fixture.title}` }, root);
  setStyles(art, {
    width: `${vp.U}px`,
    height: `${vp.V}px`,
    // The same (u, v) transpose the stage uses in portrait (K5).
    transform: vp.landscape ? null : 'matrix(0, 1, 1, 0, 0, 0)',
  });
  const override = {
    ground: ground !== null && GROUNDS.includes(ground) ? ground : undefined,
    blend: blend === 'normal' || blend === 'screen' ? /** @type {'normal' | 'screen'} */ (blend) : undefined,
  };
  return { vp, drawn: { [fixture.id]: draw(art, fixture, vp, `s-${fixture.id}`, override) } };
}

const params = new URLSearchParams(window.location.search);
const root = /** @type {HTMLElement} */ (document.getElementById('gallery'));
const soloId = params.get('solo');
const fixture = soloId === null ? null : FIXTURES.find((f) => f.id === soloId) ?? null;
if (soloId !== null && !fixture) {
  el('p', { class: 'missing' }, root).textContent = `No fixture "${soloId}". Known: ${FIXTURES.map((f) => f.id).join(', ')}.`;
}
const result = fixture ? solo(root, fixture, params) : grid(root);

Object.assign(window, {
  __gallery: {
    ready: true,
    mode: fixture ? 'solo' : 'grid',
    vp: result.vp,
    fixtures: FIXTURES.map((f) => f.id),
    drawn: result.drawn,
    components: { createBands, createDotGrid, createWhitePoint, el, setAttrs, setStyles },
    geometry: { bandRects, bandRectsFromWeights, dotGrid, viewport },
  },
});
document.documentElement.dataset.ready = 'true';
