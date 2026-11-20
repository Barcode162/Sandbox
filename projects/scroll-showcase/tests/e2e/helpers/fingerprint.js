// helpers/fingerprint.js: rendered-output fingerprints for determinism (architecture K11, Gate 1 E6/R3).
//
//   frameHash(page, opts)       sha256 of the DECODED RGBA of a viewport screenshot (not of the PNG
//                               bytes, whose encoder settings are not part of the frame). Caret hidden;
//                               `animations` is left at 'allow' on purpose: 'disabled' would finish
//                               running CSS transitions before capture and hide exactly the stale or
//                               time-driven pixels determinism tests exist to catch. Chrome is hidden by
//                               default (see page.js HIDE_CHROME_CSS); pass { hideChrome: false } to
//                               include it, or { mask } to paint over regions.
//   canvasHash(page, selector)  sha256 of getImageData over the FULL backing store of a canvas,
//                               computed in the page with crypto.subtle (127.0.0.1 is a secure context),
//                               so megabytes of pixels never cross the protocol.

import crypto from 'node:crypto';
import { decode } from './pixels.js';
import { screenshot } from './page.js';

/** @typedef {import('@playwright/test').Page} Page */

/**
 * @param {Page} page
 * @param {{ hideChrome?: boolean; mask?: import('@playwright/test').Locator[]; style?: string }} [opts]
 * @returns {Promise<{ hash: string; png: Buffer; width: number; height: number }>}
 */
export async function frameHash(page, opts = {}) {
  const png = await screenshot(page, { hideChrome: opts.hideChrome, mask: opts.mask, style: opts.style, scale: 'device' });
  const img = decode(png);
  const hash = crypto.createHash('sha256').update(img.data).digest('hex');
  return { hash, png, width: img.width, height: img.height };
}

/**
 * @param {Page} page
 * @param {string} selector a selector matching exactly one <canvas>
 * @returns {Promise<{ hash: string; width: number; height: number }>}
 */
export async function canvasHash(page, selector) {
  const r = await page.evaluate(async (sel) => {
    const list = document.querySelectorAll(sel);
    if (list.length !== 1) return { error: `canvasHash: ${list.length} elements match ${sel}` };
    const c = list[0];
    if (!(c instanceof HTMLCanvasElement)) return { error: `canvasHash: ${sel} is not a canvas` };
    const ctx = c.getContext('2d');
    if (!ctx) return { error: `canvasHash: ${sel} has no 2d context` };
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return { hash: hex, width: c.width, height: c.height };
  }, selector);
  if ('error' in r) throw new Error(r.error);
  return r;
}
