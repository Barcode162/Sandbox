// §4.7 in the browser (F-001): presses go through __lily.press (the shell's pending → tick path) on a
// 166.67 ms wall grid (5 frames at 30 Hz, 24 at 144 Hz). A correct fixed step gives the same log at both
// rates and sim time equal to wall time; a loop that ticks per frame fails both checks. Node covers 200
// seeds (tests/unit/sim/bots.test.ts); here one seed, never a bot, so the shell input path is exercised.
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

const LAYERS = 36; // the full river: the whole run still takes only seconds

await withPage('sim determinism 30 vs 144 Hz', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  const runAt = (hz) =>
    page.evaluate(
      ({ hz, layers }) => {
        const l = window.__lily;
        l.manualClock(true);
        l.setBot(null);
        l.setTuning({ layers });
        l.restart(7);
        const dt = 1000 / hz;
        const perGrid = hz === 30 ? 5 : 24;
        // Same policy as gridPress in the Node test: a safe chip when grounded, else a safe pad one layer on.
        const pick = (s) => {
          const safe = (id) => ['lily', 'bank'].includes(s.river.pads[id].kind);
          const f = s.frog;
          if (f.phase === 'idle') {
            const c = s.choices.find((c) => safe(c.padId) && !(s.gator.flank?.armed && s.gator.flank.padId === c.padId));
            return c ? c.slot : null;
          }
          const next = s.river.layers[s.river.pads[f.targetId].layer + 1];
          if (!next) return null;
          const i = next.findIndex((p) => safe(p.id));
          if (i < 0) return null;
          return next.length === 1 ? 'F' : next.length === 3 ? ['L', 'F', 'R'][i] : ['L', 'R'][i];
        };
        let f = 0;
        for (; f < hz * 60 && !l.sim().result; f++) {
          if (f % perGrid === 0) {
            const slot = pick(l.sim());
            if (slot) l.press(slot);
          }
          l.frame(dt);
        }
        const s = l.sim();
        return { log: JSON.stringify(s.log), result: s.result, wallMs: f * dt, hops: s.log.filter((e) => e.t === 'hop').length };
      },
      { hz, layers: LAYERS },
    );
  const t0 = Date.now();
  const a = await runAt(30);
  const b = await runAt(144);
  check(a.result?.kind === 'won' && b.result?.kind === 'won', `both runs cross the ${LAYERS}-layer river (${a.result?.kind} / ${b.result?.kind}, ${a.hops} hops)`);
  check(a.log === b.log, `identical event log at 30 and 144 Hz (${JSON.parse(a.log).length} events)`);
  for (const [r, hz] of [[a, 30], [b, 144]]) {
    const lag = r.wallMs - (r.result.tick * 1000) / 120;
    check(lag >= -1e-6 && lag < 1000 / hz + 1e-6, `${hz} Hz: sim time keeps wall time (result tick ${r.result.tick}, wall ${r.wallMs.toFixed(1)} ms, lag ${lag.toFixed(2)} ms < 1 frame)`);
  }
  console.log(`  (browser runs took ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
});
done();
