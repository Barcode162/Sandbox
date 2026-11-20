// engine/engine.js: the frame loop (K2, C6), layout, layers, scroll origin and the C5 hook.
// WO-001 STUB with the full C4 Engine shape and a minimal but honest loop, so the pin contract,
// the hook and the smoke e2e are real from wave 0. WO-006 replaces it (core/geometry.js layout,
// layers.js instances, ResizeObserver, reduced a/b, hash handling, error stills).
//
// Local layout literals mirror §3.1 and §11.1 until WO-006 switches to core/geometry.js.

import { measureViewport } from '../core/env.js';
import { installHook, jsonClean } from './hook.js';

/** @typedef {import('../types.js').Viewport} Viewport */
/** @typedef {import('../types.js').Layout} Layout */
/** @typedef {import('../types.js').SceneId} SceneId */
/** @typedef {import('../types.js').SceneState} SceneState */
/** @typedef {import('../types.js').SceneView} SceneView */
/** @typedef {import('../types.js').Snapshot} Snapshot */
/** @typedef {import('../types.js').ErrorEntry} ErrorEntry */

const TRACKS = [220, 300, 260, 320, 220, 180];
const BPS = /** @type {const} */ ([
  [768, 375, 16, 24],
  [1024, 768, 24, 24],
  [1440, 1024, 32, 28],
  [1920, 1440, 40, 32],
]);

/**
 * @param {number} vw @param {number} sh @param {number} dpr
 * @returns {Viewport}
 */
function stubViewport(vw, sh, dpr) {
  const landscape = vw / sh >= 1;
  /** @type {import('../types.js').Bp} */
  let bp = 1920;
  let gutter = 48;
  let pitch = 36;
  for (const [below, b, g, pt] of BPS) {
    if (vw < below) {
      bp = b;
      gutter = g;
      pitch = pt;
      break;
    }
  }
  return {
    vw, sh, dpr, landscape,
    U: landscape ? vw : sh,
    V: landscape ? sh : vw,
    vmin: Math.min(vw, sh) / 100,
    bp, gutter, pitch, lattice: 2 * pitch,
  };
}

/** @param {Viewport} vp @returns {Layout} */
function stubLayout(vp) {
  const L = TRACKS.map((t) => (t * vp.sh) / 100);
  const Y = [];
  let acc = 0;
  for (const l of L) {
    Y.push(acc);
    acc += l;
  }
  return { vp, Y, L, D: acc };
}

/**
 * @param {number} y @param {Layout} layout
 * @returns {{ scene: SceneId; p: number; G: number }}
 */
function stubLocate(y, layout) {
  const { Y, L, D } = layout;
  const yy = Math.max(0, y);
  const G = D > 0 ? Math.min(1, yy / D) : 0;
  if (yy >= D) return { scene: 6, p: 1, G: 1 };
  let s = 0;
  while (s < 5 && yy >= Y[s + 1]) s++;
  const p = Math.min(1, Math.max(0, (yy - Y[s]) / L[s])) + 0;
  return { scene: /** @type {SceneId} */ (s + 1), p, G: G + 0 };
}

