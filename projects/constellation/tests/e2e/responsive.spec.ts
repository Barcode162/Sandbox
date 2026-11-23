// Acceptance by eye (experience.md §19): 375×812 and 1024×768 frames, plus the no-WebGL state.
import { expect, test } from './support/harness.ts';
import { idle, nodePoint, open, overlaps, state } from './support/app.ts';

test.describe.configure({ timeout: 120_000 });

test.describe('375×812', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('F1, F3 as bottom sheet, F10 in sheet, Store validation', async ({ page, scan, shot }) => {
    await open(page);
    await page.waitForFunction(() => window.__constellation!.clock!.now() >= 6000);
    let s = await state(page);
    expect(s.labelsShown).toBeLessThanOrEqual(18);
    expect(overlaps(s.labelRects)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await shot('F1-idle-375');
    await scan();

    const t = await nodePoint(page, 'Temperature');
    await page.touchscreen.tap(t.x, t.y);
    await page.waitForTimeout(1000);
    await idle(page);
    s = await state(page);
    expect(s.selected).toBe('temperature');
    const insp = page.locator('#inspector');
    await expect(insp).toBeVisible();
    const box = (await insp.boundingBox())!;
    expect(box.y + box.height).toBeCloseTo(812, 0);
    // The selection sits above the sheet.
    const p = await nodePoint(page, 'Temperature');
    expect(p.y).toBeLessThan(box.y);
    await shot('F3-sheet-375');
    await page.locator('#inspector .insp-close').click();

    await page.keyboard.press('p');
    const card = page.locator('.pcard', { hasText: 'Simmer until done' });
    await card.getByRole('button', { name: '2×' }).click();
    await card.getByRole('button', { name: /^Run/ }).click();
    await expect(card.locator('.result .out')).toHaveText('Done after 2 stirs · heat 100 °C', { timeout: 30_000 });
    await idle(page);
    await shot('F10-sheet-375');
    await page.keyboard.press('Escape');

    await page.keyboard.press('n');
    await page.locator('dialog.sheet').getByRole('button', { name: 'Store it' }).click();
    await expect(page.locator('#store-name-err')).toHaveText('Give it a name, even one word.');
    await shot('Store-validation-375');
    await scan();
  });
});

test.describe('1024×768', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('F1, F3 with drawer + inspector (rail), F7', async ({ page, scan, shot }) => {
    await open(page);
    await page.waitForFunction(() => window.__constellation!.clock!.now() >= 6000);
    expect(overlaps((await state(page)).labelRects)).toEqual([]);
    await shot('F1-idle-1024');
    await page.keyboard.press('r');
    await page.getByRole('button', { name: 'Try the featured route: A → Z' }).click();
    await page.waitForTimeout(4400);
    await expect(page.locator('#route-verdict')).toHaveText('25 hops → 3 hops · 88% shorter');
    await page.mouse.move(1000, 700);
    await shot('F7-route-complete-1024');
    const t = await nodePoint(page, 'Temperature');
    await page.mouse.click(t.x, t.y);
    await page.waitForTimeout(1000);
    await idle(page);
    await expect(page.locator('#drawer')).toHaveClass(/rail/);
    await expect(page.locator('#inspector')).toBeVisible();
    await page.mouse.move(1000, 750);
    await shot('F3-rail-1024');
    await scan();
  });
});

test('no WebGL: a calm explanation and an export, no console errors', async ({ page, shot }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/.test(type)) return null;
      return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('./?seed=1');
  await page.waitForFunction(() => window.__constellation?.ready === true);
  await expect(page.locator('.nogl')).toContainText('This memory needs WebGL to draw, and this browser has it off or unsupported. Your data is safe: you can still export it.');
  await expect(page.getByRole('button', { name: 'Export my memory' })).toBeVisible();
  await shot('NoWebGL-1440');
});
