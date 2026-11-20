// engine/layers.js: scene instance management (K7, §8.3, §10.4). Owner chain: WO-006 → WO-014 →
// WO-025 → WO-024.
//
// Each scene has one layer (its <section>). A layer draws in one of two modes:
// - main: one instance ('main') in the section's own .uv, driven by state(p);
// - stills: two instances ('a' and 'b'), each in a fresh .uv inserted after the original, each
//   applying one fixed still (§10.4). 'a' holds plan.base at opacity 1 and 'b' holds plan.over at
//   plan.overAlpha. Under reduced motion every layer is in stills mode; otherwise a layer falls to
//   stills when its main instance throws (F9).
// Still instances exist only for the active layer (DOM budget), so they are mounted when the layer
// becomes active and destroyed when it stops being active.
// Everything here WRITES; nothing reads layout.

/** @typedef {import('../types.js').SceneModule} SceneModule */
/** @typedef {import('../types.js').SceneView} SceneView */
/** @typedef {import('../types.js').SceneId} SceneId */
/** @typedef {import('../types.js').SceneState} SceneState */
/** @typedef {import('../types.js').StillPlan} StillPlan */
/** @typedef {import('../types.js').Viewport} Viewport */
/** @typedef {import('../types.js').AmbientSample} AmbientSample */
/** @typedef {import('../types.js').ErrorEntry} ErrorEntry */
/** @typedef {(scene: SceneId | null, phase: ErrorEntry['phase'], err: unknown) => void} Report */

/** @typedef {{ view: SceneView | null; uv: HTMLElement; still: number | null }} Instance */
/**
 * @typedef {{
 *   id: SceneId; mod: SceneModule; section: HTMLElement; art: HTMLElement; uv: HTMLElement;
 *   main: Instance | null; a: Instance | null; b: Instance | null; stills: boolean; dead: boolean;
 * }} Layer
 */

/** Stills are static: they are always applied with zero amplitude (amb.a = 0 ⇒ exactly the state). */
const STILL_AMB = Object.freeze({ a: 0, t: 0 });

/** @param {unknown} err @returns {string} */
export function errorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Compare-before-write for styles and attributes (C6): a value is written only when it differs
 * from the last value this writer wrote to that element, so a ResizeObserver cannot loop and an
 * unchanged frame costs no style invalidation.
 */
export function createWriter() {
  /** @type {WeakMap<Element, Map<string, string>>} */
  const cache = new WeakMap();
  /** @param {Element} el @param {string} key @param {string} v */
  const changed = (el, key, v) => {
    let m = cache.get(el);
    if (!m) cache.set(el, (m = new Map()));
    if (m.get(key) === v) return false;
    m.set(key, v);
    return true;
  };
  return {
    /** @param {HTMLElement} el @param {string} prop @param {string} v @returns {boolean} written */
    style(el, prop, v) {
      if (!changed(el, `s${prop}`, v)) return false;
      el.style.setProperty(prop, v);
      return true;
    },
    /** @param {HTMLElement} el @param {string} name @param {string} v @returns {boolean} written */
    attr(el, name, v) {
      if (!changed(el, `a${name}`, v)) return false;
      el.setAttribute(name, v);
      return true;
    },
  };
}

/**
 * @param {{
 *   scenes: readonly SceneModule[]; doc: Document; reduced: boolean;
 *   stateOf: (id: SceneId, p: number) => SceneState; report: Report;
 * }} opts
 */
