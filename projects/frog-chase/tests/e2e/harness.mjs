// Shared e2e harness. Frozen in WO-001; additions (not changes) via the CEO.
// Uses the globally preinstalled Playwright (do not add it to package.json).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:4317/';
export const SHOTS = join(ROOT, 'artifacts', 'shots');
export const VIEWPORTS = {
  mobile: { width: 375, height: 812, hasTouch: true, isMobile: true },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
};

let failures = 0;
export function check(cond, msg) {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    failures++;
    console.log(`  FAIL ${msg}`);
  }
}

/**
 * Open the game in a fresh context and run fn({page, errors}).
 * Any console error or page error fails the test. `query` is appended to the URL (e.g. "seed=7").
 */
export async function withPage(name, { viewport = VIEWPORTS.desktop, query = 'seed=7', reducedMotion = 'no-preference' } = {}, fn) {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const { width, height, hasTouch = false, isMobile = false } = viewport;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch, isMobile, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  console.log(`# ${name}`);
  try {
    await page.goto(`${BASE_URL}?${query}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__lily, null, { timeout: 5000 });
    await fn({ page, errors });
    check(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  } catch (e) {
    check(false, `threw: ${e?.stack ?? e}`);
  } finally {
    await browser.close();
  }
}

/** Save a viewport screenshot as JPEG q80 (Bureau rule) under artifacts/shots/. */
export async function shot(page, file) {
  mkdirSync(SHOTS, { recursive: true });
  const path = join(SHOTS, file.endsWith('.jpg') ? file : `${file}.jpg`);
  await page.screenshot({ path, type: 'jpeg', quality: 80 });
  return path;
}

export function done() {
  if (failures) {
    console.log(`${failures} check(s) failed`);
    process.exit(1);
  }
}
