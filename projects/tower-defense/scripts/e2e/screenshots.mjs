// §18 capture set (criteria 3, 7; board condition 1). Each StageId gets a fresh page at 1280×720; title-idle,
// r18-8s and pause are also shot at 1920×1080 and 900×600 (letterbox). JPEG q80, DSF 1 →
// evidence-local/screens/<stage>[-<w>x<h>].jpg (1280×720 shots keep the bare name, e.g. blots-grid.jpg).
// Every stage must resolve with zero console/page/app errors. 'towers-sheet' and 'blots-grid' are also
// pixel-diffed on the canvas (scripts/e2e/pixeldiff.mjs). Evidence: evidence-local/screens/screens.json.
import { join } from 'node:path';
import { GRID_SPECS, analyseGrid, selfTest } from './pixeldiff.mjs';
import { allErrors, check, evidenceDir, fail, hook, launch, ok, openGame, pool, serveDist, writeEvidence } from './lib.mjs';

const KINDS = ['tern', 'frog', 'koi', 'owl'];
const STAGES = [
  'title-0', 'title-800', 'title-idle',
  'place-valid', 'place-invalid', 'place-done',
  'r1-8s',
  ...KINDS.flatMap((k) => ['0-0', '3-1', '1-3'].map((t) => `fold-${k}-${t}`)), 'fold-sealed-hover',
  'r18-8s', 'r18-8s-cb',
  'r20-warning', 'r20-arrival', 'r20-shed50', 'r20-death',
  'pause', 'settings-cb', 'gameover', 'victory',
  'blots-grid', 'towers-sheet',
];
const EXTRA_SIZES = [[1920, 1080], [900, 600]];
const EXTRA_STAGES = ['title-idle', 'r18-8s', 'pause'];
const STAGE_TIMEOUT_MS = 120_000;
const JOBS = [
  ...STAGES.map((id) => ({ id, w: 1280, h: 720 })),
  ...EXTRA_STAGES.flatMap((id) => EXTRA_SIZES.map(([w, h]) => ({ id, w, h }))),
];

const st = selfTest();
check(st.ok, 'pixel-diff analyser self-test (finds a 12×4 grid, catches one duplicate pair)', `pixel-diff self-test failed: ${JSON.stringify(st)}`);

const dir = await evidenceDir('screens');
const server = await serveDist();
const browser = await launch();
const t0 = Date.now();
let results;
try {
  results = await pool(JOBS, 3, async ({ id, w, h }) => {
    const file = w === 1280 && h === 720 ? `${id}.jpg` : `${id}-${w}x${h}.jpg`;
    const { page, problems } = await openGame(browser, server.url, { width: w, height: h });
    const r = { id, size: `${w}x${h}`, file };
    try {
      const s0 = Date.now();
      let timer;
      const staged = await Promise.race([
        hook(page, 'stage', id),
        new Promise((done) => { timer = setTimeout(() => done({ error: `timed out after ${STAGE_TIMEOUT_MS / 1000} s` }), STAGE_TIMEOUT_MS); }),
      ]);
      clearTimeout(timer);
      r.stageMs = Date.now() - s0;
      if (staged.error) { r.error = staged.error; return r; }
      await page.screenshot({ path: join(dir, file), type: 'jpeg', quality: 80 });
      if (GRID_SPECS[id] && w === 1280) {
        r.grid = await page.evaluate(([src, spec]) => {
          const fn = new Function(`return (${src})`)();
          const c = document.getElementById('game');
          const out = fn(c.getContext('2d').getImageData(0, 0, c.width, c.height), spec);
          return { ok: out.ok, method: out.method, layout: out.layout, minPair: out.minPair, problems: out.problems, cells: out.cells?.flat().length ?? 0, pairs: out.pairs };
        }, [analyseGrid.toString(), GRID_SPECS[id]]);
      }
    } catch (e) {
      r.error = String(e.message ?? e).split('\n')[0];
    } finally {
      r.errors = await allErrors(page, problems).catch(() => problems);
      await page.close();
    }
    return r;
  });
} finally {
  await browser.close();
  await server.close();
}

for (const r of results) {
  if (r.error) { fail(`${r.id} @ ${r.size}: ${r.error}`); continue; }
  check(r.errors.length === 0, `${r.id} @ ${r.size} → screens/${r.file} (${r.stageMs} ms)`,
    `${r.id} @ ${r.size}: console errors:\n    ${r.errors.join('\n    ')}`);
  if (r.grid) {
    check(r.grid.ok, `${r.id}: ${r.grid.cells} cells (${r.grid.method}), every neighbour differs ≥ 2 % (min ${(r.grid.minPair * 100).toFixed(1)} %)`,
      `${r.id} pixel-diff: ${r.grid.problems.join(' | ')}`);
  }
}
const shot = results.filter((r) => !r.error).length;
console.log(`  ${shot}/${JOBS.length} shots in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await writeEvidence('screens', 'screens.json', { selfTest: st, results });
if (!process.exitCode) ok('screens evidence → evidence-local/screens/screens.json');