export function createLayers({ scenes, doc, reduced, stateOf, report }) {
  /** @type {Viewport} */
  let vp;

  /** @type {Layer[]} */
  const layers = scenes.map((mod) => {
    const section = /** @type {HTMLElement} */ (doc.getElementById(`scene-${mod.meta.slug}`));
    const art = /** @type {HTMLElement} */ (section.querySelector('.art'));
    const uv = /** @type {HTMLElement} */ (art.querySelector('.uv'));
    return { id: mod.meta.id, mod, section, art, uv, main: null, a: null, b: null, stills: reduced, dead: false };
  });

  /** @param {Layer} l @param {'main' | 'a' | 'b'} instance @param {HTMLElement} uv @returns {Instance} */
  const mount = (l, instance, uv) => {
    /** @type {SceneView | null} */
    let view = null;
    try {
      view = l.mod.mount({
        section: l.section, art: l.art, uv, vp, instance, reduced,
        reportError: (phase, err) => report(l.id, phase, err),
      });
    } catch (err) {
      report(l.id, 'mount', err);
    }
    return { view, uv, still: null };
  };

  /** @param {Layer} l @param {'a' | 'b'} name @returns {Instance} */
  const mountStill = (l, name) => {
    const uv = doc.createElement('div');
    uv.className = 'uv';
    uv.dataset.instance = name;
    if (name === 'b') {
      uv.hidden = true;
      uv.style.opacity = '0';
    }
    (name === 'a' ? l.uv : /** @type {Instance} */ (l.a).uv).after(uv);
    return mount(l, name, uv);
  };

  /** @param {Instance | null} inst */
  const destroy = (inst) => {
    if (!inst) return;
    try {
      inst.view?.destroy();
    } catch {
      /* a failing destroy must not stop the teardown */
    }
  };

  /** @param {Layer} l */
  const enterStills = (l) => {
    l.uv.hidden = true;
    if (!l.a) {
      l.a = mountStill(l, 'a');
      l.b = mountStill(l, 'b');
    }
  };

  /** @param {Layer} l */
  const leaveStills = (l) => {
    for (const inst of [l.a, l.b]) {
      destroy(inst);
      inst?.uv.remove();
    }
    l.a = l.b = null;
  };

  /** Main mode → stills mode, after the main instance failed. @param {Layer} l */
  const fall = (l) => {
    if (l.stills) return false;
    l.stills = true;
    destroy(l.main);
    l.main = null;
    enterStills(l);
    return true;
  };

  /** @param {Layer} l @param {Instance | null} inst @param {number} p */
  const applyStill = (l, inst, p) => {
    if (l.dead || !inst || !inst.view || inst.still === p) return;
    try {
      inst.view.apply(stateOf(l.id, p), STILL_AMB);
      inst.still = p;
    } catch (err) {
      report(l.id, 'apply', err);
      l.dead = true; // its stills fail too: keep whatever is drawn and stop calling into it
    }
  };

  return {
    /** Mount every main instance (normal mode). Called once, after the first layout. @param {Viewport} v */
    boot(v) {
      vp = v;
      if (reduced) return;
      for (const l of layers) {
        l.main = mount(l, 'main', l.uv);
        if (!l.main.view) fall(l);
      }
    },

    /** True when the layer draws stills (reduced motion, or after an error). @param {SceneId} id */
    isStills: (id) => layers[id - 1].stills,

    /** A layer whose state() threw in main mode drops to stills. @param {SceneId} id @returns {boolean} switched */
    fall: (id) => fall(layers[id - 1]),

    /** Its stills threw too: stop calling into it. @param {SceneId} id */
    kill(id) {
      layers[id - 1].dead = true;
    },

    /**
     * WRITE: make `id` the only visible layer. Inactive sections are inert, which hides their .art
     * and caption (base.css). Still instances follow the active layer.
     * @param {SceneId} id @param {SceneId | 0} prev
     */
    activate(id, prev) {
      for (const l of layers) {
        const inert = l.id !== id;
        if (l.section.inert !== inert) l.section.inert = inert;
      }
      if (prev) leaveStills(layers[prev - 1]);
      const l = layers[id - 1];
      if (l.stills) enterStills(l);
    },

    /**
     * WRITE: draw the active layer. Main mode applies `state` with the ambient sample; stills mode
     * applies plan.base to 'a' and plan.over to 'b' (each only when its still changes) and sets b's
     * opacity. Returns true when the layer fell to stills during this call, so the engine can
     * re-derive the frame's snapshot.
     * @param {SceneId} id @param {number} p @param {SceneState} state @param {StillPlan | null} plan
     * @param {AmbientSample} amb @param {(p: number) => StillPlan} planOf
     * @returns {boolean}
     */
    render(id, p, state, plan, amb, planOf) {
      const l = layers[id - 1];
      if (l.dead) return false;
      let fell = false;
      if (!l.stills) {
        try {
          l.main?.view?.apply(state, amb);
          return false;
        } catch (err) {
          report(id, 'apply', err);
          fell = fall(l);
          plan = planOf(p);
        }
      }
      const pl = /** @type {StillPlan} */ (plan);
      applyStill(l, l.a, pl.base);
      if (pl.over !== null) applyStill(l, l.b, pl.over);
      if (l.b) {
        const hide = pl.over === null || pl.overAlpha === 0;
        if (l.b.uv.hidden !== hide) l.b.uv.hidden = hide;
        const o = String(pl.overAlpha);
        if (l.b.uv.style.opacity !== o) l.b.uv.style.opacity = o;
      }
      return fell;
    },

    /** Rebuild size-dependent DOM in every live instance; stills re-apply on the next frame. @param {Viewport} v */
    resize(v) {
      vp = v;
      for (const l of layers) {
        for (const inst of [l.main, l.a, l.b]) {
          if (!inst?.view) continue;
          inst.still = null;
          try {
            inst.view.resize(v);
          } catch (err) {
            report(l.id, 'mount', err);
          }
        }
      }
    },
  };
}
