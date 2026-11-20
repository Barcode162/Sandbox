// engine/rewind.js: "Run it backwards" (spec §8.1). Scrolls the whole piece back to the first beam
// in 8 s, as engine-originated scrolls, so every scene plays in reverse. Any key, wheel, touch or
// pointer press stops it where it is. Under reduced motion the control jumps instead.

import { easeInOutSine } from '../core/math.js';
import { COPY, rewindStoppedStatus } from '../core/copy.js';

const DURATION_MS = 8000;
const STOP_EVENTS = ['wheel', 'keydown', 'pointerdown', 'touchstart'];

/** @type {import('../types.js').CreateRewind} */
export const createRewind = function createRewind({ engine, announce, reduced, doc }) {
  const win = /** @type {Window} */ (doc.defaultView);
  /** @type {Set<() => void>} */
  const listeners = new Set();
  let active = false;
  let raf = 0;
  let from = 0;
  let t0 = 0;

  function emit() {
    for (const fn of listeners) fn();
  }

  function finish(/** @type {'input' | 'done'} */ reason) {
    if (!active) return;
    active = false;
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
    for (const t of STOP_EVENTS) win.removeEventListener(t, onInput, true);
    doc.documentElement.dataset.rewind = 'off';
    if (reason === 'done') announce(COPY.status.rewindDone);
    else announce(rewindStoppedStatus(engine.snapshot().scene));
    emit();
  }

  /** @param {Event} e */
  function onInput(e) {
    // The click that started the rewind must not stop it.
    if (e.type === 'pointerdown' && e.target instanceof Element && e.target.closest('#rewind')) return;
    finish('input');
  }

  /** @param {number} now */
  function step(now) {
    raf = 0;
    if (!active) return;
    const k = Math.min(1, (now - t0) / DURATION_MS);
    engine.scrollTo(Math.round(from * (1 - easeInOutSine(k))), 'rewind');
    if (k >= 1) finish('done');
    else raf = win.requestAnimationFrame(step);
  }

  return {
    get active() {
      return active;
    },
    start() {
      if (active) return;
      if (reduced) {
        this.jumpToStart();
        return;
      }
      from = win.scrollY;
      if (from <= 0) return;
      active = true;
      t0 = win.performance.now();
      doc.documentElement.dataset.rewind = 'on';
      for (const t of STOP_EVENTS) win.addEventListener(t, onInput, { capture: true, passive: true });
      announce(COPY.rewind.running);
      raf = win.requestAnimationFrame(step);
      emit();
    },
    stop(reason) {
      finish(reason);
    },
    jumpToStart() {
      engine.scrollTo(0, 'jump');
      announce(COPY.status.rewindDone);
      doc.getElementById('wordmark')?.focus({ preventScroll: true });
    },
    on(evt, fn) {
      if (evt !== 'change') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};
