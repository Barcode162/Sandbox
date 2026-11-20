// engine/hook.js: window.__showcase (C5), the read-only test hook.
// WO-001 minimal implementation; WO-006 owns it from wave 1.

/** @typedef {import('../types.js').ShowcaseHook} ShowcaseHook */

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
