// §4.7 in the browser: the same seed + bot through __lily.frame at 30 Hz and 144 Hz gives an identical log.
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

await withPage('sim determinism 30 vs 144 Hz', { viewport: VIEWPORTS.desktop }, async ({ page }) => {
  const runAt = (hz, bot, opts, seed) =>
    page.evaluate(
      ({ hz, bot, opts, seed }) => {
        const l = window.__lily;
        l.manualClock(true);
        l.setBot(bot, opts);
        l.restart(seed);
        for (let f = 0; f < hz * 90 && !l.sim().result; f++) l.frame(1000 / hz);
        const s = l.sim();
        l.setBot(null);
        return { log: JSON.stringify(s.log), result: s.result, ticks: s.tick };
      },
      { hz, bot, opts, seed },
    );
  for (const [bot, opts, seed] of [['runner', {}, 7], ['nearMiss', {}, 7], ['runner', { delayMs: 900 }, 12345]]) {
    const a = await runAt(30, bot, opts, seed);
    const b = await runAt(144, bot, opts, seed);
    check(a.result !== null && b.result !== null, `${bot} seed ${seed}: both runs ended (${a.result?.kind} / ${b.result?.kind})`);
    check(a.log === b.log, `${bot} seed ${seed}: identical event log at 30 and 144 Hz (${JSON.parse(a.log).length} events)`);
    check(JSON.stringify(a.result) === JSON.stringify(b.result), `${bot} seed ${seed}: identical result (${a.result?.cause}, ${a.result?.timeMs?.toFixed(1)} ms)`);
  }
});
done();
