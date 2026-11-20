// Audio in a real browser (§8): no AudioContext before a gesture, one running context after it,
// mute toggles and persists across a reload, and zero errors when Web Audio does not exist.
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

const COUNT_AUDIO = () => {
  window.__audioMade = [];
  for (const k of ['AudioContext', 'webkitAudioContext']) {
    const C = window[k];
    if (!C) continue;
    window[k] = class extends C {
      constructor(...a) {
        super(...a);
        window.__audioMade.push(this);
      }
    };
  }
};
const NO_AUDIO = () => {
  delete window.AudioContext;
  delete window.webkitAudioContext;
};
const audioState = (page) => page.evaluate(() => ({ made: window.__audioMade.length, state: window.__audioMade[0]?.state ?? null }));

await withPage('audio unlock and mute (desktop keyboard)', { viewport: VIEWPORTS.desktop }, async ({ page }) => {
  await page.addInitScript(COUNT_AUDIO);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  await page.waitForTimeout(300);
  check((await audioState(page)).made === 0, 'no AudioContext on the title before any input');
  await page.evaluate(() => window.__lily.press('F'));
  check((await audioState(page)).made === 0, 'a hook press is not a gesture: still no AudioContext');
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => window.__audioMade[0]?.state === 'running', null, { timeout: 2000 });
  const a = await audioState(page);
  check(a.made === 1 && a.state === 'running', `first key creates one running AudioContext (${a.made}, ${a.state})`);
  for (const k of ['ArrowLeft', 'ArrowRight', 'KeyW', 'Space']) await page.keyboard.press(k);
  await page.waitForTimeout(400);
  check((await audioState(page)).made === 1, 'later input reuses the same context');
  await page.keyboard.press('KeyM');
  check((await page.evaluate(() => window.__lily.settings().muted)) === true, 'M mutes');
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  check((await page.evaluate(() => window.__lily.settings().muted)) === true, 'mute persists across a reload');
  await page.keyboard.press('KeyM');
  check((await page.evaluate(() => window.__lily.settings().muted)) === false, 'M unmutes');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lilyfield.v1')));
  check(stored?.muted === false && stored?.version === 1, `lilyfield.v1 saved (${JSON.stringify(stored)})`);
});

await withPage('every cue path runs in real Web Audio (bots, manual clock)', { viewport: VIEWPORTS.desktop }, async ({ page }) => {
  await page.addInitScript(COUNT_AUDIO);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  await page.keyboard.press('KeyA'); // the gesture that unlocks audio
  await page.waitForFunction(() => window.__audioMade[0]?.state === 'running', null, { timeout: 2000 });
  const seen = await page.evaluate(() => {
    const l = window.__lily;
    l.manualClock(true);
    const types = new Set();
    const results = [];
    for (const [bot, opts] of [['runner', {}], ['forward', {}], ['idler', {}], ['nearMiss', {}]]) {
      l.restart(7);
      l.setBot(bot, opts);
      for (let i = 0; i < 60 * 90 && !l.sim().result; i++) l.frame(1000 / 60);
      l.frame(1000 / 60, 40); // result card age past the whoosh
      for (const e of l.events()) types.add(e.t);
      results.push(`${bot}:${l.sim().result?.cause ?? 'none'}`);
    }
    l.setBot(null);
    return { types: [...types].sort(), results };
  });
  check(seen.results.includes('runner:win') && seen.results.includes('forward:soggy') && seen.results.includes('idler:still'), `win, sunk and eaten runs played with sound (${seen.results.join(', ')})`);
  check(seen.types.length >= 10, `${seen.types.length} event types voiced: ${seen.types.join(' ')}`);
  check((await audioState(page)).made === 1, 'one AudioContext for every run');
});

await withPage('no Web Audio at all (mobile touch)', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  await page.addInitScript(NO_AUDIO);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__lily);
  check(await page.evaluate(() => typeof window.AudioContext === 'undefined'), 'AudioContext removed');
  for (const x of [60, 187, 320]) {
    await page.touchscreen.tap(x, 700);
    await page.waitForTimeout(320);
  }
  await page.keyboard.press('KeyM');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => window.__lily.sim().tick > 0), 'game keeps running without sound');
});
done();
