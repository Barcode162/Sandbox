// contracts/clock-probe.spec.js: the timing semantics the behaviour suites build on (K11, E5, R4).
//
// These are facts about Playwright 1.63.0's page.clock and Chromium here, not about the piece.
// They run in every verify so that a tooling change which breaks them turns the suite red instead
// of silently turning every timing test into a measurement of nothing. Their console output is
// quoted at the top of helpers/admireClock.js.
//
// The fixture page is served by page.route, so it touches no product file.
import { test, expect } from '@playwright/test';
import { installClock, seekTransitions, transitionTiming } from '../helpers/admireClock.js';
import { realTime } from '../helpers/page.js';

const FIXTURE = '/__probe__/clock.html';
const HTML = `<!doctype html><html><head><style>
  #fade { width: 100px; height: 100px; background: #000; opacity: 1; transition: opacity 900ms linear 200ms; }
  #fade.out { opacity: 0; }
</style></head><body><div id="fade"></div></body></html>`;

/** @param {import('@playwright/test').Page} page */
async function openFixture(page) {
  await page.route(`**${FIXTURE}`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: HTML }));
  await page.goto(FIXTURE);
}

/** A second, unclocked page in a fresh context: its rAF measures real time while the first is paused. */
async function freePage(/** @type {import('@playwright/test').Browser} */ browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await openFixture(page);
  return { ctx, page };
}

test.describe('[K11] clock probe', () => {
  test('[K11] probe 1: rAF is frozen while the clock is paused', async ({ page, browser }) => {
    await installClock(page);
    await openFixture(page);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 1000);
    await page.evaluate(() => {
      /** @type {any} */ (window).__rafCount = 0;
      const tick = () => {
        /** @type {any} */ (window).__rafCount++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const free = await freePage(browser);
    const real = await realTime(free.page, 500, 20);
    const frozen = await page.evaluate(() => /** @type {any} */ (window).__rafCount);
    console.log(`[K11] probe 1: paused page rAF callbacks: ${frozen} while a free page ran ${real.frames} rAF over ${Math.round(real.ms)} ms of real time`);
    expect(real.frames).toBeGreaterThanOrEqual(20);
    expect(frozen).toBe(0);
    await free.ctx.close();
  });

  test('[K11] probe 2: setTimeout is advanced by clock.runFor', async ({ page }) => {
    await installClock(page);
    await openFixture(page);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 1000);
    await page.evaluate(() => {
      /** @type {any} */ (window).__fired = false;
      setTimeout(() => (/** @type {any} */ (window).__fired = true), 1200);
    });
    await page.clock.runFor(1199);
    const before = await page.evaluate(() => /** @type {any} */ (window).__fired);
    await page.clock.runFor(1);
    const after = await page.evaluate(() => /** @type {any} */ (window).__fired);
    console.log(`[K11] probe 2: after runFor(1199): fired=${before} · after runFor(1): fired=${after}`);
    expect(before).toBe(false);
    expect(after).toBe(true);
  });

  test('[K11] probe 3: CSS transitions are NOT advanced by clock.runFor while paused', async ({ page, browser }) => {
    await installClock(page);
    await openFixture(page);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 1000);
    await page.evaluate(() => {
      const el = document.getElementById('fade');
      getComputedStyle(el).opacity; // flush, so the class change starts a transition
      el.classList.add('out');
    });
    await page.clock.runFor(450);
    const afterRunFor = await page.evaluate(() => getComputedStyle(document.getElementById('fade')).opacity);
    // Real time, measured by an unclocked page's rAF: the transition runs on wall time.
    const free = await freePage(browser);
    await realTime(free.page, 1300, 30);
    await free.ctx.close();
    const afterReal = await page.evaluate(() => getComputedStyle(document.getElementById('fade')).opacity);
    console.log(`[K11] probe 3: opacity after runFor(450): ${afterRunFor} · after ≥ 1300 ms of real time: ${afterReal}`);
    expect(afterRunFor).toBe('1');
    expect(afterReal).toBe('0');
  });

  test('[K11] probe 4: seeking a paused CSSTransition currentTime gives exact values', async ({ page }) => {
    await openFixture(page);
    await page.evaluate(() => {
      const el = document.getElementById('fade');
      getComputedStyle(el).opacity;
      el.classList.add('out');
    });
    const timing = await transitionTiming(page, '#fade', 'opacity');
    /** @type {Record<string, number>} */
    const seen = {};
    for (const t of [0, 200, 650, 1100]) {
      const r = await seekTransitions(page, '#fade', 'opacity', t);
      expect(r.count).toBe(1);
      seen[t] = Number(r.values[0]);
    }
    console.log(`[K11] probe 4: 900 ms / 200 ms-delay linear fade 1 → 0: ${JSON.stringify(seen)} · timing ${JSON.stringify({ duration: timing.duration, delay: timing.delay, easing: timing.easing })}`);
    expect(timing).toMatchObject({ count: 1, duration: 900, delay: 200, easing: 'linear' });
    expect(seen).toEqual({ 0: 1, 200: 1, 650: 0.5, 1100: 0 });
  });
});
