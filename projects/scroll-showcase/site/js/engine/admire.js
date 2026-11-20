// engine/admire.js: admire mode, the stillness reward (spec §7).
//
// Armed by the first user scroll. 1,200 ms after the last input (unless blocked) the page sets
// html[data-admire="on"], the chrome fades away, breathing ramps in and the live region describes
// the frame. At 3,000 ms of stillness the caption hands its slot to the placard. Any input restores
// everything synchronously inside the event handler and keeps its default action: nothing here
// ever calls preventDefault. Activity on the pause control toggles breathing and does not exit.

import { placardLabel, placardPhrase, admireAnnouncement } from '../core/phrases.js';

export const IDLE_MS = 1200;
export const PLACARD_MS = 3000;
const MOVE_PX = 4;

/** @type {import('../types.js').CreateAdmire} */
export const createAdmire = function createAdmire({ engine, ambient, rewind, announce, doc, win, reduced }) {
  const root = doc.documentElement;
  const chrome = doc.getElementById('chrome');
  const pause = doc.getElementById('pause');
  const plate = doc.getElementById('placard');
  const plateLabel = plate?.querySelector('.placard-label');
  const platePhrase = plate?.querySelector('.placard-phrase');
  /** @type {Set<(s: { mode: 'on' | 'off'; placard: boolean }) => void>} */
  const listeners = new Set();

  let armed = false;
  /** @type {'on' | 'off'} */
  let mode = 'off';
  let placard = false;
  let idleTimer = 0;
  let placardTimer = 0;
  let hoverChrome = false;
  let travel = 0;
  /** @type {{ x: number; y: number } | null} */
  let lastPt = null;
  /** @type {string | null} */
  let lastKey = null;

  root.dataset.admire = 'off';

  function emit() {
    for (const fn of listeners) fn({ mode, placard });
  }

  function blocked() {
    if (rewind.active || doc.hidden || hoverChrome) return true;
    const a = doc.activeElement;
    if (a && a !== pause && ((chrome && chrome.contains(a)) || a.classList?.contains('skip-link'))) return true;
    return win.scrollY > engine.layout.D;
  }

  /** The frame on screen: under reduced motion, the still that is showing (§7.5). */
  function shown() {
    const s = engine.snapshot();
    return { s, p: s.reduced ? s.reduced.pShown : s.p };
  }

  function enter() {
    idleTimer = 0;
    if (!armed || mode === 'on') return;
    if (blocked()) {
      arm();
      return;
    }
    mode = 'on';
    root.dataset.admire = 'on';
    ambient.start(win.performance.now());
    const { s, p } = shown();
    const phrase = placardPhrase(s.scene, p);
    const key = `${s.scene}|${phrase.index}`;
    if (key !== lastKey) {
      lastKey = key;
      announce(admireAnnouncement(s.scene, phrase.text, !reduced && !ambient.paused));
    }
    placardTimer = win.setTimeout(showPlacard, PLACARD_MS - IDLE_MS);
    engine.invalidate();
    emit();
  }

  function showPlacard() {
    placardTimer = 0;
    if (mode !== 'on') return;
    const { s, p } = shown();
    if (plateLabel) plateLabel.textContent = placardLabel(s.scene, s.G);
    if (platePhrase) platePhrase.textContent = placardPhrase(s.scene, p).text;
    if (plate) plate.dataset.theme = String(s.scene);
    placard = true;
    root.dataset.placard = 'on';
    emit();
  }

  function exit() {
    if (placardTimer) win.clearTimeout(placardTimer);
    placardTimer = 0;
    travel = 0;
    if (mode === 'off') return;
    mode = 'off';
    placard = false;
    root.dataset.admire = 'off';
    delete root.dataset.placard;
    ambient.stop(win.performance.now());
    engine.invalidate();
    emit();
  }

  function arm() {
    if (idleTimer) win.clearTimeout(idleTimer);
    idleTimer = armed ? win.setTimeout(enter, IDLE_MS) : 0;
  }

  /** @param {Event} e */
  function onPause(e) {
    if (!pause || !(e.target instanceof Node) || !pause.contains(e.target)) return false;
    if (e.type === 'keydown') {
      const k = /** @type {KeyboardEvent} */ (e).key;
      return k === 'Enter' || k === ' ';
    }
    return true;
  }

  /** @param {Event} e */
  function input(e) {
    if (onPause(e)) return;
    if (e.type === 'pointermove') {
      const pe = /** @type {PointerEvent} */ (e);
      if (lastPt) travel += Math.hypot(pe.clientX - lastPt.x, pe.clientY - lastPt.y);
      lastPt = { x: pe.clientX, y: pe.clientY };
      if (travel < MOVE_PX) return;
      travel = 0;
    }
    exit();
    arm();
  }

  const opts = { capture: true, passive: true };
  for (const type of ['wheel', 'keydown', 'pointerdown', 'pointermove', 'touchstart', 'touchmove']) {
    win.addEventListener(type, input, opts);
  }
  engine.on('userscroll', () => {
    armed = true;
    exit();
    arm();
  });
  rewind.on('change', () => (rewind.active ? exit() : arm()));
  doc.addEventListener('visibilitychange', () => (doc.hidden ? exit() : arm()));
  chrome?.addEventListener('pointerenter', () => {
    hoverChrome = true;
  });
  chrome?.addEventListener('pointerleave', () => {
    hoverChrome = false;
    arm();
  });

  return {
    get armed() {
      return armed;
    },
    get mode() {
      return mode;
    },
    get placard() {
      return placard;
    },
    on(evt, fn) {
      if (evt !== 'change') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};
