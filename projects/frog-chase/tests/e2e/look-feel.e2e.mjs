// WO-003 feel and framing: polish 1 + 9 (same-frame squash, inverted chip), §4.6 camera at 64% after
// settle and after a mid-run resize (polish 24), pads inside the column at 375 and 1920 wide,
// nearest-centre tap picking, and reduced motion (shake 0, zoom off; hit-stops stay, §10).
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

const helpers = () =>
  (window.__f = {
    P: () => document.getElementById('stage').__lilyRender,
    until(pred, max = 6000) {
      for (let i = 0; i < max && !pred(); i++) window.__lily.frame(1000 / 60);
      return pred();
    },
    idleAt(k) {
      const s = window.__lily.sim();
      return s.frog.layer >= k && s.frog.phase === 'idle' && s.choices.length > 0;
    },
  });

for (const [vp, viewport, resizeTo] of [
  ['mobile', VIEWPORTS.mobile, { width: 414, height: 736 }],
  ['desktop', VIEWPORTS.desktop, { width: 1920, height: 1080 }],
]) {
  await withPage(`look feel ${vp}`, { viewport }, async ({ page }) => {
    await page.evaluate(helpers);
    // Polish 1 + 9: press, then exactly one 16.7 ms frame.
    const p1 = await page.evaluate(() => {
      const l = window.__lily;
      l.manualClock(true);
      l.frame(1000 / 60, 20);
      const before = { ...__f.P() };
      l.press('F');
      l.frame(1000 / 60);
      const after = __f.P();
      return { idleAcross: before.frogAcross, across: after.frogAcross, along: after.frogAlong, stage: after.frogStage, drawn: after.drawnFrames - before.drawnFrames, inverted: after.pressedChipInverted };
    });
    check(p1.drawn === 1 && p1.stage === 'squash' && p1.across > 1.1 && p1.idleAcross === 1, `polish 1: squash on the same frame (${JSON.stringify(p1)})`);
    check(p1.inverted, 'polish 9: the pressed chip is inverted on that frame');

    // Camera: frog at 64% ± 1% after settle; again after a resize mid-run; pads stay in the column.
    const cam = await page.evaluate(() => {
      const l = window.__lily;
      l.setBot('runner', { stopAtLayer: 4 });
      __f.until(() => __f.idleAt(4));
      l.frame(1000 / 60, 40);
      return __f.P().frogY / innerHeight;
    });
    check(Math.abs(cam - 0.64) <= 0.01, `camera: frog at ${(cam * 100).toFixed(2)}% height after settle`);
    await page.setViewportSize(resizeTo);
    await page.waitForTimeout(50);
    const cam2 = await page.evaluate(() => {
      window.__lily.frame(1000 / 60, 40);
      return { y: __f.P().frogY / innerHeight, w: innerWidth };
    });
    check(cam2.w === resizeTo.width && Math.abs(cam2.y - 0.64) <= 0.01, `polish 24: after resize to ${resizeTo.width}×${resizeTo.height} the frog is at ${(cam2.y * 100).toFixed(2)}%`);

    // Pads never leave the screen horizontally over a whole bot crossing (375 and 1920 wide).
    const col = await page.evaluate(() => {
      const l = window.__lily;
      l.setBot(null);
      l.restart(7);
      l.setBot('runner');
      let worst = Infinity, frames = 0;
      while (!l.sim().result && frames < 6000) {
        l.frame(1000 / 60);
        if (frames++ % 6) continue;
        for (const p of l.pads()) if (p.kind !== 'bank') worst = Math.min(worst, p.x - p.r, innerWidth - (p.x + p.r));
      }
      return { worst, won: l.sim().result?.kind };
    });
    check(col.won === 'won' && col.worst >= 0, `pads stay in the column for a whole crossing at ${resizeTo.width} wide (min margin ${col.worst.toFixed(1)} px)`);

    // Tap picking returns the nearest centre where 1.4r hit circles overlap.
    const pick = await page.evaluate(() => {
      const l = window.__lily;
      l.restart(7);
      l.setBot('runner', { stopAtLayer: 8 });
      __f.until(() => __f.idleAt(8));
      l.frame(1000 / 60, 30);
      const pads = l.pads().filter((p) => p.kind !== 'bank');
      let pairs = 0, wrong = 0;
      for (const a of pads)
        for (const b of pads) {
          if (a === b) continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d >= 1.4 * (a.r + b.r)) continue;
          const t = Math.min(0.45, (1.4 * a.r) / d - 0.02);
          const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
          if (Math.hypot(x - b.x, y - b.y) > 1.4 * b.r) continue; // only points inside both circles
          pairs++;
          if (__f.P().pick(x, y) !== a.id) wrong++;
        }
      return { pairs, wrong };
    });
    check(pick.pairs > 0 && pick.wrong === 0, `pickPad: nearest centre wins in ${pick.pairs} overlapping hit zones`);

    // Danger zoom 0.96 when τ > 0.7, and an eaten shake (normal motion).
    const motion = await page.evaluate(() => {
      const l = window.__lily;
      l.restart(7);
      l.setBot('idleAtTau', { tau: 0.8 });
      // The bot stops for good at τ 0.8; once it stands there, τ only rises. 400 ms later the zoom has eased in.
      __f.until(() => l.sim().gator.tau >= 0.8 && l.sim().frog.phase === 'idle');
      l.frame(1000 / 60, 24);
      const zoom = __f.P().zoom;
      const alive = !l.sim().result;
      __f.until(() => !!l.sim().result);
      let shake = 0;
      for (let i = 0; i < 20; i++) {
        l.frame(1000 / 60);
        shake = Math.max(shake, __f.P().shake);
      }
      return { zoom, alive, shake, stops: __f.P().hitStops };
    });
    check(motion.alive && Math.abs(motion.zoom - 0.96) < 0.005 && motion.shake > 2 && motion.shake < 8 && motion.stops >= 1, `normal motion: zoom ${motion.zoom.toFixed(3)}, eaten shake ${motion.shake.toFixed(1)} px, hit-stops ${motion.stops}`);
  });
}

// Reduced motion (OS preference): shake 0 and zoom off, hit-stops stay.
await withPage('look feel reduced motion', { viewport: VIEWPORTS.desktop, reducedMotion: 'reduce' }, async ({ page }) => {
  await page.evaluate(helpers);
  const r = await page.evaluate(() => {
    const l = window.__lily;
    l.manualClock(true);
    l.setBot('idleAtTau', { tau: 0.8 });
    __f.until(() => l.sim().gator.tau >= 0.8 && l.sim().frog.phase === 'idle');
    l.frame(1000 / 60, 24);
    const zoom = __f.P().zoom;
    __f.until(() => !!l.sim().result);
    let shake = 0;
    for (let i = 0; i < 30; i++) {
      l.frame(1000 / 60);
      shake = Math.max(shake, __f.P().shake);
    }
    return { rm: l.settings().reducedMotion, zoom, shake, stops: __f.P().hitStops };
  });
  check(r.rm && r.zoom === 1 && r.shake === 0 && r.stops >= 1, `reduced motion: zoom ${r.zoom}, shake ${r.shake}, hit-stops ${r.stops}`);
});
done();
