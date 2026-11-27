// WO-004 game loop (experience.md §3, §8, §12): title → Start → fight → scripted kill → coins fly into the pill
// (+GOLEM.coinsOnDeath, one tick per coin) → NEXT WAVE → control ≤ 1.8 s; FALLEN → TRY AGAIN likewise; pause via
// the gear and Esc freezes the sim; settings persist; QUALITY switches the tier; the nameplate stays on screen and
// clear of the coin pill. (Heap: loop-heap.spec.ts, which needs its own browser flags.)
import { boot, expect, test, writeEvidence } from './support/harness.ts';
import type { Page } from '@playwright/test';
import { GOLEM, MINION } from '../../src/tuning/golem.ts';
import { START_COINS } from '../../src/core/sim.ts';

const coinsShown = (page: Page) => page.getByTestId('coins').innerText().then((t) => Number(t.replace(/[^0-9]/g, '')));
const phase = (page: Page) => page.evaluate(() => window.__skyrest!.snapshot().phase);

/** In manual mode: mash attack (golem passive, hero safe) until the Guardian dies. One render per call. */
async function scriptedKill(page: Page): Promise<void> {
  await page.evaluate(() => {
    const h = window.__skyrest!;
    h.setFlags({ golemPassive: true, heroInvulnerable: true });
    for (let i = 0; i < 30; i++) {
      const g = h.snapshot().golem;
      if (g.action === 'dying' || g.action === 'dead') return;
      h.inject({ attack: true }, 120); // held attack: the input buffer chains the combo
      h.step(120);
    }
  });
  const g = await page.evaluate(() => window.__skyrest!.snapshot().golem.action);
  expect(['dying', 'dead']).toContain(g);
}

/** Mean rAF interval (ms): SwiftShader under load can drop below the stepper's catch-up cap (15 steps/frame). */
const frameMs = (page: Page) =>
  page.evaluate(() => new Promise<number>((res) => {
    const t0 = performance.now();
    let n = 0;
    const f = () => (++n < 6 ? requestAnimationFrame(f) : res((performance.now() - t0) / 6));
    requestAnimationFrame(f);
  }));

/** The wall-clock budget is only meaningful when the page renders at ≥ 4 fps (60 steps need ≤ 4 frames). */
async function expectWall(page: Page, ms: number, label: string): Promise<void> {
  const fm = await frameMs(page);
  if (fm <= 250) expect(ms, `${label} wall ms to control (frame ${fm.toFixed(0)} ms)`).toBeLessThanOrEqual(1800);
  else test.info().annotations.push({ type: 'slow-renderer', description: `${label}: ${ms} ms wall at ${fm.toFixed(0)} ms/frame; steps asserted instead` });
}

/** Wall-clock ms from a click until phase 'fight', and sim steps from the attempt starting (phase 'intro', after the
 *  120 ms veil) until 'fight'. Steps are what the game controls; wall ms also depends on the renderer's frame rate. */
async function timeToControl(page: Page, click: () => Promise<void>) {
  const t0 = Date.now();
  await click();
  await page.waitForFunction(() => window.__skyrest!.snapshot().phase === 'intro', undefined, { timeout: 45_000, polling: 16 });
  const fI = await page.evaluate(() => window.__skyrest!.snapshot().frame - window.__skyrest!.snapshot().phaseFrame);
  await page.waitForFunction(() => window.__skyrest!.snapshot().phase === 'fight', undefined, { timeout: 45_000, polling: 16 });
  const ms = Date.now() - t0;
  const s = await page.evaluate(() => window.__skyrest!.snapshot());
  const steps = s.frame - s.phaseFrame - fI; // intro start → fight start, exactly
  return { ms, steps };
}