/** @type {import('../types.js').CreateEngine} */
export const createEngine = function createEngine({ scenes, doc, win, reduced, ambient }) {
  const t0 = win.performance.now();
  const root = doc.documentElement;
  const stage = /** @type {HTMLElement} */ (doc.getElementById('stage'));
  const probe = /** @type {HTMLElement} */ (doc.getElementById('svh-probe'));
  /** @type {HTMLElement[]} */
  const sections = scenes.map((m) => /** @type {HTMLElement} */ (doc.querySelector(`section.scene[data-scene="${m.meta.id}"]`)));

  /** @type {Record<string, Set<Function>>} */
  const listeners = { frame: new Set(), scene: new Set(), layout: new Set(), userscroll: new Set(), error: new Set() };
  /** @param {string} evt @param {...unknown} args */
  const emit = (evt, ...args) => {
    for (const fn of listeners[evt]) fn(...args);
  };

  /** @type {ErrorEntry[]} */
  const errors = [];
  const seen = new Set();
  /** @param {Omit<ErrorEntry, 'y'>} e */
  const reportError = (e) => {
    const key = `${e.scene}|${e.phase}|${e.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    /** @type {ErrorEntry} */
    const entry = { scene: e.scene, phase: e.phase, message: String(e.message), y: Math.round(win.scrollY) };
    errors.push(entry);
    emit('error', entry);
  };

  // ── Layout (boot and resize only; compare before write, C6) ──────────────────────────────
  /** @type {Layout} */
  let layout;
  /** @type {Record<string, string>} */
  const written = {};
  /** @param {HTMLElement} el @param {string} prop @param {string} value @param {string} key */
  const writeStyle = (el, prop, value, key) => {
    if (written[key] === value) return;
    written[key] = value;
    el.style.setProperty(prop, value);
  };
  const measure = () => {
    const m = measureViewport(win, probe);
    layout = stubLayout(stubViewport(m.vw, m.sh, m.dpr));
    const { vp, Y, D } = layout;
    writeStyle(root, '--U', `${vp.U}px`, 'U');
    writeStyle(root, '--V', `${vp.V}px`, 'V');
    writeStyle(root, '--track-h', `${D + vp.sh}px`, 'track');
    scenes.forEach((m2, i) => {
      const a = doc.getElementById(m2.meta.slug);
      if (a) writeStyle(a, 'top', `${Y[i]}px`, `a${i}`);
    });
    const orient = vp.landscape ? 'landscape' : 'portrait';
    if (root.dataset.orient !== orient) root.dataset.orient = orient;
  };
  measure();
  root.dataset.reduced = String(reduced);

  // ── Scene views (main instance only in the stub) ─────────────────────────────────────────
  /** @type {(SceneView | null)[]} */
  const views = scenes.map((m, i) => {
    const section = sections[i];
    if (!section) return null;
    const art = /** @type {HTMLElement} */ (section.querySelector('.art'));
    const uv = /** @type {HTMLElement} */ (section.querySelector('.uv'));
    try {
      return m.mount({
        section, art, uv, vp: layout.vp, instance: 'main', reduced,
        reportError: (phase, err) => reportError({ scene: m.meta.id, phase, message: err instanceof Error ? err.message : String(err) }),
      });
    } catch (err) {
      reportError({ scene: m.meta.id, phase: 'mount', message: err instanceof Error ? err.message : String(err) });
      return null;
    }
  });

  /** @param {number} y @param {number} a @returns {Snapshot} */
  const predict = (y, a) => {
    const loc = stubLocate(y, layout);
    const state = scenes[loc.scene - 1].state(loc.p, layout.vp);
    return {
      y, G: loc.G, scene: loc.scene, p: loc.p, state,
      reduced: null,
      admire: root.dataset.admire === 'on' ? 'on' : 'off',
      ambientA: a,
    };
  };

  // ── Frame loop (K2, C6) ──────────────────────────────────────────────────────────────────
  /** @type {Snapshot | null} */
  let last = null;
  /** @type {SceneId | 0} */
  let active = 0;
  let frames = 0;
  /** @type {number[]} */
  const scriptMs = [];
  let raf = 0;
  /** @type {((s: Snapshot) => void)[]} */
  let waiters = [];
  /** @type {() => void} */
  let resolveReady;
  /** @type {Promise<void>} */
  const ready = new Promise((r) => (resolveReady = r));
  let gAnchor = 0;
  /** @type {{ y: number; frame: number } | null} */
  let engineScroll = null;

  /** @param {number} ts */
  const frame = (ts) => {
    raf = 0;
    const w0 = win.performance.now();
    try {
      const y = win.scrollY; // READ: once
      const amb = ambient.sample(ts); // COMPUTE
      const snap = predict(y, amb.a);
      if (snap.scene !== active) {
        // WRITE: layers
        const prev = active;
        sections.forEach((s, i) => {
          if (s) s.inert = i !== snap.scene - 1;
        });
        active = snap.scene;
        if (prev) emit('scene', snap.scene, prev);
      }
      const view = views[snap.scene - 1];
      if (view) {
        try {
          view.apply(snap.state, amb);
        } catch (err) {
          reportError({ scene: snap.scene, phase: 'apply', message: err instanceof Error ? err.message : String(err) });
        }
      }
      last = snap;
      stage.dataset.scene = String(snap.scene);
      stage.dataset.p = snap.p.toFixed(4);
      frames++;
      emit('frame', jsonClean(snap));
      if (root.dataset.boot !== 'ready') {
        root.dataset.boot = 'ready';
        api.bootMs = win.performance.now() - t0;
        resolveReady();
      }
      const ws = waiters;
      waiters = [];
      for (const fn of ws) fn(jsonClean(snap));
    } catch (err) {
      reportError({ scene: null, phase: 'engine', message: err instanceof Error ? err.message : String(err) });
    }
    scriptMs.push(win.performance.now() - w0);
    if (scriptMs.length > 600) scriptMs.shift();
    if (ambient.active) schedule();
  };
  const schedule = () => {
    if (!raf) raf = win.requestAnimationFrame(frame);
  };

  win.addEventListener(
    'scroll',
    () => {
      const y = win.scrollY;
      const fromEngine = engineScroll && Math.abs(y - engineScroll.y) <= 1 && frames - engineScroll.frame <= 2;
      if (!fromEngine) {
        engineScroll = null;
        gAnchor = layout.D > 0 ? Math.min(1, Math.max(0, y / layout.D)) : 0;
        emit('userscroll', y);
      }
      schedule();
    },
    { passive: true },
  );
  win.addEventListener('resize', () => {
    measure();
    for (const v of views) if (v) v.resize(layout.vp);
    emit('layout', jsonClean(layout));
    api.scrollTo(Math.round(gAnchor * layout.D), 'resize');
    schedule();
  });

  /** @type {import('../types.js').Engine} */
  const api = {
    get layout() {
      return layout;
    },
    snapshot: () => jsonClean(last ?? predict(win.scrollY, 0)),
    stateAt: (y) => jsonClean({ ...predict(y, 0), admire: 'off' }),
    sceneState: (id, p) => jsonClean(scenes[id - 1].state(Math.min(1, Math.max(0, p)) + 0, layout.vp)),
    scrollTo(y, _origin) {
      engineScroll = { y, frame: frames };
      win.scrollTo({ top: y, behavior: 'instant' });
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

  installHook(win, {
    ready,
    errors,
    progress: () => {
      const loc = stubLocate(win.scrollY, layout);
      return { y: win.scrollY, G: loc.G, scene: loc.scene, p: loc.p };
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
    frameStats: () => ({ frames, scriptMs: scriptMs.slice() }),
  });

  schedule();
  return api;
};
