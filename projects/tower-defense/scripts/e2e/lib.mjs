// Shared e2e helpers (WO-005 owns): static server over dist/, Chromium via playwright-core, error capture.
// Never run `playwright install`; browsers come from PLAYWRIGHT_BROWSERS_PATH (/opt/pw-browsers) or CHROMIUM_PATH.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright-core';

export const ROOT = resolve(import.meta.dirname, '..', '..');
export const DIST = join(ROOT, 'dist');
export const EVIDENCE = join(ROOT, 'evidence-local');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

export async function serveDist() {
  if (!existsSync(join(DIST, 'index.html'))) throw new Error('dist/ missing — run `npm run build` first');
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '') || 'index.html';
    const file = join(DIST, rel);
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end('not found'); }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}/`, close: () => new Promise((ok) => server.close(ok)) };
}

export async function launch() {
  const opts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  return chromium.launch(opts);
}

/** Open the game with the test hook; collects console errors and page errors. */
export async function openGame(browser, baseUrl, { width = 1280, height = 720, query = 'test=1' } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  await page.goto(`${baseUrl}?${query}`);
  await page.waitForFunction(() => window.__inkfold?.ready(), null, { timeout: 10_000 });
  return { page, problems };
}

export async function evidenceDir(sub) {
  const d = join(EVIDENCE, sub);
  await mkdir(d, { recursive: true });
  return d;
}

export function ok(msg) { console.log(`  ok   ${msg}`); }
export function fail(msg) { console.error(`  FAIL ${msg}`); process.exitCode = 1; }
