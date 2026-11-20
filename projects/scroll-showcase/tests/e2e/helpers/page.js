// helpers/page.js: booting the piece, seeking to a scroll position, and screenshots.
//
// The determinism discipline (architecture K11, "Determinism discipline"):
//   1. wait for `__showcase.ready` and `document.fonts.ready`;
//   2. seek with `scrollTo({ top, behavior: 'instant' })` (overrides CSS `scroll-behavior: smooth`);
//   3. await `__showcase.nextFrame()`, which resolves after the frame for that scrollY is applied,
//      falling back to two requestAnimationFrame callbacks if the hook has no `nextFrame`;
//   4. breathing is stored off (`localStorage['bentlight.breathing'] = 'off'` before `goto`)
//      unless the test is about breathing.
// No sleeps: `waitForTimeout` is banned in tests/e2e (static guard 6).

import { expect } from '@playwright/test';
import { evidencePath } from './evidence.js';

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('../../../site/js/types.js').Snapshot} Snapshot */
/** @typedef {import('../../../site/js/types.js').Layout} Layout */
/** @typedef {import('../../../site/js/types.js').SceneState} SceneState */

/**
 * Everything drawn by chrome rather than by the scene: the header (wordmark, label, rail, ticks),
 * the pause control, the placard, the error chip, the captions, the skip link and the noscript
 * banner. Chrome runs CSS transitions on wall time (C6: caption cross-fades, admire fades), which
 * are not a function of scroll position, so rendered-frame fingerprints of the *art* hide it.
 * Chrome's own states are WO-019's (behaviour suite).
 */
export const CHROME_SELECTORS = ['#chrome', '#pause', '#placard', '#error-chip', '.caption', '.skip-link', '.noscript'];
export const HIDE_CHROME_CSS = `${CHROME_SELECTORS.join(', ')} { visibility: hidden !important; }`;

/** Section ids per scene, from the C7 skeleton. */
export const SCENE_SECTION = /** @type {const} */ ({
  1: '#scene-incidence',
  2: '#scene-field',
  3: '#scene-refraction',
  4: '#scene-dichroic',
  5: '#scene-agreement',
  6: '#scene-return',
});

/** The five §11.1 viewports. */
export const VIEWPORTS = /** @type {const} */ ([
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]);

/**
 * Collect page errors, unhandled rejections and console errors from the moment it is called.
 * @param {Page} page
 * @returns {{ pageErrors: string[]; consoleErrors: string[] }}
 */
export function watchErrors(page) {
  /** @type {string[]} */
  const pageErrors = [];
  /** @type {string[]} */
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  return { pageErrors, consoleErrors };
}

/**
 * Store breathing off before any page script runs (C5: tests control breathing only through
 * storage or real UI).
 * @param {Page} page
 */
export async function breathingOff(page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('bentlight.breathing', 'off');
    } catch {
      /* storage blocked: the piece defaults to on; the test will see it */
    }
  });
}

/**
 * Wait for the piece to be ready: the first applied frame and the fonts.
 * @param {Page} page
 */
export async function ready(page) {
  await page.waitForFunction(() => typeof window.__showcase === 'object' && window.__showcase !== null);
  await page.evaluate(async () => {
    await window.__showcase.ready;
    await document.fonts.ready;
  });
}

/**
 * goto + ready, with breathing stored off unless `{ breathing: true }`.
 * @param {Page} page
 * @param {{ path?: string; breathing?: boolean }} [opts]
 */
export async function boot(page, opts = {}) {
  if (!opts.breathing) await breathingOff(page);
  await page.goto(opts.path ?? '/');
  await ready(page);
}

/**
 * Seek to y: instant scroll, then wait for the frame for that scrollY to be applied.
 * Returns the applied snapshot plus the real scrollY.
 * @param {Page} page
 * @param {number} y
 * @returns {Promise<{ snap: Snapshot; scrollY: number }>}
 */
