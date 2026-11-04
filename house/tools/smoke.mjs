// Hearthwake's smoke test: serves site/, opens the house in headless
// Chromium with software WebGPU (SwiftShader), and checks that
//   1. the engine starts with no fatal error and the renderer gets ready,
//   2. it draws frames, and the picture is not blank (it has light and shade),
//   3. walking works (W moves you towards the hearth, and the walls stop you),
//   4. the memory test page runs both tests to a small cap.
// Pictures go to build/shots/. Run after house/build.sh:
//   node house/tools/smoke.mjs
// This machine draws in software: right for looks, wrong for speed.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
import { decodePng } from './png.mjs';

const require = createRequire(import.meta.url);
const loadPlaywright = () => {
  try { return require('playwright'); } catch {}
  return require(join(process.execPath, '../../lib/node_modules/playwright'));
};
const GPU_ARGS = ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader',
                  '--use-webgpu-adapter=swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];

const root = 'site';
if (!existsSync(join(root, 'house.wasm'))) { console.log('FAIL no site/house.wasm: run house/build.sh first'); process.exit(1); }
mkdirSync('build/shots', { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' };
const server = createServer((req, res) => {
  const path = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!path.startsWith(root) || !existsSync(path)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(0);
const url = `http://localhost:${server.address().port}`;

let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const { chromium } = loadPlaywright();
const browser = await chromium.launch({ args: GPU_ARGS });
const page = await browser.newPage({ viewport: { width: 844, height: 390 } });  // an iPhone held sideways
const logs = [];
page.on('console', (m) => logs.push(m.text()));
page.on('pageerror', (e) => logs.push('page error: ' + e.message));
const state = () => page.evaluate(() => window.houseState || null);
const waitFor = async (test, ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { const s = await state(); if (s && test(s)) return s; await page.waitForTimeout(500); }
  return state();
};

try {
  await page.goto(url + '/');
  let s = await waitFor((s) => s.error || (s.ready && s.frames >= 3), 180000);
  check(s && !s.error, `the engine starts (${s?.error || 'no error'})`);
  check(s && s.ready && s.frames >= 3, `the renderer is ready and drawing (${s?.frames ?? 0} frames)`);
  check(!logs.some((l) => /FATAL|page error/i.test(l)), 'no fatal errors in the log');
  // Give bounced light and the eyes a few seconds to settle, then look.
  await page.waitForTimeout(6000);
  const shot = await page.screenshot({ path: 'build/shots/m0-hall.png', timeout: 90000 });
  const img = decodePng(shot);
  let lo = 255, hi = 0, sum = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
    lo = Math.min(lo, v); hi = Math.max(hi, v); sum += v;
  }
  const mean = sum / (img.data.length / 4);
  check(hi - lo > 40 && mean > 4, `the picture is not blank (brightness ${lo.toFixed(0)}..${hi.toFixed(0)}, mean ${mean.toFixed(1)})`);
  // Walk: hold W for 3 s; you move towards the hearth (−z) and stop at the wall.
  const before = await state();
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(3000);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(600);
  const after = await state();
  check(after.z < before.z - 0.5, `W walks towards the hearth (z ${before.z.toFixed(2)} → ${after.z.toFixed(2)})`);
  // Keep walking until you stop moving (software drawing is slow, so this
  // takes a while): you must stop 0.3 m short of the wall at −2.5.
  await page.keyboard.down('KeyW');
  let wall = await state();
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000);
    const now = await state();
    if (Math.abs(now.z - wall.z) < 0.001 && now.z < -2) { wall = now; break; }
    wall = now;
  }
  await page.keyboard.up('KeyW');
  check(Math.abs(wall.z - -2.2) < 0.01, `the wall stops you 0.3 m short (z ${wall.z.toFixed(2)}, the wall is at −2.5)`);
  await page.screenshot({ path: 'build/shots/m0-hearth.png', timeout: 90000 });
  console.log(`  heap ${Math.round(after.heapMB)} MB`);

  // The memory test, to a small cap (the real run is on the phone).
  await page.goto(url + '/memory.html?cap=256');
  await page.evaluate(() => window.memoryTest.runWasm());
  await page.evaluate(() => window.memoryTest.runGpu());
  const r = await page.evaluate(() => window.memoryResults);
  check(r.wasm?.status === 'done' && r.wasm.mb === 256, `memory test 1 runs to the cap (${JSON.stringify(r.wasm)})`);
  check(r.gpu?.status === 'done' && r.gpu.mb === 256, `memory test 2 runs to the cap (${JSON.stringify(r.gpu)})`);
  await page.screenshot({ path: 'build/shots/m0-memory.png', fullPage: true, timeout: 90000 });
} catch (e) {
  check(false, 'the test ran: ' + e.message);
} finally {
  if (failed) console.log('--- page log ---\n' + logs.slice(-40).join('\n'));
  await browser.close();
  server.close();
}
console.log(failed ? `SMOKE FAILED (${failed})` : 'SMOKE PASSED');
process.exit(failed ? 1 : 0);