test('[LP1] title → Start → kill → coins counted in → NEXT WAVE in ≤ 1.8 s; FALLEN → TRY AGAIN in ≤ 1.8 s', async ({ page, game, shot }) => {
  test.setTimeout(480_000);
  await boot(page);
  await expect(page.getByTestId('title')).toBeVisible();
  await expect(page.getByTestId('hud')).not.toHaveClass(/\bin\b/); // no HUD on the title
  expect(await coinsShown(page)).toBe(START_COINS);
  await page.getByTestId('start').click();
  await page.waitForFunction(() => window.__skyrest!.snapshot().phase === 'fight', undefined, { timeout: 15_000 });
  await expect(page.getByTestId('hud')).toHaveClass(/\bin\b/);

  await game.setManual(true);
  await scriptedKill(page);
  await game.setManual(false);
  // Coins fly in one by one: the pill passes through intermediate values and lands on the sim's total, which is
  // the Guardian's +coinsOnDeath plus MINION.coins for each phase-2 pebble that popped with it.
  const total = (await game.snapshot()).coins;
  const gained = total - START_COINS;
  expect(gained).toBeGreaterThanOrEqual(GOLEM.coinsOnDeath);
  expect((gained - GOLEM.coinsOnDeath) % MINION.coins).toBe(0);
  const seen = new Set<number>();
  await expect
    .poll(async () => {
      const v = await coinsShown(page);
      seen.add(v);
      return v;
    }, { timeout: 60_000, intervals: [50] })
    .toBe(total);
  expect(seen.size, 'the count ticks per arriving coin').toBeGreaterThan(2);
  await expect(page.getByTestId('victory')).toBeVisible();
  await shot('loop/victory');

  const next = await timeToControl(page, () => page.getByTestId('next-wave').click());
  const s2 = await game.snapshot();
  expect(s2.wave).toBe(2);
  expect(s2.coins).toBe(total);
  expect(next.steps, 'sim steps to control').toBeLessThanOrEqual(108 - 8); // + the 120 ms veil
  await expectWall(page, next.ms, 'next wave');

  // FALLEN: let the Guardian win (manual), then TRY AGAIN in real time.
  await game.setManual(true);
  await game.setFlags({ golemPassive: false, heroInvulnerable: false });
  await page.evaluate(() => {
    const h = window.__skyrest!;
    for (let i = 0; i < 40 && h.snapshot().phase !== 'defeat'; i++) h.step(120);
  });
  expect(await phase(page)).toBe('defeat');
  await game.setManual(false);
  await expect(page.getByTestId('defeat')).toBeVisible();
  await page.waitForTimeout(800); // the card accepts a press after 750 ms
  await shot('loop/fallen');
  const again = await timeToControl(page, () => page.getByTestId('try-again').click());
  const s3 = await game.snapshot();
  expect(s3.wave).toBe(2);
  expect(s3.hero.hp).toBe(s3.hero.maxHp);
  expect(again.steps).toBeLessThanOrEqual(108 - 8);
  await expectWall(page, again.ms, 'try again');
  writeEvidence('loop/retry-timing.json', { nextWave: next, tryAgain: again, coinValuesSeen: seen.size });
});

