// Suite-private helpers for the WO-011 Scene 5 checks: where evidence goes
// (K12), opening the harness at a viewport and DPR, and decoded pixels.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

/**
 * `$EVIDENCE_DIR/dev/s5/`, resolved per K12: EVIDENCE_DIR, then
 * SHOWCASE_EVIDENCE_DIR, then the dossier's evidence directory when the
 * project sits in the Bureau repo, otherwise `evidence-local/`.
 */
export function evidenceDir() {
  const dossier = path.resolve(PROJECT, '../../bureau/missions/M-0001-scroll-showcase/evidence');
  const base = process.env.EVIDENCE_DIR
    || process.env.SHOWCASE_EVIDENCE_DIR
    || (fs.existsSync(dossier) ? dossier : path.join(PROJECT, 'evidence-local'));
  const dir = path.join(base, 'dev', 's5');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * @typedef {[number, number, number]} RGB
 * @typedef {{ width: number, height: number, data: Buffer, at(x: number, y: number): RGB }} Pixels
 * @param {Buffer} png
 * @returns {Pixels}
 */
export function decode(png) {
  const img = pngjs.PNG.sync.read(png);
  return {
    width: img.width,
    height: img.height,
    data: img.data,
    at(x, y) {
      const i = (y * img.width + x) * 4;
      return [img.data[i], img.data[i + 1], img.data[i + 2]];
    },
  };
}

/** '#F54123' → [245, 65, 35]. @param {string} hex @returns {RGB} */
export function rgb(hex) {
  const h = hex.trim().replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** @param {RGB} c */
export const key = (c) => c.join(',');

/** Screen blend of two 8-bit colours (CSS Compositing `screen`). @param {RGB} a @param {RGB} b @returns {RGB} */
export function screen(a, b) {
  return /** @type {RGB} */ (a.map((x, i) => Math.round(255 - ((255 - x) * (255 - b[i])) / 255)));
}

/**
 * A pixel addressed in device pixels of the (u, v) frame. In portrait the
 * stage is transposed (K5), so u runs down the screen and v across it.
 * @param {Pixels} px
 * @param {boolean} landscape
 * @param {number} du device-pixel u
 * @param {number} dv device-pixel v
 */
export function atUV(px, landscape, du, dv) {
  return landscape ? px.at(du, dv) : px.at(dv, du);
}

/**
 * Device pixels along u at the device row dv.
 * @param {Pixels} px
 * @param {{ U: number, dpr: number, landscape: boolean }} vp
 * @param {number} dv
 */
export function lineU(px, vp, dv) {
  const n = Math.round(vp.U * vp.dpr);
  /** @type {RGB[]} */
  const out = [];
  for (let i = 0; i < n; i++) out.push(atUV(px, vp.landscape, i, dv));
  return out;
}

/** Split a scan line into runs of identical colour. @param {RGB[]} line */
export function runs(line) {
  /** @type {{ colour: string, start: number, length: number }[]} */
  const out = [];
  line.forEach((c, i) => {
    const k = key(c);
    if (out.length && out[out.length - 1].colour === k) out[out.length - 1].length++;
    else out.push({ colour: k, start: i, length: 1 });
  });
  return out;
}

/**
 * Open the scene harness on Scene 5 in a fresh context at the given size and
 * DPR, collecting console errors, warnings and page errors into `problems`.
 * @param {import('@playwright/test').Browser} browser
 * @param {{ width: number, height: number, dpr: number, p?: number, problems: string[] }} o
 */
export async function openHarness(browser, { width, height, dpr, p = 0, problems }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
  const page = await context.newPage();
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`console.${msg.type()}: ${msg.text()}`);
  });
  await page.goto(`/__dev/harness.html?scene=5&p=${p}&amb=0&t=0`);
  await page.waitForFunction(() => document.documentElement.dataset.boot === 'ready');
  await page.evaluate(() => document.fonts.ready);
  await frames(page);
  return { context, page };
}

/** Two rAFs: the frame after the last write has painted. @param {import('@playwright/test').Page} page */
export function frames(page) {
  return page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null)))));
}

/**
 * Apply (p, a, t) through the harness, wait for paint, and return the state
 * and a decoded device-scale screenshot.
 * @param {import('@playwright/test').Page} page
 * @param {number} p
 * @param {number} [a]
 * @param {number} [t]
 * @param {string} [file] also save the PNG here
 */
export async function frameAt(page, p, a = 0, t = 0, file) {
  const s = await page.evaluate(([pp, aa, tt]) => window.__harness.set(pp, aa, tt), [p, a, t]);
  await frames(page);
  const png = await page.screenshot({ caret: 'hide', ...(file ? { path: file } : {}) });
  return { state: s, png, px: decode(png) };
}
