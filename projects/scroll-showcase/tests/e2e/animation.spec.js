// tests/e2e/animation.spec.js: what "correct animation" means for Bent Light.
//
// The piece makes four promises, and each test below checks one of them in a real browser:
//   1. Scroll position decides the picture. The same position always draws the same pixels, a
//      stopped frame does not drift, and scrolling back rewinds exactly.
//   2. Every scene starts and ends where the spec says, and each scene's last frame is the next
//      scene's first, so the hand-offs are seamless.
//   3. Stopping is rewarded. About a second after you stop, the controls step aside, the scene
//      breathes, and a placard names the frame; any input brings everything back at once.
//   4. It is safe and usable: no console errors, no horizontal scroll, no serious accessibility
//      violations, and no breathing for people who ask their device for reduced motion.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HIDE_CHROME = '#chrome, #pause, #placard, .caption, .skip-link { visibility: hidden !important; }';
// While admiring, the pause control stays on screen (it has to stay operable) and holds still.
const HIDE_ADMIRE = '#chrome, #placard, .caption, .skip-link { visibility: hidden !important; }';

/** @param {import('@playwright/test').Page} page */
async function frame(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** Load the piece with breathing switched off, so frames depend on scroll position alone. */
async function openStill(page) {
  await page.addInitScript(() => localStorage.setItem('bentlight.breathing', 'off'));
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.addStyleTag({ content: HIDE_CHROME });
}

/** @param {import('@playwright/test').Page} page @param {number} scene 1..6 @param {number} p 0..1 */
async function yFor(page, scene, p) {
  return page.evaluate(
    ([s, q]) => {
      const L = window.__showcase.layout();
      const lo = L.Y[s - 1];
      const hi = s < 6 ? L.Y[s] - 1 : L.Y[5] + L.L[5] - 1;
      // Search the engine's own mapping for the scroll offset whose local progress is closest to q.
      let best = lo;
      let err = Infinity;
      for (let y = lo; y <= hi; y += 4) {
        const st = window.__showcase.stateAt(y);
        if (st.scene !== s) continue;
        const e = Math.abs(st.p - q);
        if (e < err) {
          err = e;
          best = y;
        }
      }
      return best;
    },
    [scene, p],
  );
}

/** @param {import('@playwright/test').Page} page @param {number} y */
async function scrollAndShoot(page, y) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await frame(page);
  return page.screenshot();
}

test.describe('1 · scroll position decides the picture', () => {
  test('the same scroll position always draws the same pixels, in every scene', async ({ page }) => {
    await openStill(page);
    for (const [s, p] of [[1, 0.5], [2, 0.4], [3, 0.5], [4, 0.5], [5, 0.6], [6, 0.8]]) {
      const y = await yFor(page, s, p);
      const first = await scrollAndShoot(page, y);
      await scrollAndShoot(page, 0);
      await scrollAndShoot(page, y + 1500);
      const again = await scrollAndShoot(page, y);
      expect(again.equals(first), `scene ${s} at p=${p} redrew differently`).toBe(true);
    }
  });

  test('a fresh visit draws the same frame too: nothing depends on chance or the clock', async ({ page }) => {
    await openStill(page);
    const ys = [];
    const shots = [];
    for (const [s, p] of [[1, 0.3], [3, 0.5], [4, 0.5], [4, 0.85], [5, 0.5]]) {
      ys.push(await yFor(page, s, p));
      shots.push(await scrollAndShoot(page, ys[ys.length - 1]));
    }
    // A new visit, not a reload: a reload's scroll restoration is a separate, known limitation (README).
    await page.goto('about:blank');
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.addStyleTag({ content: HIDE_CHROME });
    for (let i = 0; i < ys.length; i++) {
      expect((await scrollAndShoot(page, ys[i])).equals(shots[i]), `frame ${i} changed after a reload`).toBe(true);
    }
  });

  test('a stopped frame holds still: nothing drifts while you look', async ({ page }) => {
    await openStill(page);
    const y = await yFor(page, 4, 0.5);
    const a = await scrollAndShoot(page, y);
    await page.waitForTimeout(2500);
    await frame(page);
    const b = await page.screenshot();
    expect(b.equals(a)).toBe(true);
  });

  test('scrolling back rewinds every scene exactly', async ({ page }) => {
    await openStill(page);
    const D = await page.evaluate(() => window.__showcase.layout().D);
    const probes = [0.03, 0.21, 0.37, 0.55, 0.72, 0.9].map((g) => Math.round(g * D));
    const forward = [];
    for (const y of probes) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
      await frame(page);
      forward.push(await page.evaluate(() => window.__showcase.snapshot().state));
    }
    for (let i = probes.length - 1; i >= 0; i--) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), probes[i]);
      await frame(page);
      expect(await page.evaluate(() => window.__showcase.snapshot().state)).toEqual(forward[i]);
    }
  });

  test('the first 40 px of scroll already visibly changes the opening frame', async ({ page }) => {
    await openStill(page);
    const a = await page.evaluate(() => window.__showcase.stateAt(0).state.params);
    const b = await page.evaluate(() => window.__showcase.stateAt(40).state.params);
    expect(b.spread - a.spread).toBeGreaterThan(3);
    expect(b.split).toBeGreaterThan(2);
  });
});