test('[LP2] pause via the gear and Esc freezes the sim; settings persist; QUALITY switches the tier', async ({ page, shot }) => {
  test.setTimeout(120_000);
  await boot(page);
  await page.evaluate(() => {
    localStorage.removeItem('skyrest.settings.v1');
    window.__skyrest!.skipTitle();
  });
  await page.getByTestId('pause').click();
  await expect(page.getByTestId('pause-panel')).toBeVisible();
  const f1 = await page.evaluate(() => window.__skyrest!.snapshot().frame);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__skyrest!.snapshot().frame), 'frozen while paused').toBe(f1);
  // F-024: paused, the frozen picture is not redrawn (identical High-tier frames starved the main thread under
  // load). Let the pause's own redraws land (each rAF follows a finished tick), then count GL draws over 4 more.
  const pausedDraws = await page.evaluate(async () => {
    const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    for (let i = 0; i < 4; i++) await raf();
    const gl = (document.querySelector('canvas.stage') as HTMLCanvasElement).getContext('webgl2')!;
    let n = 0;
    const de = gl.drawElements, da = gl.drawArrays;
    gl.drawElements = function (this: WebGL2RenderingContext, ...a: Parameters<typeof de>) { n++; return de.apply(this, a); };
    gl.drawArrays = function (this: WebGL2RenderingContext, ...a: Parameters<typeof da>) { n++; return da.apply(this, a); };
    for (let i = 0; i < 4; i++) await raf();
    gl.drawElements = de;
    gl.drawArrays = da;
    return n;
  });
  expect(pausedDraws, 'no GL draws while paused and unchanged').toBe(0);
  await shot('loop/pause');
  // QUALITY cycles Auto → High → Low and the renderer follows.
  const ui = page.locator('.ui');
  await page.locator('[data-row=\"quality\"]').click({ force: true });
  await expect(page.getByTestId('val-quality')).toHaveText('High');
  await expect(ui).toHaveAttribute('data-quality', 'high');
  await page.locator('[data-row=\"quality\"]').click({ force: true });
  await expect(page.getByTestId('val-quality')).toHaveText('Low');
  await expect(ui).toHaveAttribute('data-quality', 'low');
  await page.locator('[data-row=\"shake\"]').click({ force: true });
  await page.locator('[data-row=\"sound\"]').click({ force: true });
  await expect(page.getByTestId('val-sound')).toHaveText('Off');
  // RESTART FIGHT asks twice.
  await page.locator('[data-row=\"restart\"]').click({ force: true });
  await expect(page.locator('.restart-label')).toHaveText(/tap again/i);
  // Esc resumes; the sim moves again; Esc pauses again.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-panel')).toBeHidden();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__skyrest!.snapshot().frame)).toBeGreaterThan(f1);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-panel')).toBeVisible();
  // Persisted across a reload.
  await boot(page);
  await page.evaluate(() => window.__skyrest!.skipTitle());
  await page.getByTestId('pause').click();
  await expect(page.getByTestId('val-quality')).toHaveText('Low');
  await expect(page.getByTestId('val-shake')).toHaveText(/On|Off/);
  await expect(page.getByTestId('val-sound')).toHaveText('Off');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('skyrest.settings.v1') ?? '{}'));
  expect(saved.quality).toBe('low');
  expect(saved.volume).toBe(0);
  await page.evaluate(() => localStorage.removeItem('skyrest.settings.v1'));
});

test('[LP3] the nameplate stays on screen and clear of the coin pill (portrait, desktop, fists raised)', async ({ page }) => {
  test.setTimeout(180_000);
  const results: unknown[] = [];
  for (const size of [{ width: 430, height: 932 }, { width: 1280, height: 720 }, { width: 932, height: 430 }]) {
    await page.setViewportSize(size);
    for (const id of ['F2', 'F5', 'F8'] as const) {
      await boot(page);
      await page.evaluate((m) => window.__skyrest!.moment(m), id);
      await page.waitForTimeout(100);
      const r = await page.evaluate(() => {
        const box = (sel: string) => document.querySelector(sel)!.getBoundingClientRect().toJSON() as DOMRect;
        return { plate: box('[data-testid="nameplate"] .np-bar'), name: box('[data-testid="nameplate"] .np-name'), pill: box('[data-testid="coins"]'), vw: innerWidth, vh: innerHeight };
      });
      const { plate, name, pill, vw, vh } = r;
      for (const b of [plate, name]) {
        expect(b.left, `${id} ${size.width} left`).toBeGreaterThanOrEqual(0);
        expect(b.right).toBeLessThanOrEqual(vw);
        expect(b.top).toBeGreaterThanOrEqual(0);
        expect(b.bottom).toBeLessThanOrEqual(vh);
        const overlap = b.left < pill.right && b.right > pill.left && b.top < pill.bottom && b.bottom > pill.top;
        expect(overlap, `${id} ${size.width}×${size.height}: nameplate overlaps the coin pill`).toBe(false);
      }
      results.push({ size, id, plate, pill });
    }
  }
  writeEvidence('loop/nameplate-rects.json', results);
});
