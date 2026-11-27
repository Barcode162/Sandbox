// Frame-table captures (WO-001 harness; experience.md §11). Each moment's SCRIPT is owned by a slice
// (src/moments/{world,hero,loop}.ts); this spec only runs them and saves moments/<id>-<viewport>.jpg.
// F2 is also captured at the reference aspect (802×917) for the side-by-side with evidence/reference.jpg.
// F12 (portrait) and F13 (landscape) are the phone frames: they are captured in a touch context (iPhone-class,
// coarse pointer, hasTouch), so the on-screen controls and the touch HUD are what the frame shows (F-023).
import { devices, type Browser, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { boot, evidenceDir, expect, test } from './support/harness.ts';
import { MOMENT_IDS, MOMENT_VIEWPORTS } from '../../src/moments/index.ts';
import type { MomentId } from '../../src/contracts.ts';

const SIZES: Record<string, { width: number; height: number }> = {
  portrait: MOMENT_VIEWPORTS.portrait,
  desktop: MOMENT_VIEWPORTS.desktop,
};
/** Phone frames shot with touch: [moment, viewport]. */
const TOUCH: [MomentId, keyof typeof MOMENT_VIEWPORTS][] = [['F12', 'portrait'], ['F13', 'landscape']];

/** A fresh iPhone-class touch page at `size`; fails the test on any console error or page error. */
async function touchPage(browser: Browser, size: { width: number; height: number }): Promise<{ page: Page; errors: string[]; close: () => Promise<void> }> {
  const ctx = await browser.newContext({ ...devices['iPhone 15 Pro Max'], viewport: size, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return { page, errors, close: () => ctx.close() };
}

async function touchShot(page: Page, name: string): Promise<void> {
  const file = path.join(evidenceDir(), 'screens', `${name}.jpg`);
  mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
}

for (const [label, size] of Object.entries(SIZES)) {
  for (const id of MOMENT_IDS) {
    // One test per moment: SwiftShader is slow, so 13 captures in one test overran any sane timeout.
    test(`[M-${label}] moment ${id} at ${size.width}×${size.height}`, async ({ page, shot, browser }) => {
      test.setTimeout(180_000);
      if (TOUCH.some(([m, vp]) => m === id && vp === label)) {
        const t = await touchPage(browser, size);
        await boot(t.page);
        const r = await t.page.evaluate((m) => window.__skyrest!.moment(m), id);
        expect(r.ok, `${id}: ${r.note}`).toBe(true);
        await expect(t.page.getByTestId('touch-controls')).toHaveClass(/show/);
        await touchShot(t.page, `moments/${id}-${label}`);
        expect(t.errors, 'console errors').toEqual([]);
        await t.close();
        return;
      }
      await page.setViewportSize(size);
      await boot(page);
      const r = await page.evaluate((m) => window.__skyrest!.moment(m), id);
      expect(r.ok, `${id}: ${r.note}`).toBe(true);
      await shot(`moments/${id}-${label}`);
    });
  }
}

test('[M-extra] reference-aspect F2', async ({ page, shot }) => {
  test.setTimeout(180_000);
  await page.setViewportSize(MOMENT_VIEWPORTS.reference);
  await boot(page);
  const r = await page.evaluate(() => window.__skyrest!.moment('F2'));
  expect(r.ok, `F2: ${r.note}`).toBe(true);
  await shot('moments/F2-reference');
});

test('[M-extra] landscape F13 (touch)', async ({ browser }) => {
  test.setTimeout(180_000);
  const t = await touchPage(browser, MOMENT_VIEWPORTS.landscape);
  await boot(t.page);
  const r = await t.page.evaluate(() => window.__skyrest!.moment('F13'));
  expect(r.ok, `F13: ${r.note}`).toBe(true);
  await expect(t.page.getByTestId('touch-controls')).toHaveClass(/show/);
  await touchShot(t.page, 'moments/F13-landscape');
  expect(t.errors, 'console errors').toEqual([]);
  await t.close();
});
