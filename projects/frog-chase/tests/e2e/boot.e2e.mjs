// Headless boot (success criterion 1): the page loads, the hook is live, the sim ticks, zero console errors.
import { check, done, shot, VIEWPORTS, withPage } from './harness.mjs';

for (const [label, viewport] of [['desktop', VIEWPORTS.desktop], ['mobile', VIEWPORTS.mobile]]) {
  await withPage(`boot ${label}`, { viewport }, async ({ page }) => {
    const info = await page.evaluate(() => {
      const l = window.__lily;
      l.manualClock(true);
      const t0 = l.sim().tick;
      l.frame(1000 / 60, 60);
      return { seed: l.seed(), ticks: l.sim().tick - t0, phase: l.phase(), pads: l.pads().length, version: l.version };
    });
    check(info.version === 1, 'window.__lily v1 installed');
    check(info.seed === 7, `?seed=7 honoured (got ${info.seed})`);
    check(info.ticks === 120, `1 s of 60 Hz frames = 120 ticks (got ${info.ticks})`);
    check(info.phase === 'title', `starts on the title pond (got ${info.phase})`);
    check(info.pads >= 3, `pads drawn on screen (got ${info.pads})`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
    check(!overflow, 'no page overflow');
    await shot(page, `boot-${label}`);
  });
}
done();
