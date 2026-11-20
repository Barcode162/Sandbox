// §7.7 nothing is lost: the best time survives reloads and only a faster win replaces it.
// Wins come from the runner bot on the manual clock (fast and deterministic, seed 7).
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

const KEY = 'lilyfield.v1';

/** Run the runner bot to its result on the manual clock; return the result. */
const botWin = (page) =>
  page.evaluate(() => {
    const l = window.__lily;
    l.manualClock(true);
    l.setBot('runner');
    for (let i = 0; i < 60 * 120 && !l.sim().result; i++) l.frame(1000 / 60);
    l.frame(1000 / 60);
    return { result: l.sim().result, phase: l.phase() };
  });

await withPage('best time persists across reloads', { viewport: VIEWPORTS.desktop }, async ({ page }) => {
  // An impossibly fast stored best must survive a slower win…
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ version: 1, bestMs: 1000, muted: false, reducedMotion: null, runs: 4 })), KEY);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  const a = await botWin(page);
  check(a.result?.kind === 'won' && a.phase === 'result', `runner bot wins seed 7 (${a.result?.kind}, ${a.phase})`);
  let saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  check(saved.bestMs === 1000 && saved.runs === 5, `slower win keeps the stored best (best ${saved.bestMs}, runs ${saved.runs})`);
  // …and a slow stored best is replaced by the win, then read back after a reload.
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ version: 1, bestMs: 9e6, muted: true, reducedMotion: true, runs: 0 })), KEY);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  check((await page.evaluate(() => window.__lily.settings())).muted === true, 'saved mute is applied on load');
  const b = await botWin(page);
  saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  check(saved.bestMs === b.result.timeMs, `faster win becomes the best (${saved.bestMs} = ${b.result.timeMs})`);
  check(saved.muted === true && saved.reducedMotion === true, 'settings untouched by a result');
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  check((await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).bestMs, KEY)) === b.result.timeMs, 'best still there after another reload');
});

await withPage('corrupt save never breaks the game', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  await page.evaluate((k) => localStorage.setItem(k, '{"version":1,"bestMs":"NaN",'), KEY);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  check((await page.evaluate(() => window.__lily.phase())) === 'title', 'boots to the title with a corrupt save');
});
done();
