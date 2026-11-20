// main.js: boot. Creates the C4 runtime objects in their contract order:
// env → ambient → engine → rewind → admire → chrome, then sets html[data-boot=ready] in the write
// phase of the first applied frame (before __showcase.ready resolves).
// Every factory is wired from wave 0 (WO-001 stubs), so wave-2 work orders replace factory bodies
// only and never edit this file. A factory that throws is recorded in the engine's error ledger
// under its own phase and replaced by an inert object, so the piece keeps scrolling (F9).
// Owner chain: WO-001 → WO-006 → WO-014 → WO-025 → WO-024.

import scenes from './scenes/index.js';
import { prefersReduced, safeStorage } from './core/env.js';
import { createAnnounce } from './core/announce.js';
import { createAmbient } from './engine/ambient.js';
import { createEngine } from './engine/engine.js';
import { createRewind } from './engine/rewind.js';
import { createAdmire } from './engine/admire.js';
import { createChrome } from './chrome/chrome.js';

/** @typedef {import('./types.js').RewindCtl} RewindCtl */
/** @typedef {import('./types.js').AdmireCtl} AdmireCtl */

const doc = document;
const win = window;
const off = () => () => {};

// env
const reduced = prefersReduced(win);
const announce = createAnnounce(doc, win);
// ambient
const ambient = createAmbient({ reduced, storage: safeStorage });
// engine
const engine = createEngine({ scenes, doc, win, reduced, ambient });
const stopBoot = engine.on('frame', () => {
  stopBoot();
  doc.documentElement.dataset.boot = 'ready';
});

/**
 * @template T
 * @param {'rewind' | 'admire' | 'chrome'} phase
 * @param {() => T} make
 * @param {T} inert
 * @returns {T}
 */
function guarded(phase, make, inert) {
  try {
    return make();
  } catch (err) {
    engine.reportError({ scene: null, phase, message: err instanceof Error ? err.message : String(err) });
    return inert;
  }
}

// rewind
/** @type {RewindCtl} */
const rewind = guarded('rewind', () => createRewind({ engine, announce, reduced, doc }), {
  active: false, start() {}, stop() {}, jumpToStart() {}, on: off,
});
// admire
/** @type {AdmireCtl} */
const admire = guarded('admire', () => createAdmire({ engine, ambient, rewind, announce, doc, win, reduced }), {
  armed: false, mode: 'off', placard: false, on: off,
});
// chrome
guarded('chrome', () => createChrome({ engine, admire, ambient, rewind, announce, doc, reduced }), undefined);
