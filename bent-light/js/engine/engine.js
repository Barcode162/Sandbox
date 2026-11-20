// engine/engine.js: the frame loop (K2, C6), layout and the pin (K4), scroll origin, the resize
// anchor (F8), hash handling (R9), the error ledger (F9) and the C5 hook.
// Owner chain: WO-001 → WO-006 → WO-014 → WO-025 → WO-024.
//
// The frame, in C6 order:
//   READ     scrollY once (plus the cached layout).
//   COMPUTE  locate → state (stills: stillPlan → state(pShown)) → ambient.sample(ts).
//   WRITE    layer visibility and inert on a scene change → view.apply (main, or a/b) → #stage
//            mirrors → 'scene' → 'frame' listeners (chrome), all in the same rAF callback.
// rAF is requested only by a scroll, a layout change, invalidate(), nextFrame(), an ambient change,
// or a frame that ends with ambient.active: an idle page schedules nothing.
// Layout is read only on boot, on window 'resize' and in a ResizeObserver on documentElement, and
// every derived write is compare-before-write, so the observer can never loop.

import { measureViewport } from '../core/env.js';
import { viewport, trackLayout, locate } from '../core/geometry.js';
import { stillPlan } from '../core/reduced.js';
import { createRing, installHook, jsonClean, writeStageMirrors } from './hook.js';
import { createLayers, createWriter, errorMessage } from './layers.js';

/** @typedef {import('../types.js').Layout} Layout */
/** @typedef {import('../types.js').SceneId} SceneId */
/** @typedef {import('../types.js').SceneState} SceneState */
/** @typedef {import('../types.js').StillPlan} StillPlan */
/** @typedef {import('../types.js').Snapshot} Snapshot */
/** @typedef {import('../types.js').ErrorEntry} ErrorEntry */
/** @typedef {import('../types.js').Engine} Engine */
/** @typedef {{ scene: SceneId; p: number; G: number }} Located */

/** Frames of engine work kept by frameStats() (C5). */
const STATS_FRAMES = 600;
/** An engine-originated scroll event lands within this many px of the target … */
const ORIGIN_PX = 1;
/** … and no more than this many frames after engine.scrollTo (C6). */
const ORIGIN_FRAMES = 2;

/** Seam fields of a state that could not be computed (only used when a scene's stills throw too). */
const NO_GEOM = Object.freeze({
  ground: /** @type {'wall'} */ ('wall'), bandRects: null, dotGrid: null, whitePoint: null, shelf: null,
  channelScales: null, glassAlpha: 0, beamRect: null, otherOpacity: 0,
});

/**
 * The element id a location hash names, or null. Never throws: a malformed escape sequence
 * (`#%E0%A4%A`) gives null. The result is only ever given to getElementById (R9, guard 13).
 * @param {string} hash  location.hash, including the leading '#'
 * @returns {string | null}
 */
export function hashId(hash) {
  if (typeof hash !== 'string' || hash.length < 2 || hash[0] !== '#') return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
}

/**
 * C6 scroll-origin rule: an event within ORIGIN_PX of the engine's last scrollTo target and no
 * more than ORIGIN_FRAMES frames after it was caused by the engine.
 * @param {{ y: number; frame: number } | null} rec  the engine's last scrollTo
 * @param {number} y  scrollY at the event
 * @param {number} frame  the engine's frame counter at the event
 */
export function isEngineScroll(rec, y, frame) {
  return rec !== null && Math.abs(y - rec.y) <= ORIGIN_PX && frame - rec.frame <= ORIGIN_FRAMES;
}

/** @param {number} y @param {Layout} l */
const gOf = (y, l) => (l.D > 0 ? Math.min(1, Math.max(0, y / l.D)) : 0);

