// Perf probe [A3] in headless Chromium (architecture §Performance budgets, board condition 3):
//  sim:    perfProbe(1200) → blots ≥ 500, towers ≥ 30, projectiles ≥ 1000, p95StepMs ≤ 4, p99StepMs ≤ 6
//  heap:   forced GC → perfProbe(3600) → forced GC; used-heap growth ≤ 5 MB (CDP HeapProfiler/Runtime)
//  render: stage('r18-8s'), warm-up, then 3 × 300 manual 60 Hz frames (median p95 gates); per frame = game JS + that frame's raster (forced by a
//          1-px readback), p95 ≤ 8 ms. stage() switches to the manual clock itself (testhook.ts), so no rAF frame
//          runs between staging and measuring.
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
    await hook(page, 'useManualClock');
    // One warm-up pass (330 frames, one full 5.2 s lobe-phase cycle, so every blot sprite bucket exists as it
    // would after the early rounds of a real run; the JIT settles too; discarded), then 3 measured passes,
    // each restaged from the same deterministic R18 t 8 s state. The gate uses the median of the three p95s:
    // a shared CPU swings a single 300-frame p95 by ±1 ms, and the median reports the steady state without
    // moving the budget. Every pass is recorded in the evidence.
    const passes = [];
    let stageError = null;
    for (let pass = 0; pass < 4 && !stageError; pass++) {
      const staged = await hook(page, 'stage', 'r18-8s');
      if (staged.error) { stageError = staged.error; break; }
      const n = pass === 0 ? 330 : 300;
      const r = await page.evaluate((n) => {
        const h = window.__inkfold;
        const t0 = h.summary().tick;
        // Each frame ends with a 1-px readback, which forces Chromium to rasterise that frame's queued
        // draw calls now (a real browser does this at every present). Without it, 300 frames inside one
        // task pile into a few huge deferred flushes and the p95 measures batching, not a frame.
        const cx = document.querySelector('canvas').getContext('2d');
        cx.getImageData(0, 0, 1, 1);
        const times = [];
        for (let i = 0; i < n; i++) { const a = performance.now(); h.advance(1000 / 60, 60); cx.getImageData(0, 0, 1, 1); times.push(performance.now() - a); }
        return { times, ticks: h.summary().tick - t0, scene: h.scene() };
      }, n);
      if (pass === 0) continue;
      const sorted = [...r.times].sort((x, y) => x - y);
      passes.push({ frames: n, p50Ms: pct(sorted, 0.5), p95Ms: pct(sorted, 0.95), maxMs: sorted[sorted.length - 1], simTicks: r.ticks, scene: r.scene });
    }
    if (stageError) fail(`stage('r18-8s'): ${stageError}`);
    else {
      const p95s = passes.map((x) => x.p95Ms).sort((x, y) => x - y);
      const med = p95s[1];
      out.render = { passes, medianP95Ms: med, p95Ms: med, spreadMs: [p95s[0], p95s[2]] };
      const spread = `passes ${passes.map((x) => x.p95Ms.toFixed(1)).join(' / ')}`;
      check(med <= BUDGET.renderP95Ms, `R18 render frame p95 ${med.toFixed(2)} ms, median of 3 (≤ ${BUDGET.renderP95Ms}); ${spread}`,
        `R18 render frame p95 ${med.toFixed(2)} ms, median of 3 > ${BUDGET.renderP95Ms}; ${spread}`);
      const minTicks = Math.min(...passes.map((x) => x.simTicks));
      const scenes = [...new Set(passes.map((x) => x.scene))].join(',');
      check(minTicks >= 250 && scenes === 'play', `the R18 frames ran the sim (≥ ${minTicks} ticks per 300 frames, scene '${scenes}')`,
        `R18 frames advanced only ${minTicks} sim ticks (scene '${scenes}'): the measured frames are not live play`);
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
