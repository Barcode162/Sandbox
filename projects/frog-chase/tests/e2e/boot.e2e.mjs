// Headless boot (success criterion 1): the page loads, the hook is live, the sim ticks, zero console errors.
// Also: first playable ≤ 1.5 s after goto (plan budget) and no AudioContext before a gesture (§8).
import { check, done, shot, VIEWPORTS, withPage } from './harness.mjs';

/** Counts AudioContext constructions; installed before any page script runs. */
const COUNT_AUDIO = () => {
  window.__audioMade = 0;
  for (const k of ['AudioContext', 'webkitAudioContext']) {
    const C = window[k];
    if (!C) continue;
    window[k] = class extends C {
      constructor(...a) {
        super(...a);
        window.__audioMade++;
      }
    };
  }
};

for (const [label, viewport] of [['desktop', VIEWPORTS.desktop], ['mobile', VIEWPORTS.mobile]]) {
  await withPage(`boot ${label}`, { viewport }, async ({ page }) => {
    await page.addInitScript(COUNT_AUDIO);
    const t0 = Date.now();
    await page.reload({ waitUntil: 'load' }); // reload so the init script above is in force
    await page.waitForFunction(() => window.__lily && window.__lily.pads().length > 0, null, { timeout: 5000 });
    const firstPlayableMs = Date.now() - t0;
    const info = await page.evaluate(() => {
      const l = window.__lily;
      l.manualClock(true);
      const t0 = l.sim().tick;
      l.frame(1000 / 60, 60);
      return {
        seed: l.seed(), ticks: l.sim().tick - t0, phase: l.phase(), pads: l.pads().length, version: l.version,
        audioMade: window.__audioMade, settings: l.settings(),
      };
    });
    check(info.version === 1, 'window.__lily v1 installed');
    check(info.seed === 7, `?seed=7 honoured (got ${info.seed})`);
    check(info.ticks === 120, `1 s of 60 Hz frames = 120 ticks (got ${info.ticks})`);
    check(info.phase === 'title', `starts on the title pond (got ${info.phase})`);
    check(info.pads >= 3, `pads drawn on screen (got ${info.pads})`);
    check(firstPlayableMs <= 1500, `first playable frame ${firstPlayableMs} ms after navigation (≤ 1500)`);
    check(info.audioMade === 0, `no AudioContext before the first gesture (made ${info.audioMade})`);
    check(info.settings.muted === false, 'sound on by default');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
    check(!overflow, 'no page overflow');
    await shot(page, `boot-${label}`);
  });
}
done();
