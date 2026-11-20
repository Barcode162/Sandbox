// Performance budgets (plan §Performance): render + UI frame CPU p95 ≤ 8 ms at 1440×900 and 375×812
// (timings().lastFrameMs over 600 manual-clock frames, headless CPU raster: a pessimistic proxy, never fps);
// JS heap growth ≤ 3 MB over 3 simulated minutes of bot runs (CDP, after forced GC);
// the quality tier engages when frames are forced slow (and drops grain + halves the halftone).
import { check, done, VIEWPORTS, withPage } from './harness.mjs';

for (const [vp, viewport] of [['desktop', VIEWPORTS.desktop], ['mobile', VIEWPORTS.mobile]]) {
  await withPage(`look perf ${vp}`, { viewport }, async ({ page }) => {
    const r = await page.evaluate(() => {
      const l = window.__lily;
      l.manualClock(true);
      l.setBot('runner');
      l.frame(1000 / 60, 60);
      const ts = [];
      for (let i = 0; i < 600; i++) {
        if (l.sim().result) {
          l.restart();
          l.setBot('runner');
        }
        l.frame(1000 / 60);
        ts.push(l.timings().lastFrameMs);
      }
      ts.sort((a, b) => a - b);
      return { p50: ts[300], p95: ts[570], max: ts[599], quality: document.getElementById('stage').__lilyRender.quality };
    });
    check(r.p95 <= 8, `${vp}: frame CPU p95 ${r.p95.toFixed(2)} ms (p50 ${r.p50.toFixed(2)}, max ${r.max.toFixed(1)}) ≤ 8 ms`);
    check(r.quality === 'high', `${vp}: stays on the high quality tier`);
  });
}

await withPage('look perf heap (3 simulated minutes)', { viewport: VIEWPORTS.mobile }, async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const heap = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics } = await cdp.send('Performance.getMetrics');
    return metrics.find((m) => m.name === 'JSHeapUsedSize').value;
  };
  const run = (frames) =>
    page.evaluate((n) => {
      const l = window.__lily;
      l.manualClock(true);
      let runs = 0;
      for (let i = 0; i < n; i++) {
        const s = l.sim();
        if (s.result && i % 60 === 0) {
          l.restart();
          runs++;
        }
        if (l.phase() === 'title' || !s.result) l.setBot('runner');
        l.frame(1000 / 60);
      }
      return runs;
    }, frames);
  await run(1800); // warm-up: one full crossing, pools and caches filled
  const h0 = await heap();
  const runs = await run(10800); // 3 minutes at 60 Hz
  const h1 = await heap();
  const mb = (h1 - h0) / (1024 * 1024);
  check(runs >= 4 && mb <= 3, `heap growth ${mb.toFixed(2)} MB over 3 simulated minutes (${runs} restarts) ≤ 3 MB`);
});

await withPage('look perf quality tier forced', { viewport: VIEWPORTS.desktop }, async ({ page }) => {
  // Force slow frames: every stage fillRect spins 13 ms, so the measured p95 exceeds 12 ms.
  await page.evaluate(() => {
    const orig = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect = function (...a) {
      if (this.canvas.id === 'stage') {
        const t = performance.now();
        while (performance.now() - t < 13);
      }
      return orig.apply(this, a);
    };
  });
  const q = await page.evaluate(() => {
    const l = window.__lily;
    l.manualClock(true);
    const P = document.getElementById('stage').__lilyRender;
    const before = P.quality;
    for (let i = 0; i < 200 && P.quality === 'high'; i++) l.frame(1000 / 60);
    return { before, after: P.quality, p95: P.frameP95, drawn: P.drawnFrames };
  });
  check(q.before === 'high' && q.after === 'low', `quality tier engages when frames run slow (${JSON.stringify(q)})`);
});
done();
