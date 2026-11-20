// dev/harness.js: mounts one scene full-window through the same SceneHost shape the engine uses,
// and applies state(p). URL: /__dev/harness.html?scene=3&p=0.5&amb=0&t=0
// Exposes window.__harness.set(p, a, t) and .state() (plan WO-001 "Harness").
// The viewport comes from core/env.js measureViewport and core/geometry.js viewport().
// Site modules load by URL (served at /js/ next to /__dev/), so their types come from JSDoc imports.

/** @typedef {import('../site/js/types.js').SceneModule} SceneModule */
/** @typedef {import('../site/js/types.js').SceneState} SceneState */
/** @typedef {import('../site/js/types.js').SceneId} SceneId */
/** @typedef {import('../site/js/types.js').ErrorEntry} ErrorEntry */

const SITE = '/js/';

/** @type {{ default: readonly SceneModule[] }} */
const registry = await import(SITE + 'scenes/index.js');
/** @type {import('../site/js/types.js').CoreEnv} */
const env = await import(SITE + 'core/env.js');
/** @type {Pick<import('../site/js/types.js').CoreGeometry, 'viewport'>} */
const geometry = await import(SITE + 'core/geometry.js');

const q = new URLSearchParams(location.search);
const num = (/** @type {string} */ k, /** @type {number} */ d) => {
  const v = Number(q.get(k));
  return q.has(k) && Number.isFinite(v) ? v : d;
};
const id = /** @type {SceneId} */ (Math.min(6, Math.max(1, Math.round(num('scene', 1)))));
const mod = registry.default[id - 1];

const doc = document;
const root = doc.documentElement;
const probe = /** @type {HTMLElement} */ (doc.getElementById('svh-probe'));
const section = /** @type {HTMLElement} */ (doc.getElementById('harness-scene'));
const art = /** @type {HTMLElement} */ (section.querySelector('.art'));
const uv = /** @type {HTMLElement} */ (section.querySelector('.uv'));

const m = env.measureViewport(window, probe);
const vp = geometry.viewport(m.vw, m.sh, m.dpr);
root.style.setProperty('--U', `${vp.U}px`);
root.style.setProperty('--V', `${vp.V}px`);
root.dataset.orient = vp.landscape ? 'landscape' : 'portrait';
root.dataset.reduced = String(env.prefersReduced(window));
section.dataset.scene = String(id);
section.id = `scene-${mod.meta.slug}`;
art.setAttribute('aria-label', `Harness: scene ${id} ${mod.meta.name}`);

/** @type {ErrorEntry[]} */
const errors = [];
const view = mod.mount({
  section, art, uv, vp, instance: 'main', reduced: root.dataset.reduced === 'true',
  reportError: (phase, err) => errors.push({ scene: id, phase, message: err instanceof Error ? err.message : String(err), y: 0 }),
});

/** @type {SceneState | null} */
let last = null;

/** @type {import('../site/js/types.js').HarnessHandle & { errors: ErrorEntry[] }} */
const handle = {
  ready: Promise.resolve(),
  scene: id,
  vp,
  errors,
  set(p, a = 0, t = 0) {
    const pp = Math.min(1, Math.max(0, p)) + 0;
    last = mod.state(pp, vp);
    view.apply(last, { a, t });
    root.dataset.p = pp.toFixed(4);
    return JSON.parse(JSON.stringify(last));
  },
  state() {
    return last ? JSON.parse(JSON.stringify(last)) : null;
  },
};
handle.set(num('p', 0), num('amb', 0), num('t', 0));
window.__harness = handle;
root.dataset.boot = 'ready';