test.describe('2 · every scene starts and ends where the spec says', () => {
  test('documented endpoints', async ({ page }) => {
    await openStill(page);
    const S = (/** @type {any} */ id, /** @type {number} */ p) =>
      page.evaluate(([i, q]) => window.__showcase.sceneState(/** @type {any} */ (i), q), [id, p]);
    const s1a = await S(1, 0);
    expect(s1a.params).toMatchObject({ rot: 0, spread: 6, split: 0, titleOpacity: 1, cueOpacity: 1, s: 0, prismOpacity: 1 });
    const s1b = await S(1, 1);
    expect(s1b.params).toMatchObject({ s: 1, prismOpacity: 0, titleOpacity: 0, spread: 60 });
    expect(s1b.geom.ground).toBe('bands');

    const s4a = await S(4, 0);
    expect(s4a.params).toMatchObject({ J: 0, facetAlpha: 0, glassAlpha: 1, bandsAlpha: 0 });
    const s4b = await S(4, 1);
    expect(s4b.params).toMatchObject({ J: 0, bandsAlpha: 1, quant: 1, wpAlpha: 0 });
    expect(s4b.geom.ground).toBe('bands');

    const s6a = await S(6, 0);
    expect(s6a.params).toMatchObject({ widen: 0, draw: 0, card: 0 });
    expect(s6a.geom.ground).toBe('ink');
    const s6b = await S(6, 1);
    expect(s6b.params).toMatchObject({ widen: 1, mix: 1, draw: 1, beam: 1, glass: 1, card: 1 });
    expect(s6b.geom.ground).toBe('wall');
  });

  test('each scene ends on the same seven bands the next one starts with', async ({ page }) => {
    await openStill(page);
    for (const [a, b] of [[1, 2], [4, 5]]) {
      const end = await page.evaluate((i) => window.__showcase.sceneState(/** @type {any} */ (i), 1).geom.bandRects, a);
      const start = await page.evaluate((i) => window.__showcase.sceneState(/** @type {any} */ (i), 0).geom.bandRects, b);
      expect(end, `scene ${a} → ${b}`).toEqual(start);
    }
  });

  test('every 5% of the scroll draws a finished frame with no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await openStill(page);
    const D = await page.evaluate(() => window.__showcase.layout().D);
    for (let g = 0; g <= 1.0001; g += 0.05) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), Math.round(g * D));
      await frame(page);
    }
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => {
      const e = /** @type {any} */ (window.__showcase).errors;
      return JSON.parse(JSON.stringify(typeof e === 'function' ? e() : e));
    })).toEqual([]);
  });
});

