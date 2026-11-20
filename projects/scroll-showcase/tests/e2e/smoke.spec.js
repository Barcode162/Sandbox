// Smoke (WO-001): the skeleton boots, the hook has its C5 shape, the C7 DOM is present, and the
// pin contract (K4) holds: the stage's top is 0 at y ∈ {0, D/2, D} at 1440×900.
import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function boot(page) {
  /** @type {string[]} */
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto('/');
  await page.evaluate(async () => {
    await window.__showcase.ready;
    await document.fonts.ready;
  });
  return pageErrors;
}

/** @param {import('@playwright/test').Page} page @param {number} y */
async function seek(page, y) {
  return page.evaluate(async (yy) => {
    window.scrollTo({ top: yy, behavior: 'instant' });
    const snap = await window.__showcase.nextFrame();
    return { snap, top: document.getElementById('stage').getBoundingClientRect().top, scrollY: window.scrollY };
  }, y);
}

test.describe('[smoke] skeleton', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('[smoke] boots: data-boot=ready, hook shape per C5, no page errors', async ({ page }) => {
    const pageErrors = await boot(page);
    await expect(page.locator('html')).toHaveAttribute('data-boot', 'ready');
    const shape = await page.evaluate(() => {
      const h = window.__showcase;
      return {
        version: h.version,
        fns: ['progress', 'snapshot', 'stateAt', 'sceneState', 'layout', 'nextFrame', 'frameStats'].filter((k) => typeof h[k] === 'function'),
        errors: h.errors,
        frozen: Object.isFrozen(h),
        snapKeys: Object.keys(h.snapshot()).sort(),
      };
    });
    expect(shape.version).toBe(1);
    expect(shape.fns).toHaveLength(7);
    expect(shape.errors).toEqual([]);
    expect(shape.frozen).toBe(true);
    expect(shape.snapKeys).toEqual(['G', 'admire', 'ambientA', 'p', 'reduced', 'scene', 'state', 'y']);
    expect(pageErrors).toEqual([]);
  });

  test('[smoke] C7 skeleton: one h1, six labelled scenes, nav, live region, colophon credit', async ({ page }) => {
    await boot(page);
    await expect(page).toHaveTitle('Bent Light: six refractions of one white beam');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('section.scene')).toHaveCount(6);
    await expect(page.locator('section.scene > h2.vh')).toHaveCount(6);
    await expect(page.locator('section.scene .art[role=img][aria-label]')).toHaveCount(6);
    await expect(page.locator('section.scene > p.caption')).toHaveCount(6);
    await expect(page.locator('nav#ticks[aria-label="Scenes"] a.tick')).toHaveCount(6);
    await expect(page.locator('#status[role=status][aria-live=polite]')).toHaveCount(1);
    for (const id of ['incidence', 'field', 'refraction', 'dichroic', 'agreement', 'return']) {
      await expect(page.locator(`span.anchor#${id}`)).toHaveCount(1);
    }
    await expect(page.locator('p.colophon-credit')).toContainText('SIL Open Font License 1.1');
    const html = await page.content();
    expect(html).toContain('<!-- bake:s1:start --><!-- bake:s1:end -->');
  });

  test('[smoke] pin contract: stage top = 0 at y = 0, D/2 and D (1440×900)', async ({ page }) => {
    await boot(page);
    const D = await page.evaluate(() => window.__showcase.layout().D);
    expect(D).toBe(13500);
    for (const y of [0, D / 2, D]) {
      const r = await seek(page, y);
      expect(r.scrollY).toBe(y);
      expect(r.top).toBe(0);
      expect(r.snap.y).toBe(y);
    }
    const end = await seek(page, D);
    expect(end.snap.scene).toBe(6);
    expect(end.snap.p).toBe(1);
    expect(end.snap.G).toBe(1);
    // Past D the stage releases and the colophon rises.
    const past = await seek(page, D + 200);
    expect(past.top).toBe(-200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });

  test('[smoke] JS off: opening frame plus colophon, document ≤ 100svh + colophon', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('p.noscript')).toBeVisible();
    await expect(page.locator('#rewind')).toBeHidden();
    await expect(page.locator('#jump')).toBeHidden();
    await expect(page.locator('.colophon-p3')).toBeHidden();
    const m = await page.evaluate(() => ({
      doc: document.documentElement.scrollHeight,
      colophon: document.getElementById('colophon').getBoundingClientRect().height,
      vh: window.innerHeight,
    }));
    expect(m.doc).toBeLessThanOrEqual(m.vh + m.colophon + 1);
    await ctx.close();
  });
});
