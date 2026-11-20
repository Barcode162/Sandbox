// chrome/chrome.js: the progress rail, scene label, scene ticks, pause control and colophon buttons
// (spec §8). Everything here writes on engine 'frame' / 'scene' events; nothing reads layout.

import { COPY } from '../core/copy.js';

/** @type {import('../types.js').CreateChrome} */
export const createChrome = function createChrome({ engine, ambient, rewind, announce, doc, reduced }) {
  const root = doc.documentElement;
  const label = doc.getElementById('scene-label');
  const rail = doc.getElementById('rail');
  const ticks = /** @type {HTMLAnchorElement[]} */ ([...doc.querySelectorAll('#ticks .tick')]);
  const pause = /** @type {HTMLButtonElement | null} */ (doc.getElementById('pause'));
  const pauseLabel = pause?.querySelector('.pause-label');
  const rewindBtn = /** @type {HTMLButtonElement | null} */ (doc.getElementById('rewind'));
  const jumpBtn = doc.getElementById('jump');

  let lastG = -1;
  /** @param {import('../types.js').Snapshot} s */
  function onFrame(s) {
    const g = Math.round(s.G * 1000) / 1000;
    if (g !== lastG && rail) {
      lastG = g;
      rail.style.setProperty('--g', String(g));
    }
    root.dataset.scene = String(s.scene);
  }

  /** @param {import('../types.js').SceneId} id */
  function onScene(id) {
    if (label) label.textContent = `${String(id).padStart(2, '0')} · ${COPY.sceneNames[id - 1]}`;
    ticks.forEach((t, i) => {
      if (i === id - 1) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
  }

  function renderPause() {
    if (!pause || !pauseLabel) return;
    if (reduced) {
      pause.disabled = true;
      pause.setAttribute('aria-pressed', 'true');
      pause.title = COPY.pause.reduced;
      pauseLabel.textContent = COPY.pause.reduced;
      return;
    }
    pause.setAttribute('aria-pressed', String(ambient.paused));
    pauseLabel.textContent = ambient.paused ? COPY.pause.paused : COPY.pause.on;
  }

  pause?.addEventListener('click', () => {
    ambient.setPaused(!ambient.paused);
    announce(ambient.paused ? COPY.status.breathingPaused : COPY.status.breathingOn);
  });
  ambient.on('change', renderPause);
  renderPause();

  if (rewindBtn) {
    rewindBtn.textContent = reduced ? COPY.rewind.runReduced : COPY.rewind.run;
    rewindBtn.addEventListener('click', () => (rewind.active ? rewind.stop('input') : rewind.start()));
  }
  jumpBtn?.addEventListener('click', () => rewind.jumpToStart());

  engine.on('frame', onFrame);
  engine.on('scene', onScene);
  onScene(engine.snapshot().scene);
};
