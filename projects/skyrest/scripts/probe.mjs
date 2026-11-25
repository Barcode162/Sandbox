// scripts/probe.mjs — `npm run probe` (after `npm run build`): prints the screen-space boxes of
// hero/golem/temple/bridge/arena + draw calls/triangles for the canonical opening frame at desktop,
// phone portrait and phone landscape, and saves a JPEG of each (L-0006: judge layout on screen).
// Usage: node scripts/probe.mjs [outDir]   (default: ./evidence/probe)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? path.join(PROJECT, 'evidence', 'probe'));
const PORT = 4179;
mkdirSync(OUT, { recursive: true });

const server = spawn(path.join(PROJECT, 'node_modules', '.bin', 'vite'), ['preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { cwd: PROJECT, stdio: 'ignore' });
const url = `http://127.0.0.1:${PORT}/`;
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(url)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 200));
}
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  for (const [name, viewport, touch] of [['desktop', { width: 1280, height: 800 }, false], ['portrait', { width: 430, height: 932 }, true], ['landscape', { width: 932, height: 430 }, true]]) {
    const page = await browser.newPage({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    await page.goto(url);
    await page.waitForFunction(() => window.__skyrest?.ready === true, undefined, { timeout: 20000 });
    const r = await page.evaluate(() => {
      const h = window.__skyrest;
      h.setManual(true); h.setSeed(20261125); h.skipTitle(); h.step(30);
      return { stats: h.stats(), probe: h.probe() };
    });
    const shot = path.join(OUT, `probe-${name}.jpg`);
    await page.screenshot({ path: shot, type: 'jpeg', quality: 80 });
    console.log(`\n${name} ${viewport.width}x${viewport.height}  draws ${r.stats.drawCalls}  tris ${r.stats.triangles}  → ${shot}`);
    for (const [k, b] of Object.entries(r.probe)) console.log(`  ${k.padEnd(8)} ${b.visible ? `x${b.x} y${b.y} w${b.w} h${b.h}  centre(${b.cx}, ${b.cy})  hFrac ${b.hFrac}` : 'OFF-SCREEN'}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
