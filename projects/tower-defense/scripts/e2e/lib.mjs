// Shared e2e helpers (WO-005 owns): static server over dist/, Chromium via playwright-core, error capture.
// Never run `playwright install`; browsers come from PLAYWRIGHT_BROWSERS_PATH (/opt/pw-browsers) or CHROMIUM_PATH.
// Every script reads the game only through window.__inkfold (plan.md seams).
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
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

/** Launch headless Chromium. `args` adds switches (perf uses --js-flags=--expose-gc). */
export async function launch({ args = [] } = {}) {
  const opts = { args };
  if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  return chromium.launch(opts);
}

/** Open the game with the test hook; collects console errors and page errors. */
export async function openGame(browser, baseUrl, { width = 1280, height = 720, query = 'test=1' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  const t0 = Date.now();
  await page.goto(`${baseUrl}?${query}`);
  await page.waitForFunction(() => window.__inkfold?.ready(), null, { timeout: 10_000 });
  const readyMs = Date.now() - t0;
  page.once('close', () => context.close().catch(() => undefined));
  return { page, problems, readyMs };
}

/** All problems seen so far: page-level plus the app's own error log. */
export async function allErrors(page, problems) {
  const app = await page.evaluate(() => window.__inkfold?.errors() ?? []).catch((e) => [`hook errors() failed: ${e.message}`]);
  return [...problems, ...app.map((m) => `app: ${m}`)];
}

/**
 * Call a hook method in the page. Errors (including the scaffold's "PENDING: …" stubs) come back as
 * `{ error }` instead of throwing, so a script can report every check rather than stop at the first.
 */
export async function hook(page, method, ...args) {
  try {
    const value = await page.evaluate(async ([m, a]) => await window.__inkfold[m](...a), [method, args]);
    return { value };
  } catch (e) {
    return { error: String(e.message ?? e).split('\n')[0].replace(/^page\.evaluate: (Error: )?/, '') };
  }
}

/** Run `fn` over `items` with at most `n` in flight; results keep input order. */
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

export async function evidenceDir(sub) {
  const d = join(EVIDENCE, sub);
  await mkdir(d, { recursive: true });
  return d;
}

export async function writeEvidence(sub, name, data) {
  const file = join(await evidenceDir(sub), name);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

export const pct = (sorted, p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;

export function ok(msg) { console.log(`  ok   ${msg}`); }
export function fail(msg) { console.error(`  FAIL ${msg}`); process.exitCode = 1; }
export function check(cond, good, bad) { cond ? ok(good) : fail(bad ?? good); return !!cond; }