export async function seek(page, y) {
  return page.evaluate(async (yy) => {
    window.scrollTo({ top: yy, behavior: 'instant' });
    const hook = window.__showcase;
    if (hook && typeof hook.nextFrame === 'function') {
      const snap = await hook.nextFrame();
      return { snap, scrollY: window.scrollY };
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { snap: /** @type {any} */ (null), scrollY: window.scrollY };
  }, y);
}

/** @param {Page} page @returns {Promise<Layout>} */
export async function layout(page) {
  return page.evaluate(() => window.__showcase.layout());
}

/** @param {Page} page @returns {Promise<Snapshot>} */
export async function snapshot(page) {
  return page.evaluate(() => window.__showcase.snapshot());
}

/** @param {Page} page @param {number} y @returns {Promise<Snapshot>} */
export async function stateAt(page, y) {
  return page.evaluate((yy) => window.__showcase.stateAt(yy), y);
}

/** @param {Page} page @param {1|2|3|4|5|6} id @param {number} p @returns {Promise<SceneState>} */
export async function sceneState(page, id, p) {
  return page.evaluate(([i, pp]) => window.__showcase.sceneState(/** @type {any} */ (i), pp), /** @type {[number, number]} */ ([id, p]));
}

/**
 * Integer scroll position for local progress p in scene s (1-based), per §3.2:
 * y = Y_s + p·L_s, rounded, and kept inside the scene (p = 1 maps to Y_{s+1} − 1 except in S6).
 * @param {Layout} L @param {number} s @param {number} p
 */
export function yFor(L, s, p) {
  const Y0 = L.Y[s - 1];
  const len = L.L[s - 1];
  let y = Math.round(Y0 + p * len);
  if (s < 6) y = Math.min(y, L.Y[s] - 1);
  else y = Math.min(y, L.D);
  return Math.max(Y0, y);
}

/**
 * Viewport screenshot (PNG buffer), caret hidden, CSS animations allowed (never 'disabled', which
 * would fast-forward transitions and hide the defects E-D1/E-D2 exist to catch).
 * @param {Page} page
 * @param {{ hideChrome?: boolean; scale?: 'css' | 'device'; mask?: import('@playwright/test').Locator[]; style?: string }} [opts]
 */
export async function screenshot(page, opts = {}) {
  const hideChrome = opts.hideChrome ?? true;
  const style = [hideChrome ? HIDE_CHROME_CSS : '', opts.style ?? ''].join('\n');
  return page.screenshot({
    caret: 'hide',
    scale: opts.scale ?? 'device',
    mask: opts.mask,
    style: style.trim() || undefined,
  });
}

/**
 * Screenshot into $EVIDENCE_DIR/<name>.png (name may include sub-directories).
 * @param {Page} page @param {string} name
 * @param {Parameters<typeof screenshot>[1]} [opts]
 */
export async function shot(page, name, opts = {}) {
  const buf = await screenshot(page, opts);
  const file = evidencePath(name.endsWith('.png') ? name : `${name}.png`);
  const fs = await import('node:fs');
  fs.writeFileSync(file, buf);
  return { buf, file };
}

/**
 * The (u, v) → page (x, y) map of K5: landscape x = u, y = v; portrait (matrix(0,1,1,0)) x = v, y = u.
 * Offsets are the .uv box origin in CSS px.
 * @param {{ landscape: boolean }} vp @param {number} u @param {number} v @param {{ x: number; y: number }} [origin]
 */
export function uvToXY(vp, u, v, origin = { x: 0, y: 0 }) {
  return vp.landscape ? { x: origin.x + u, y: origin.y + v } : { x: origin.x + v, y: origin.y + u };
}

/**
 * Origin of a scene's .uv box in CSS px (test-side read; the product never reads layout here).
 * @param {Page} page @param {1|2|3|4|5|6} scene
 */
export async function uvOrigin(page, scene) {
  return page.evaluate((sel) => {
    const r = document.querySelector(`${sel} .uv`)?.getBoundingClientRect();
    return { x: r ? r.left : 0, y: r ? r.top : 0 };
  }, SCENE_SECTION[scene]);
}

/**
 * Let real time pass with requestAnimationFrame free-running (no page.clock, no waitForTimeout):
 * resolves once at least `ms` of performance.now() have elapsed AND at least `frames` rAF
 * callbacks have run. Returns the measured { ms, frames }.
 * @param {Page} page @param {number} ms @param {number} frames
 */
export async function realTime(page, ms, frames) {
  return page.evaluate(
    ([wantMs, wantFrames]) =>
      new Promise((resolve) => {
        const t0 = performance.now();
        let n = 0;
        const tick = () => {
          n++;
          const dt = performance.now() - t0;
          if (dt >= wantMs && n >= wantFrames) resolve({ ms: dt, frames: n });
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    [ms, frames],
  );
}

/**
 * Assert the piece raised nothing: no page errors, no console errors, an empty F9 ledger.
 * @param {Page} page @param {{ pageErrors: string[]; consoleErrors: string[] }} watched
 */
export async function expectHealthy(page, watched) {
  expect(watched.pageErrors, 'page errors').toEqual([]);
  expect(watched.consoleErrors, 'console errors').toEqual([]);
  expect(await page.evaluate(() => window.__showcase.errors), '__showcase.errors').toEqual([]);
}
