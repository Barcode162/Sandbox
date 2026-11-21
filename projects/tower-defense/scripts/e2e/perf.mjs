// Perf probe [A3] in headless Chromium (architecture §Performance budgets, board condition 3):
//  sim:    perfProbe(1200) → blots ≥ 500, towers ≥ 30, projectiles ≥ 1000, p95StepMs ≤ 4, p99StepMs ≤ 6
//  heap:   forced GC → perfProbe(3600) → forced GC; used-heap growth ≤ 5 MB (CDP HeapProfiler/Runtime)
//  render: stage('r18-8s') then 300 manual 60 Hz frames; game.frame() JS time p95 ≤ 8 ms (a CPU-raster proxy)
//  boot:   hook ready() ≤ 1.5 s after navigation
// Evidence: evidence-local/perf/perf.json.
import { allErrors, check, fail, hook, launch, ok, openGame, pct, serveDist, writeEvidence } from './lib.mjs';

const BUDGET = { blots: 500, towers: 30, projectiles: 1000, p95StepMs: 4, p99StepMs: 6, heapGrowthMB: 5, renderP95Ms: 8, readyMs: 1500 };
const out = { budget: BUDGET };

const server = await serveDist();
const browser = await launch({ args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'] });
try {
  // ── sim step + heap
  {
    const { page, problems, readyMs } = await openGame(browser, server.url);
    out.readyMs = readyMs;
    check(readyMs <= BUDGET.readyMs, `first playable: hook ready in ${readyMs} ms (≤ ${BUDGET.readyMs})`, `hook ready took ${readyMs} ms (> ${BUDGET.readyMs})`);
    await hook(page, 'useManualClock');
    const sim = await hook(page, 'perfProbe', 1200);
    if (sim.error) fail(`perfProbe(1200): ${sim.error}`);
    else {
      const r = (out.sim = sim.value);
      check(r.blots >= BUDGET.blots && r.towers >= BUDGET.towers && r.projectiles >= BUDGET.projectiles,
        `stress load: ${r.blots} blots, ${r.towers} towers, ${r.projectiles} projectiles`,
        `stress load too light: ${r.blots} blots (≥ ${BUDGET.blots}), ${r.towers} towers (≥ ${BUDGET.towers}), ${r.projectiles} projectiles (≥ ${BUDGET.projectiles})`);
      check(r.steps === 1200, `ran 1200 steps`, `perfProbe ran ${r.steps} steps, asked 1200`);
      check(r.p95StepMs <= BUDGET.p95StepMs, `sim step p95 ${r.p95StepMs.toFixed(2)} ms (≤ ${BUDGET.p95StepMs}); mean ${r.meanStepMs.toFixed(2)}, max ${r.maxStepMs.toFixed(2)}`,
        `sim step p95 ${r.p95StepMs.toFixed(2)} ms > ${BUDGET.p95StepMs}`);
      check(r.p99StepMs <= BUDGET.p99StepMs, `sim step p99 ${r.p99StepMs.toFixed(2)} ms (≤ ${BUDGET.p99StepMs})`, `sim step p99 ${r.p99StepMs.toFixed(2)} ms > ${BUDGET.p99StepMs}`);

      const cdp = await page.context().newCDPSession(page);
      const used = async () => { await cdp.send('HeapProfiler.collectGarbage'); return (await cdp.send('Runtime.getHeapUsage')).usedSize / 2 ** 20; };
      const h0 = await used();
      const long = await hook(page, 'perfProbe', 3600);
      const h1 = await used();
      if (long.error) fail(`perfProbe(3600): ${long.error}`);
      else {
        out.heap = { startMB: h0, endMB: h1, growthMB: h1 - h0, probe: long.value };
        check(h1 - h0 <= BUDGET.heapGrowthMB, `heap growth over 3600 steps after GC: ${(h1 - h0).toFixed(2)} MB (≤ ${BUDGET.heapGrowthMB})`,
          `heap grew ${(h1 - h0).toFixed(2)} MB over 3600 steps (> ${BUDGET.heapGrowthMB})`);
      }
    }
    const errs = await allErrors(page, problems);
    check(errs.length === 0, 'sim probe page: zero console errors', `sim probe page errors:\n    ${errs.join('\n    ')}`);
    await page.close();
  }
  // ── render frame at R18 t 8 s
  {
    const { page, problems } = await openGame(browser, server.url);
    const staged = await hook(page, 'stage', 'r18-8s');
    if (staged.error) fail(`stage('r18-8s'): ${staged.error}`);
    else {
      await hook(page, 'useManualClock');
      const r = await page.evaluate(() => {
        const h = window.__inkfold;
        const t0 = h.summary().tick;
        const times = [];
        for (let i = 0; i < 300; i++) { const a = performance.now(); h.advance(1000 / 60, 60); times.push(performance.now() - a); }
        return { times, ticks: h.summary().tick - t0, scene: h.scene() };
      });
      const sorted = [...r.times].sort((a, b) => a - b);
      out.render = { frames: 300, p50Ms: pct(sorted, 0.5), p95Ms: pct(sorted, 0.95), maxMs: sorted[sorted.length - 1], simTicks: r.ticks, scene: r.scene };
      check(out.render.p95Ms <= BUDGET.renderP95Ms, `R18 render frame p95 ${out.render.p95Ms.toFixed(2)} ms (≤ ${BUDGET.renderP95Ms}); ${r.ticks} sim ticks advanced in scene '${r.scene}'`,
        `R18 render frame p95 ${out.render.p95Ms.toFixed(2)} ms > ${BUDGET.renderP95Ms}`);
      check(r.ticks >= 250, `the R18 frames ran the sim (${r.ticks} ticks over 300 frames)`, `R18 frames advanced only ${r.ticks} sim ticks — the measured frames are not live play`);
    }
    const errs = await allErrors(page, problems);
    check(errs.length === 0, 'render probe page: zero console errors', `render probe page errors:\n    ${errs.join('\n    ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
await writeEvidence('perf', 'perf.json', out);
if (!process.exitCode) ok('perf evidence → evidence-local/perf/perf.json');
