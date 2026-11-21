// Bots in the browser (SC1): the runner wins, the idler is eaten (still), forward sinks at layer 6 on seed 7.
// The sim-step budget (p95 ≤ 0.25 ms, full run ≤ 150 ms) is measured in Node, tests/unit/sim/bots.test.ts
// 'budget': in headless Chromium a single ~µs step reads 0 on the clamped timer, so a check here cannot fail (F-002).
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

await withPage('sim bots', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  const play = (bot, opts = {}) =>
    page.evaluate(
      ({ bot, opts }) => {
        const l = window.__lily;
        l.manualClock(true);
        l.setBot(bot, opts);
        l.restart(7);
        for (let f = 0; f < 60 * 90 && !l.sim().result; f++) {
          l.frame(1000 / 60);
        }
        l.setBot(null);
        const s = l.sim();
        return { result: s.result, phase: l.phase(), culpritKind: s.result?.culpritId != null ? s.river.pads[s.result.culpritId].kind : null };
      },
      { bot, opts },
    );
  const win = await play('runner');
  check(win.result?.kind === 'won' && win.result.cause === 'win', `runner wins seed 7 (${win.result?.kind}, ${(win.result?.timeMs / 1000).toFixed(2)} s)`);
  check(win.result.timeMs >= 20000 && win.result.timeMs <= 60000, 'runner crossing takes 20–60 s');
  const eaten = await play('idler');
  check(eaten.result?.kind === 'eaten' && eaten.result.cause === 'still', `idler is eaten, cause still (${eaten.result?.cause}, layer ${eaten.result?.layer})`);
  const sunk = await play('forward');
  check(sunk.result?.kind === 'sunk' && sunk.result.layer === 6 && sunk.culpritKind === 'soggy', `forward sinks on the layer-6 soggy (${sunk.result?.cause}, layer ${sunk.result?.layer})`);
});
done();