test.describe('3 · stopping is rewarded', () => {
  test('admire mode: controls step aside, a placard names the frame, any key brings them back', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
    const html = page.locator('html');
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 2400);
    await expect(html).toHaveAttribute('data-admire', 'off');
    await expect(html).toHaveAttribute('data-admire', 'on', { timeout: 3000 });
    await expect(page.locator('#chrome')).toBeHidden({ timeout: 2000 });
    await expect(page.locator('#pause')).toBeVisible();
    await expect(page.locator('#status')).toContainText('Admire mode');
    await expect(html).toHaveAttribute('data-placard', 'on', { timeout: 4000 });
    await expect(page.locator('.placard-label')).toHaveText(/^0\d · [A-Z]+ · HELD AT \d+%$/);
    await expect(page.locator('.placard-phrase')).not.toBeEmpty();

    await page.keyboard.press('Shift');
    await expect(html).toHaveAttribute('data-admire', 'off');
    await expect(page.locator('#chrome')).toBeVisible();
  });

  test('the scene breathes while you admire it, and the pause control stops it without leaving', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
    const y = await yFor(page, 4, 0.5);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 200);
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
    await frame(page);
    const hideAll = await page.addStyleTag({ content: HIDE_CHROME });
    const still = await page.screenshot(); // the frame itself, before any breathing
    await hideAll.evaluate((n) => /** @type {Element} */ (n).remove());
    await expect(page.locator('html')).toHaveAttribute('data-admire', 'on', { timeout: 3000 });
    await page.addStyleTag({ content: HIDE_ADMIRE });
    await page.waitForTimeout(2500);
    const a = await page.screenshot();
    await page.waitForTimeout(1500);
    const b = await page.screenshot();
    expect(b.equals(a), 'the picture should breathe in admire mode').toBe(false);

    await page.locator('#pause').click();
    await expect(page.locator('#pause')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-admire', 'on');
    // Let the pause control's own hover fade (600 ms) finish; after that nothing may move.
    await page.waitForTimeout(1000);
    await page.addStyleTag({ content: HIDE_CHROME });
    const c = await page.screenshot();
    expect(c.equals(still), 'pausing returns the picture exactly to its frame').toBe(true);
    await page.waitForTimeout(1500);
    const d = await page.screenshot();
    expect(d.equals(c), 'paused breathing must hold the frame').toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('bentlight.breathing'))).toBe('off');
  });

  test('"Run it backwards" plays the whole piece in reverse to the first beam', async ({ page }) => {
    await openStill(page);
    await page.locator('#rewind').scrollIntoViewIfNeeded();
    const start = await page.evaluate(() => window.scrollY);
    await page.locator('#rewind').click();
    await page.waitForTimeout(3000);
    const mid = await page.evaluate(() => window.scrollY);
    expect(mid).toBeLessThan(start);
    expect(mid).toBeGreaterThan(0);
    await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 9000 });
    await expect(page.locator('#status')).toHaveText('Back at the first beam.');
  });

  test('scene ticks jump to each scene and mark it current', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
    await page.locator('.tick[data-scene="4"]').click();
    await expect(page.locator('#scene-label')).toHaveText('04 · Dichroic');
    await expect(page.locator('.tick[data-scene="4"]')).toHaveAttribute('aria-current', 'true');
  });
});

test.describe('4 · safe and usable', () => {
  test('reduced motion: admire mode still works, but nothing breathes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
    await expect(page.locator('#pause')).toBeDisabled();
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 3000);
    await expect(page.locator('html')).toHaveAttribute('data-admire', 'on', { timeout: 3000 });
    await page.addStyleTag({ content: HIDE_CHROME });
    await page.waitForTimeout(2000);
    const a = await page.screenshot();
    await page.waitForTimeout(1500);
    expect((await page.screenshot()).equals(a)).toBe(true);
  });

  for (const [w, h] of [[375, 812], [768, 1024], [1440, 900], [1920, 1080]]) {
    test(`${w}×${h}: no horizontal scroll and no serious accessibility violations`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
      for (const g of [0, 0.5, 1]) {
        await page.evaluate((v) => window.scrollTo({ top: v * document.documentElement.scrollHeight, behavior: 'instant' }), g);
        await frame(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await frame(page);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});
