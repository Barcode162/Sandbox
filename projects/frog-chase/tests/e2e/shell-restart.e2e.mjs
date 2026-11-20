// SC2 on the wall clock (§7.7): restart input → hop-ready ≤ 400 ms; fail tick → hop-ready < 1 s.
// Real keys only. Seed 7 layer 6 hides a soggy pad straight ahead (G6), so holding ↑ sinks there.
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

const phase = (page) => page.evaluate(() => window.__lily.phase());

/** Hop ↑ whenever the frog is ready; once on layer 6, stop (a press there would escape the soggy pad). */
async function runIntoSoggy(page) {
  for (let i = 0; i < 40 && (await phase(page)) !== 'result'; i++) {
    if (await page.evaluate(() => window.__lily.sim().frog.layer >= 6)) break;
    await page.waitForFunction(() => {
      const s = window.__lily.sim();
      return s.result || (s.frog.phase === 'idle' && s.choices.length > 0);
    }, null, { polling: 'raf', timeout: 3000 });
    if ((await phase(page)) === 'result') break;
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(40);
  }
  await page.waitForFunction(() => window.__lily.phase() === 'result', null, { polling: 'raf', timeout: 3000 });
}

for (const [label, viewport] of [['desktop', VIEWPORTS.desktop], ['mobile', VIEWPORTS.mobile]]) {
  await withPage(`restart timing ${label}`, { viewport }, async ({ page }) => {
    const restarts = [];
    const fails = [];
    for (let round = 0; round < 3; round++) {
      check((await phase(page)) === 'title', `round ${round + 1}: on the title pond`);
      await runIntoSoggy(page);
      const r = await page.evaluate(() => window.__lily.sim().result);
      check(r?.kind === 'sunk' && r.cause === 'soggy', `round ${round + 1}: sunk on the layer-6 soggy pad (${JSON.stringify(r && { kind: r.kind, cause: r.cause, layer: r.layer })})`);
      // A panicked press inside the 250 ms lockout must not skip the card.
      await page.keyboard.press('ArrowUp');
      check((await phase(page)) === 'result', `round ${round + 1}: press during the 250 ms lockout ignored`);
      await page.waitForTimeout(260);
      const before = await page.evaluate(() => window.__lily.timings().restartToReadyMs);
      if (round === 1) await page.keyboard.press('Enter');
      else await page.keyboard.press('ArrowUp');
      await page.waitForFunction((b) => {
        const t = window.__lily.timings().restartToReadyMs;
        return t !== null && t !== b && window.__lily.phase() === 'title';
      }, before, { polling: 'raf', timeout: 2000 });
      const t = await page.evaluate(() => window.__lily.timings());
      restarts.push(t.restartToReadyMs);
      fails.push(t.resultToReadyMs);
      const fresh = await page.evaluate(() => {
        const s = window.__lily.sim();
        return { layer: s.frog.layer, timer: s.timerStartTick, result: s.result };
      });
      check(fresh.layer === 0 && fresh.timer === null && fresh.result === null, `round ${round + 1}: fresh layer-0 run, timer not started`);
    }
    const maxR = Math.max(...restarts);
    const maxF = Math.max(...fails);
    check(maxR <= 400, `restart input → hop-ready ≤ 400 ms (${restarts.map((x) => x.toFixed(0)).join(', ')} ms)`);
    check(maxF < 1000, `fail tick → hop-ready < 1 s (${fails.map((x) => x.toFixed(0)).join(', ')} ms)`);
    // Ready means ready: the very next press hops.
    await page.keyboard.press('ArrowUp');
    await page.waitForFunction(() => window.__lily.sim().frog.hopTick >= 0, null, { polling: 'raf', timeout: 1000 });
    check((await phase(page)) === 'play', 'first press after restart hops and leaves the title');
  });
}

await withPage('restart by tap (mobile)', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  await runIntoSoggy(page);
  await page.touchscreen.tap(187, 650);
  check((await phase(page)) === 'result', 'tap inside the lockout ignored');
  await page.waitForTimeout(260);
  await page.touchscreen.tap(187, 650);
  await page.waitForFunction(() => window.__lily.phase() === 'title', null, { polling: 'raf', timeout: 1000 });
  const t = await page.evaluate(() => window.__lily.timings());
  check(t.restartToReadyMs !== null && t.restartToReadyMs <= 400, `tap restart → hop-ready ${t.restartToReadyMs?.toFixed(0)} ms (≤ 400)`);
});
done();
