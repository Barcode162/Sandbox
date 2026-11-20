// SC4: a 375×812 touch crossing of layers 1–5 by real taps (pad taps and screen thirds), a 1440×900
// keyboard crossing with every key family, no page overflow, and 44 px touch targets (§4.5, §10).
import { check, done, shot, VIEWPORTS, withPage } from './harness.mjs';

const ready = (page) =>
  page.waitForFunction(() => {
    const s = window.__lily.sim();
    return s.result || (s.frog.phase === 'idle' && s.choices.length > 0);
  }, null, { polling: 'raf', timeout: 3000 });

/** The current choices with their on-screen circles and whether each pad is safe. */
const choices = (page) =>
  page.evaluate(() => {
    const l = window.__lily;
    const s = l.sim();
    const onScreen = new Map(l.pads().map((p) => [p.id, p]));
    return s.choices.map((c) => ({ ...c, kind: s.river.pads[c.padId].kind, at: onScreen.get(c.padId) ?? null }));
  });

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);

const smallTargets = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#ui button, #ui [role="button"]')]
      .filter((b) => b.offsetParent !== null)
      .map((b) => b.getBoundingClientRect())
      .filter((r) => r.width < 44 || r.height < 44)
      .map((r) => `${r.width.toFixed(0)}×${r.height.toFixed(0)}`),
  );

await withPage('touch crossing 375×812', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  const thirdX = { L: 375 / 6, F: 375 / 2, R: (375 * 5) / 6 };
  let discriminating = 0;
  for (let layer = 1; layer <= 5; layer++) {
    await ready(page);
    const cs = await choices(page);
    const safe = cs.filter((c) => c.kind === 'lily');
    // Pad-tap layers prefer a side pad whose hit circle (1.4r) reaches into the middle third: a tap there
    // lands on the side pad only if the pad itself wins over its screen third.
    const edgeX = (c) => (c.slot === 'L' ? 375 / 3 + 3 : (2 * 375) / 3 - 3);
    const crossing = safe.filter((c) => c.slot !== 'F' && c.at && Math.abs(edgeX(c) - c.at.x) / c.at.r <= 1.3);
    const pick = layer % 2 === 1 && crossing.length ? crossing[0] : safe[(layer * 7) % safe.length];
    if (layer % 2 === 1) {
      check(!!pick.at, `layer ${layer}: target pad is on screen`);
      const x = crossing.includes(pick) ? edgeX(pick) : pick.at.x;
      if (crossing.includes(pick)) discriminating++;
      await page.touchscreen.tap(x, pick.at.y);
    } else {
      // Tap the screen third for that slot, low on the screen where no current choice sits.
      await page.touchscreen.tap(thirdX[pick.slot], 812 * 0.93);
    }
    await page.waitForFunction((l) => window.__lily.sim().frog.layer >= l || window.__lily.sim().result, layer, { polling: 'raf', timeout: 2000 });
    const s = await page.evaluate(() => ({ layer: window.__lily.sim().frog.layer, pad: window.__lily.sim().frog.padId, phase: window.__lily.phase() }));
    check(s.layer === layer && s.pad === pick.padId, `layer ${layer}: ${layer % 2 ? 'pad tap' : 'third tap'} ${pick.slot} landed on pad ${pick.padId} (on ${s.pad}, layer ${s.layer})`);
  }
  check(discriminating >= 1, `${discriminating} pad tap(s) made in the middle third landed on a side pad`);
  check((await page.evaluate(() => window.__lily.phase())) === 'play', 'still playing after 5 tapped hops');
  check(!(await overflow(page)), 'no page overflow at 375×812');
  const small = await smallTargets(page);
  check(small.length === 0, `UI touch targets ≥ 44 px${small.length ? ': ' + small.join(', ') : ''}`);
  await shot(page, 'shell-touch-layer5-mobile');
});

await withPage('keyboard crossing 1440×900', { viewport: VIEWPORTS.desktop }, async ({ page }) => {
  const keys = { L: ['ArrowLeft', 'KeyA'], F: ['ArrowUp', 'KeyW', 'Space'], R: ['ArrowRight', 'KeyD'] };
  for (let layer = 1; layer <= 5; layer++) {
    await ready(page);
    const cs = await choices(page);
    const safe = cs.filter((c) => c.kind === 'lily');
    const pick = safe[layer % safe.length];
    const key = keys[pick.slot][layer % keys[pick.slot].length];
    await page.keyboard.press(key);
    await page.waitForFunction((l) => window.__lily.sim().frog.layer >= l || window.__lily.sim().result, layer, { polling: 'raf', timeout: 2000 });
    const s = await page.evaluate(() => window.__lily.sim().frog);
    check(s.layer === layer && s.padId === pick.padId, `layer ${layer}: ${key} → pad ${pick.padId} (on ${s.padId})`);
  }
  // Held key: auto-repeat must not chain hops.
  await ready(page);
  const before = await page.evaluate(() => window.__lily.events().filter((e) => e.t === 'hop').length);
  await page.keyboard.down('ArrowUp');
  for (let i = 0; i < 12; i++) await page.keyboard.down('ArrowUp'); // repeat: true
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowUp');
  const after = await page.evaluate(() => window.__lily.events().filter((e) => e.t === 'hop').length);
  check(after - before === 1, `a held ↑ hops once (${after - before})`);
  check(!(await overflow(page)), 'no page overflow at 1440×900');
  await shot(page, 'shell-keyboard-layer6-desktop');
});
done();
