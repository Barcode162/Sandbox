// engine/ambient.js: breathing amplitude a(t), pause state and its persistence (C4 AmbientCtl).
// WO-001 STUB, inert: a ≡ 0, start/stop do nothing, `active` is always false. WO-016 replaces the
// body; the factory name and signature are frozen.

const KEY = 'bentlight.breathing';

/** @type {import('../types.js').CreateAmbient} */
export const createAmbient = function createAmbient({ reduced, storage }) {
  /** @type {Set<() => void>} */
  const listeners = new Set();
  let paused = storage.get(KEY) === 'off';

  return {
    sample(now) {
      return { a: 0, t: now / 1000 };
    },
    start() {},
    stop() {},
    get active() {
      return false;
    },
    get paused() {
      return paused;
    },
    setPaused(v) {
      if (paused === v) return;
      paused = v;
      storage.set(KEY, v ? 'off' : 'on');
      for (const fn of listeners) fn();
    },
    get disabled() {
      return reduced;
    },
    on(evt, fn) {
      if (evt !== 'change') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};
