// engine/ambient.js: the breathing amplitude a(t) used only in admire mode (spec §7.3, §7.8, §7.9).
//
// start() ramps a from its current value to 1 over 1,600 ms (easeInOutSine); stop() decays it to 0
// over 240 ms (easeOutCubic), starting from wherever it was, so the motion never jumps. While paused,
// or under reduced motion, a is always 0. The pause choice persists under 'bentlight.breathing'.

import { easeInOutSine, easeOutCubic } from '../core/math.js';

const KEY = 'bentlight.breathing';
const RAMP_MS = 1600;
const DECAY_MS = 240;

/** @type {import('../types.js').CreateAmbient} */
export const createAmbient = function createAmbient({ reduced, storage }) {
  /** @type {Set<() => void>} */
  const listeners = new Set();
  let paused = storage.get(KEY) === 'off';
  /** @type {'idle' | 'up' | 'down'} */
  let mode = 'idle';
  let t0 = 0;
  let from = 0;

  /** @param {number} now */
  function level(now) {
    if (mode === 'up') return from + (1 - from) * easeInOutSine(Math.min(1, Math.max(0, (now - t0) / RAMP_MS)));
    if (mode === 'down') return from * (1 - easeOutCubic(Math.min(1, Math.max(0, (now - t0) / DECAY_MS))));
    return 0;
  }
  function emit() {
    for (const fn of listeners) fn();
  }

  return {
    sample(now) {
      if (reduced || paused) return { a: 0, t: now / 1000 };
      const a = level(now);
      if (mode === 'down' && now - t0 >= DECAY_MS) mode = 'idle';
      return { a, t: now / 1000 };
    },
    start(now) {
      if (reduced) return;
      from = level(now);
      mode = 'up';
      t0 = now;
      emit();
    },
    stop(now) {
      if (mode === 'idle') return;
      from = level(now);
      mode = 'down';
      t0 = now;
      emit();
    },
    get active() {
      return !reduced && !paused && mode !== 'idle';
    },
    get paused() {
      return paused;
    },
    setPaused(v) {
      if (paused === v) return;
      paused = v;
      storage.set(KEY, v ? 'off' : 'on');
      emit();
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
