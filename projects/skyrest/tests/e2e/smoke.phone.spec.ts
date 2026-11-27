// Wave-0 phone smoke (WO-001): emulated iPhone (touch), portrait + landscape boot, tap Start.
import { boot, bootFight, expect, REQUIRED_PROBES, test, writeEvidence } from './support/harness.ts';

test('[SP0] portrait: boots, tap Start enters the fight', async ({ page, game, shot }) => {
  await boot(page);
  await shot('SP0-title-portrait');
  await page.getByTestId('start').tap();
  await page.waitForFunction(() => window.__skyrest!.snapshot().phase !== 'title');
  expect((await game.snapshot()).phase).not.toBe('title');
});

test('[SP1] portrait + landscape opening frames are probed', async ({ page, shot }) => {
  for (const [label, size] of [['portrait', { width: 430, height: 932 }], ['landscape', { width: 932, height: 430 }]] as const) {
    await page.setViewportSize(size);
    const g = await bootFight(page);
    const probe = await g.probe();
    for (const name of REQUIRED_PROBES) expect(probe[name]?.visible, `${label} ${name}`).toBe(true);
    writeEvidence(`probe-${label}.json`, { viewport: size, stats: await g.stats(), probe });
    await shot(`SP1-opening-${label}`);
  }
});

test('[SP2] the page never zooms: double tap and pinch are cancelled, a second tap still presses a button', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const fire = (type: string, target: EventTarget, touches = 0) => {
      const list = Array.from({ length: touches }, (_, i) => new Touch({ identifier: i, target, clientX: 100 + i * 40, clientY: 300 }));
      const e = new TouchEvent(type, { bubbles: true, cancelable: true, touches: list, changedTouches: list.length ? list : [new Touch({ identifier: 9, target, clientX: 100, clientY: 300 })] });
      target.dispatchEvent(e);
      return e.defaultPrevented;
    };
    const canvas = document.querySelector('canvas')!;
    const first = fire('touchend', canvas);
    const second = fire('touchend', canvas);
    const pinch = fire('touchmove', canvas, 2);
    const g = new Event('gesturestart', { bubbles: true, cancelable: true });
    document.dispatchEvent(g);
    // A quick second tap on a button still counts as a press.
    const btn = document.querySelector<HTMLButtonElement>('[data-testid="start"]')!;
    let clicks = 0;
    btn.addEventListener('click', () => clicks++);
    fire('touchend', btn);
    return { first, second, pinch, gesture: g.defaultPrevented, clicks, scale: visualViewport?.scale ?? 1 };
  });
  expect(r.first, 'a single tap is left alone').toBe(false);
  expect(r.second, 'the double tap is cancelled').toBe(true);
  expect(r.pinch, 'two-finger move is cancelled').toBe(true);
  expect(r.gesture, 'Safari pinch gesture is cancelled').toBe(true);
  expect(r.clicks, 'the second tap still pressed the button').toBe(1);
  await page.touchscreen.tap(200, 500);
  await page.touchscreen.tap(200, 500);
  expect(await page.evaluate(() => visualViewport?.scale ?? 1)).toBe(1);
});
