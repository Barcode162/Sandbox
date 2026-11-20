// engine/hook.js: window.__showcase (C5), the read-only test hook, and the data-* mirrors the
// frame writes. Owner chain: WO-001 → WO-006 → WO-014 → WO-025 → WO-024.

/** @typedef {import('../types.js').ShowcaseHook} ShowcaseHook */
/** @typedef {import('../types.js').Snapshot} Snapshot */

/**
 * Deep copy that is JSON-clean (finite numbers, no -0, no DOM refs).
 * @template T
 * @param {T} v
 * @returns {T}
 */
export function jsonClean(v) {
  return JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'number' && Object.is(x, -0) ? 0 : x)));
}

/**
 * Fixed-size ring buffer of numbers; `values()` returns them oldest first.
 * @param {number} size
 */
export function createRing(size) {
  /** @type {number[]} */
  const buf = [];
  let next = 0;
  return {
    /** @param {number} v */
    push(v) {
      buf[next] = v;
      next = (next + 1) % size;
    },
    /** @returns {number[]} */
    values() {
      return buf.length < size ? buf.slice() : buf.slice(next).concat(buf.slice(0, next));
    },
  };
}

/**
 * The C5 `data-*` mirrors on #stage, written in the frame (compare-before-write).
 * @param {{ attr(el: HTMLElement, name: string, v: string): boolean }} write
 * @param {HTMLElement} stage
 * @param {Snapshot} s
 */
export function writeStageMirrors(write, stage, s) {
  write.attr(stage, 'data-scene', String(s.scene));
  write.attr(stage, 'data-p', s.p.toFixed(4));
}

/**
 * Freeze and install the hook. `src.errors` is the engine's live ledger (same array reference).
 * @param {Window} win
 * @param {Omit<ShowcaseHook, 'version'>} src
 * @returns {ShowcaseHook}
 */
export function installHook(win, src) {
  /** @type {ShowcaseHook} */
  const hook = Object.freeze({
    version: /** @type {1} */ (1),
    ready: src.ready,
    errors: src.errors,
    progress: src.progress,
    snapshot: src.snapshot,
    stateAt: src.stateAt,
    sceneState: src.sceneState,
    layout: src.layout,
    nextFrame: src.nextFrame,
    frameStats: src.frameStats,
  });
  Object.defineProperty(win, '__showcase', { value: hook, writable: false, configurable: false, enumerable: false });
  return hook;
}
