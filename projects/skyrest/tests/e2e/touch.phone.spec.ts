// WO-003 touch controls on an emulated iPhone (experience.md §4.6, §12 items 11–12), portrait and landscape:
// a drag on the left half moves the hero, Attack/Dodge taps fire swing/dodge, the buttons sit inside the safe area
// (portrait: sy > 0.82), releasing the stick stops the hero within 6 steps, and the hero reads at ≥ 9 % height.
import type { Page } from '@playwright/test';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { boot, driver, evidenceDir, expect, test, writeEvidence } from './support/harness.ts';

async function touch(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  return { send };
}
/** Chrome delivers pointermove aligned to animation frames: let two frames pass before stepping the sim. */
const frames2 = (page: Page) => page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));

for (const [label, size] of [['portrait', { width: 430, height: 932 }], ['landscape', { width: 932, height: 430 }]] as const) {
  test(`[T-${label}] joystick moves and stops the hero; Attack/Dodge fire; buttons in the safe area`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(size);
    mkdirSync(path.join(evidenceDir(), 'wo-003'), { recursive: true });
    await boot(page);
    const g = driver(page);
    await g.setManual(true);
    await g.setSeed(20261125);
    await g.skipTitle();
    await g.setFlags({ golemPassive: true, heroInvulnerable: true });
    await g.step(2);
    await expect(page.getByTestId('touch-controls')).toHaveClass(/show/);

    // Buttons: inside the viewport/safe area, portrait thumbs zone below sy 0.82.
    const boxes: Record<string, { x: number; y: number; width: number; height: number }> = {};
    for (const id of ['btn-attack', 'btn-dodge', 'btn-skill']) {
      const b = (await page.getByTestId(id).boundingBox())!;
      boxes[id] = b;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(size.width);
      expect(b.y + b.height).toBeLessThanOrEqual(size.height);
      if (label === 'portrait') expect(b.y / size.height, `${id} top sy`).toBeGreaterThan(0.82);
    }

    // Drag on the left half (to the right, onto open ground): the hero moves.
    const t = await touch(page);
    const x0 = size.width * 0.2, y0 = size.height * 0.8;
    const before = (await g.snapshot()).hero.pos;
    await t.send('touchStart', x0, y0);
    await t.send('touchMove', x0 + 25, y0 - 4);
    await t.send('touchMove', x0 + 60, y0 - 6);
    await frames2(page);
    await g.step(30);
    await page.screenshot({ path: path.join(evidenceDir(), 'wo-003', `touch-${label}.jpg`), type: 'jpeg', quality: 80 });
    const moved = (await g.snapshot()).hero;
    const dist = Math.hypot(moved.pos.x - before.x, moved.pos.z - before.z);
    expect(dist, 'hero moved under the stick').toBeGreaterThan(1.5);
    expect(Math.hypot(moved.vel.x, moved.vel.z)).toBeGreaterThan(4);
    // Release: stopped within 6 steps (100 ms), no skid.
    await t.send('touchEnd');
    await frames2(page);
    await g.step(6);
    const stopped = (await g.snapshot()).hero;
    expect(Math.hypot(stopped.vel.x, stopped.vel.z), 'speed after release + 6 steps').toBe(0);

    // Attack and Dodge fire on the first tap.
    // force: the Attack button breathes (never 'stable'); the tap is still a real touch on its centre.
    await page.getByTestId('btn-attack').tap({ force: true });
    await g.step(1);
    expect((await g.events()).some((e) => e.type === 'swing')).toBe(true);
    await g.step(40);
    await page.getByTestId('btn-dodge').tap({ force: true });
    await g.step(1);
    expect((await g.events()).some((e) => e.type === 'dodge')).toBe(true);

    // The hero reads at ~10 % of the screen height (probe, L-0006).
    await g.step(40);
    const probe = await g.probe();
    if (label === 'portrait') expect(probe.hero!.hFrac).toBeGreaterThanOrEqual(0.09);
    writeEvidence(`wo-003/touch-${label}.json`, { viewport: size, buttons: boxes, moved: dist, hero: probe.hero });
  });
}
