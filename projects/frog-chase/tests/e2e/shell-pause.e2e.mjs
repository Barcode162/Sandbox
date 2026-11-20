// §7.6 pause: Esc, P, the pause button, visibilitychange and blur all pause play; the sim freezes;
// hop keys don't leak through; Esc/P resume. §10: reduced motion follows the OS by default.
import { check, done, shot, VIEWPORTS, withPage } from './harness.mjs';

const phase = (page) => page.evaluate(() => window.__lily.phase());
const tick = (page) => page.evaluate(() => window.__lily.sim().tick);

async function frozen(page, label) {
  const t = await tick(page);
  await page.waitForTimeout(250);
  check((await tick(page)) === t, `${label}: sim frozen while paused`);
}

await withPage('pause triggers (desktop)', { viewport: VIEWPORTS.desktop }, async ({ page }) => {
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => window.__lily.phase() === 'play', null, { polling: 'raf', timeout: 1000 });
  for (const key of ['Escape', 'KeyP']) {
    await page.keyboard.press(key);
    check((await phase(page)) === 'paused', `${key} pauses`);
    await frozen(page, key);
    const hops = await page.evaluate(() => window.__lily.events().filter((e) => e.t === 'hop').length);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    check((await page.evaluate(() => window.__lily.events().filter((e) => e.t === 'hop').length)) === hops && (await phase(page)) === 'paused', `${key}: hop keys do nothing while paused`);
    if (key === 'Escape') await shot(page, 'shell-paused-desktop');
    await page.keyboard.press(key);
    check((await phase(page)) === 'play', `${key} again resumes`);
    const t = await tick(page);
    await page.waitForTimeout(200);
    check((await tick(page)) > t, `${key}: sim runs again after resume`);
  }
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  check((await phase(page)) === 'paused', 'tab hidden (visibilitychange) pauses');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  check((await phase(page)) === 'paused', 'coming back stays paused until the player resumes');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  check((await phase(page)) === 'paused', 'window blur pauses');
  await page.keyboard.press('Escape');
  const btn = page.locator('#ui button[aria-label*="ause" i], #ui [data-test="pause"]').first();
  if (await btn.count()) {
    await btn.click();
    check((await phase(page)) === 'paused', 'the pause button pauses');
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowUp'); // focus was on the button: the key must hop, not re-click it
    check((await phase(page)) === 'play', 'after clicking the button, ↑ hops instead of re-pressing it');
  } else console.log('  note pause button not in the DOM yet (WO-003); covered by the UiCallbacks unit test');
});

await withPage('reduced motion follows the OS (mobile)', { viewport: VIEWPORTS.mobile, reducedMotion: 'reduce' }, async ({ page }) => {
  check((await page.evaluate(() => window.__lily.settings().reducedMotion)) === true, 'prefers-reduced-motion: reduce → reducedMotion on by default');
});
await withPage('motion on by default (mobile)', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  check((await page.evaluate(() => window.__lily.settings().reducedMotion)) === false, 'no OS preference → reducedMotion off');
});
done();