/** @type {import('../types.js').CreateEngine} */
export const createEngine = function createEngine({ scenes, doc, win, reduced, ambient }) {
  const t0 = win.performance.now();
  const root = doc.documentElement;
  const stage = /** @type {HTMLElement} */ (doc.getElementById('stage'));
  const probe = /** @type {HTMLElement} */ (doc.getElementById('svh-probe'));
  const anchors = scenes.map((m) => doc.getElementById(m.meta.slug));
  const write = createWriter();
  const g = /** @type {Window & typeof globalThis} */ (win);

  // ── Events ─────────────────────────────────────────────────────────────────────────────
  /** @type {Record<string, Set<Function>>} */
  const listeners = { frame: new Set(), scene: new Set(), layout: new Set(), userscroll: new Set(), error: new Set() };
  /** @param {string} evt @param {...unknown} args */
  const emit = (evt, ...args) => {
    for (const fn of listeners[evt]) {
      try {
        fn(...args);
      } catch (err) {
        // A failing listener never stops the frame. Error listeners are not re-reported (no recursion).
        if (evt !== 'error') report(null, 'engine', err);
      }
    }
  };

  // ── Error ledger (F9, §8.3): deduped by scene + phase + message; never console.error ─────
  /** @type {ErrorEntry[]} */
  const errors = [];
  const seen = new Set();
  let lastY = win.scrollY;
  /** @param {Omit<ErrorEntry, 'y'>} e */
  const reportError = (e) => {
    const message = String(e.message);
    const key = `${e.scene}|${e.phase}|${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    /** @type {ErrorEntry} */
    const entry = { scene: e.scene, phase: e.phase, message, y: Math.round(lastY) || 0 };
    errors.push(entry);
    emit('error', { ...entry });
  };
  /** @param {SceneId | null} scene @param {ErrorEntry['phase']} phase @param {unknown} err */
  const report = (scene, phase, err) => reportError({ scene, phase, message: errorMessage(err) });

  // ── Layout (boot, resize, ResizeObserver; compare before write) ────────────────────────
  /** @type {Layout} */
  let layout;
  let layoutKey = '';
  /** Pure stills, cached per scene and still (3 × 6 at most); cleared when the layout changes. */
  const stills = new Map();

  /** READ the viewport; on a change, rebuild the layout and WRITE what changed. @returns {boolean} changed */
  const relayout = () => {
    const m = measureViewport(win, probe);
    const key = `${m.vw}|${m.sh}|${m.dpr}`;
    if (key === layoutKey) return false;
    layoutKey = key;
    layout = trackLayout(viewport(m.vw, m.sh, m.dpr));
    stills.clear();
    const { vp, Y, D } = layout;
    write.style(root, '--U', `${vp.U}px`);
    write.style(root, '--V', `${vp.V}px`);
    write.style(root, '--gutter', `${vp.gutter}px`);
    write.style(root, '--track-h', `${D + vp.sh}px`);
    anchors.forEach((a, i) => a && write.style(a, 'top', `${Y[i]}px`));
    write.attr(root, 'data-orient', vp.landscape ? 'landscape' : 'portrait');
    return true;
  };

  /** @param {SceneId} id @param {number} p @returns {SceneState} */
  const stateOf = (id, p) => {
    if (p !== 0 && p !== 0.5 && p !== 1) return scenes[id - 1].state(p, layout.vp);
    const key = id * 4 + p * 2;
    let s = stills.get(key);
    if (!s) stills.set(key, (s = scenes[id - 1].state(p, layout.vp)));
    return s;
  };

  const layers = createLayers({ scenes, doc, reduced, stateOf, report });

  // Scroll anchoring would move scrollY when layer DOM changes size; scrollY is the only animation
  // state (K3), so the engine turns it off on the root it owns.
  write.style(root, 'overflow-anchor', 'none');
  relayout();
  write.attr(root, 'data-reduced', String(reduced));
  layers.boot(layout.vp);

  // ── Prediction (pure given layout and stills mode) ─────────────────────────────────────
  let admire = /** @type {'on' | 'off'} */ (root.dataset.admire === 'on' ? 'on' : 'off');
  if (g.MutationObserver) {
    // Cached outside the frame, so the frame's READ is scrollY alone.
    new g.MutationObserver(() => {
      admire = root.dataset.admire === 'on' ? 'on' : 'off';
    }).observe(root, { attributes: true, attributeFilter: ['data-admire'] });
  }

  /** @param {number} y @param {Located} loc @param {number} a @param {'on' | 'off'} mode @returns {Snapshot} */
  const predict = (y, loc, a, mode) => {
    const plan = layers.isStills(loc.scene) ? stillPlan(loc.p) : null;
    const state = stateOf(loc.scene, plan ? plan.pShown : loc.p);
    return { y, G: loc.G, scene: loc.scene, p: loc.p, state, reduced: plan, admire: mode, ambientA: plan ? 0 : a };
  };

  /** predict(), demoting a layer whose state() throws to its stills (F9). @returns {Snapshot | null} */
  const safePredict = (/** @type {number} */ y, /** @type {Located} */ loc, /** @type {number} */ a) => {
    try {
      return predict(y, loc, a, admire);
    } catch (err) {
      report(loc.scene, 'state', err);
      if (!layers.fall(loc.scene)) {
        layers.kill(loc.scene);
        return null;
      }
    }
    try {
      return predict(y, loc, a, admire);
    } catch (err) {
      report(loc.scene, 'state', err);
      layers.kill(loc.scene);
      return null;
    }
  };

  // ── Frame loop (K2, C6) ────────────────────────────────────────────────────────────────
  /** @type {Snapshot | null} */
  let last = null;
  /** @type {SceneId | 0} */
  let active = 0;
  let frames = 0;
  const scriptMs = createRing(STATS_FRAMES);
  let raf = 0;
  /** @type {((s: Snapshot) => void)[]} */
  let waiters = [];
  /** @type {() => void} */
  let resolveReady = () => {};
  /** @type {Promise<void>} */
  const ready = new Promise((r) => (resolveReady = r));
  let gAnchor = gOf(lastY, layout);
  /** @type {{ y: number; frame: number } | null} */
  let origin = null;

  /** @param {number} ts */
  const frame = (ts) => {
    raf = 0;
    const w0 = win.performance.now();
    try {
      // READ
      const y = win.scrollY;
      lastY = y;
      // COMPUTE
      const loc = locate(y, layout);
      const amb = ambient.sample(ts);
      let snap = safePredict(y, loc, amb.a);
      // WRITE
      if (loc.scene !== active) {
        const prev = active;
        layers.activate(loc.scene, prev);
        active = loc.scene;
        if (prev) emit('scene', loc.scene, prev);
      }
      if (snap && layers.render(loc.scene, loc.p, snap.state, snap.reduced, amb, stillPlan)) {
        snap = safePredict(y, loc, amb.a); // the layer fell to its stills during apply
      }
      last = snap ?? last ?? {
        y, G: loc.G, scene: loc.scene, p: loc.p, reduced: null, admire, ambientA: 0,
        state: { scene: loc.scene, p: loc.p, params: {}, geom: { ...NO_GEOM } },
      };
      writeStageMirrors(write, stage, last);
      frames++;
      emit('frame', last);
      if (frames === 1) {
        api.bootMs = win.performance.now() - t0;
        resolveReady();
      }
      if (waiters.length) {
        const ws = waiters;
        waiters = [];
        for (const fn of ws) fn(jsonClean(last));
      }
    } catch (err) {
      report(null, 'engine', err);
    }
    scriptMs.push(win.performance.now() - w0);
    if (ambient.active) schedule();
  };
  const schedule = () => {
    if (!raf) raf = win.requestAnimationFrame(frame);
  };

  // ── Input: one passive scroll listener ─────────────────────────────────────────────────
  win.addEventListener(
    'scroll',
    () => {
      const y = win.scrollY;
      lastY = y;
      if (!isEngineScroll(origin, y, frames)) {
        origin = null;
        gAnchor = gOf(y, layout);
        emit('userscroll', y);
      }
      schedule();
    },
    { passive: true },
  );

  // ── Resize (F8): remeasure, write what changed, restore round(G_anchor · D′) ───────────
  const onResize = () => {
    try {
      if (!relayout()) return;
      layers.resize(layout.vp);
      emit('layout', layout);
      api.scrollTo(Math.round(gAnchor * layout.D), 'resize');
    } catch (err) {
      report(null, 'engine', err);
    }
  };
  win.addEventListener('resize', onResize);
  if (g.ResizeObserver) new g.ResizeObserver(onResize).observe(root);

  // ── The Engine (C4) ────────────────────────────────────────────────────────────────────
  /** @type {Engine} */
  const api = {
    get layout() {
      return layout;
    },
    snapshot: () => jsonClean(last ?? predict(win.scrollY, locate(win.scrollY, layout), 0, admire)),
    stateAt: (y) => jsonClean(predict(y, locate(y, layout), 0, 'off')),
    sceneState: (id, p) => jsonClean(scenes[id - 1].state(Math.min(1, Math.max(0, p)) + 0, layout.vp)),
    scrollTo(y, why) {
      // Explicitly instant: html { scroll-behavior: smooth } must never animate an engine scroll (C6).
      win.scrollTo({ top: y, behavior: 'instant' });
      const actual = win.scrollY;
      lastY = actual;
      origin = { y: actual, frame: frames };
      // A resize restore keeps the visitor's anchor. A jump or rewind step is where the visitor
      // asked to be, so it becomes the anchor a later resize restores (it fires no userscroll).
      if (why !== 'resize') gAnchor = gOf(actual, layout);
      schedule();
    },
    invalidate: schedule,
    reportError,
    on(evt, fn) {
      const set = listeners[evt];
      if (!set) return () => {};
      set.add(fn);
      return () => set.delete(fn);
    },
    bootMs: 0,
  };
  ambient.on('change', schedule);

  installHook(win, {
    ready,
    errors,
    progress: () => {
      const y = win.scrollY;
      const loc = locate(y, layout);
      return { y, G: loc.G, scene: loc.scene, p: loc.p };
    },
    snapshot: api.snapshot,
    stateAt: api.stateAt,
    sceneState: api.sceneState,
    layout: () => jsonClean(layout),
    nextFrame: () =>
      new Promise((resolve) => {
        waiters.push(resolve);
        schedule();
      }),
    frameStats: () => ({ frames, scriptMs: scriptMs.values() }),
  });

  // ── Hash (R9, §8.2): only a scene anchor id moves the page; anything else opens at the top ─
  try {
    const id = hashId(win.location.hash);
    const el = id ? doc.getElementById(id) : null;
    const i = el ? anchors.indexOf(el) : -1;
    if (i >= 0) api.scrollTo(layout.Y[i], 'jump');
  } catch (err) {
    report(null, 'boot', err);
  }

  schedule();
  return api;
};
