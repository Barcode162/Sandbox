// scenes/s4-dichroic.js: Scene 4 *Dichroic*. WO-001 STUB, replaced by WO-010.
// It satisfies the C3 SceneModule contract so the engine, harness and tests run end to end:
// `meta` equals SCENES[3] (a local literal until core/geometry.js is imported), `state()` is pure
// and returns a valid SceneState with null geometry, and `mount()` paints one flat band colour.

/** @typedef {import('../types.js').SceneState} SceneState */
/** @typedef {import('../types.js').Viewport} Viewport */
/** @typedef {import('../types.js').SceneHost} SceneHost */
/** @typedef {import('../types.js').SceneView} SceneView */

/** @type {import('../types.js').SceneMeta} */
export const meta = { id: 4, slug: 'dichroic', name: 'Dichroic', track: 320, hold: [0.44, 0.56], creep: 'theta' };

/** The §4 driving parameters, named exactly as in C1. */
const PARAMS = ['J', 'theta', 'facetAlpha', 'edgeAlpha', 'quant', 'bandsAlpha', 'glassAlpha', 'fillDots', 'vertexDots', 'rho', 'wpAlpha'];

/**
 * PURE (K6). Stub: every driving parameter is 0 and every seam field is absent.
 * @param {number} p  local progress, clamped to [0, 1] by the caller
 * @param {Viewport} vp
 * @returns {SceneState}
 */
export function state(p, vp) {
  /** @type {Record<string, number>} */
  const params = {};
  for (const k of PARAMS) params[k] = 0;
  return {
    scene: 4,
    p: p + 0,
    params,
    geom: {
      ground: 'cobalt',
      bandRects: null,
      dotGrid: null,
      whitePoint: null,
      shelf: null,
      channelScales: null,
      glassAlpha: 0,
      beamRect: null,
      otherOpacity: 0,
    },
    stub: true,
  };
}

/**
 * Paints one flat band colour inside .uv. Writes only; reads nothing.
 * @param {SceneHost} host
 * @returns {SceneView}
 */
export function mount(host) {
  const fill = host.uv.ownerDocument.createElement('div');
  fill.className = 'stub-fill';
  fill.dataset.instance = host.instance;
  fill.style.cssText = 'position:absolute;inset:0;background:var(--band-4, #0BCA86)';
  host.uv.appendChild(fill);
  return {
    apply() {},
    resize() {},
    destroy() {
      fill.remove();
    },
  };
}
