// helpers/pixels.js: pixel maths over decoded PNG screenshots (pngjs, no other dependency).
//
//   decode(buf)                      → { width, height, data }  (RGBA, 8-bit)
//   diff(a, b, { threshold: 8 })     → share of pixels where ANY channel differs by > threshold/255,
//                                      plus a diff PNG (changed pixels red over a dimmed copy of b)
//   meanY64x40(png)                  → Ȳ: mean linear-light relative luminance of a 64×40 box
//                                      downscale (§10.1 rule 6 "Measure")
//   windowY64x40(png)                → Ȳ of the 9 overlapping 2×2-tile windows of a 4×4 tiling of
//                                      that downscale; each window is 25% of the viewport (Gate 1 R2)
//   redShare(png)                    → share of pixels with R/(R+G+B) ≥ 0.8 (§10.1 F4)
//   pixelAt(png, x, y)               → [r, g, b, a]
//
// Luminance uses the sRGB transfer function and Rec. 709 / WCAG coefficients:
//   lin(c) = c/12.92 for c ≤ 0.04045, else ((c + 0.055)/1.055)^2.4;  Y = 0.2126 R + 0.7152 G + 0.0722 B.

import pngjs from 'pngjs';

/** @typedef {{ width: number; height: number; data: Buffer | Uint8Array }} Png */

/** @param {Buffer | Png} x @returns {Png} */
export function decode(x) {
  if (Buffer.isBuffer(x)) return pngjs.PNG.sync.read(x);
  return x;
}

/** @param {Png} png @returns {Buffer} */
export function encode(png) {
  const out = new pngjs.PNG({ width: png.width, height: png.height });
  Buffer.from(png.data.buffer, png.data.byteOffset, png.data.byteLength).copy(out.data);
  return pngjs.PNG.sync.write(out);
}

/** @param {Png} png @param {number} x @param {number} y @returns {[number, number, number, number]} */
export function pixelAt(png, x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= png.width || yi >= png.height) throw new RangeError(`pixelAt(${x}, ${y}) outside ${png.width}×${png.height}`);
  const i = (yi * png.width + xi) * 4;
  const d = png.data;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
}

/**
 * Pixel difference. A pixel "differs" when any of R, G, B differs by more than `threshold`
 * (in 0–255 units). Both images must have the same size.
 * @param {Buffer | Png} a @param {Buffer | Png} b
 * @param {{ threshold?: number; diffPng?: boolean }} [opts]
 * @returns {{ count: number; total: number; share: number; maxDelta: number; png: Buffer | null }}
 */
export function diff(a, b, opts = {}) {
  const A = decode(a);
  const B = decode(b);
  if (A.width !== B.width || A.height !== B.height) throw new Error(`diff: size ${A.width}×${A.height} vs ${B.width}×${B.height}`);
  const t = opts.threshold ?? 8;
  const n = A.width * A.height;
  const wantPng = opts.diffPng ?? true;
  const out = wantPng ? new pngjs.PNG({ width: A.width, height: A.height }) : null;
  let count = 0;
  let maxDelta = 0;
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    const dr = Math.abs(A.data[i] - B.data[i]);
    const dg = Math.abs(A.data[i + 1] - B.data[i + 1]);
    const db = Math.abs(A.data[i + 2] - B.data[i + 2]);
    const m = Math.max(dr, dg, db);
    if (m > maxDelta) maxDelta = m;
    const hit = m > t;
    if (hit) count++;
    if (out) {
      if (hit) {
        out.data[i] = 255;
        out.data[i + 1] = 0;
        out.data[i + 2] = 0;
      } else {
        const g = Math.round((B.data[i] * 0.2126 + B.data[i + 1] * 0.7152 + B.data[i + 2] * 0.0722) * 0.35 + 140);
        out.data[i] = g;
        out.data[i + 1] = g;
        out.data[i + 2] = g;
      }
      out.data[i + 3] = 255;
    }
  }
  return { count, total: n, share: count / n, maxDelta, png: out ? pngjs.PNG.sync.write(out) : null };
}

const LIN = new Float64Array(256);
for (let c = 0; c < 256; c++) {
  const s = c / 255;
  LIN[c] = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of an 8-bit sRGB triple. @param {number} r @param {number} g @param {number} b */
export function relY(r, g, b) {
  return 0.2126 * LIN[r] + 0.7152 * LIN[g] + 0.0722 * LIN[b];
}

/**
 * 64×40 box downscale of per-pixel linear luminance: each output cell is the area-weighted mean
 * of the source pixels it covers (fractional coverage at cell edges).
 * @param {Buffer | Png} img @returns {Float64Array} 64·40 values, row-major
 */
export function lumaGrid64x40(img) {
  const P = decode(img);
  const W = 64;
  const H = 40;
  const sx = P.width / W;
  const sy = P.height / H;
  const acc = new Float64Array(W * H);
  const area = new Float64Array(W * H);
  // Per source pixel, split its weight across the (at most 2×2) cells it overlaps.
  for (let y = 0; y < P.height; y++) {
    const cy0 = Math.floor(y / sy);
    const yEdge = (cy0 + 1) * sy;
    const wy0 = Math.min(1, yEdge - y);
    for (let x = 0; x < P.width; x++) {
      const i = (y * P.width + x) * 4;
      const Y = relY(P.data[i], P.data[i + 1], P.data[i + 2]);
      const cx0 = Math.floor(x / sx);
      const xEdge = (cx0 + 1) * sx;
      const wx0 = Math.min(1, xEdge - x);
      const parts = [
        [cx0, cy0, wx0 * wy0],
        [cx0 + 1, cy0, (1 - wx0) * wy0],
        [cx0, cy0 + 1, wx0 * (1 - wy0)],
        [cx0 + 1, cy0 + 1, (1 - wx0) * (1 - wy0)],
      ];
      for (const [cx, cy, w] of parts) {
        if (w <= 0 || cx >= W || cy >= H) continue;
        const k = cy * W + cx;
        acc[k] += Y * w;
        area[k] += w;
      }
    }
  }
  for (let k = 0; k < W * H; k++) acc[k] = area[k] > 0 ? acc[k] / area[k] : 0;
  return acc;
}

/** Ȳ: mean of the 64×40 linear-luminance downscale. @param {Buffer | Png | Float64Array} img */
export function meanY64x40(img) {
  const g = img instanceof Float64Array ? img : lumaGrid64x40(img);
  let s = 0;
  for (const v of g) s += v;
  return s / g.length;
}

/**
 * The 25% windows (R2): the 64×40 downscale is tiled 4×4 (tiles of 16×10 cells); every 2×2 block
 * of adjacent tiles is a window, giving 3×3 = 9 overlapping windows, each 32×20 cells = 25% of the
 * viewport. Returns Ȳ per window, row-major (window [r][c] covers tile rows r..r+1, cols c..c+1).
 * @param {Buffer | Png | Float64Array} img
 * @returns {{ windows: number[]; mean: number }}
 */
export function windowY64x40(img) {
  const g = img instanceof Float64Array ? img : lumaGrid64x40(img);
  /** @type {number[]} */
  const windows = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let s = 0;
      for (let y = r * 10; y < r * 10 + 20; y++) for (let x = c * 16; x < c * 16 + 32; x++) s += g[y * 64 + x];
      windows.push(s / (32 * 20));
    }
  }
  return { windows, mean: meanY64x40(g) };
}

/**
 * Share of pixels that are "saturated red" in the WCAG sense used by §10.1 F4: R/(R+G+B) ≥ 0.8
 * on 8-bit sRGB values (pure black, R+G+B = 0, is not red).
 * @param {Buffer | Png} img
 */
export function redShare(img) {
  const P = decode(img);
  const n = P.width * P.height;
  let red = 0;
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    const s = P.data[i] + P.data[i + 1] + P.data[i + 2];
    if (s > 0 && P.data[i] / s >= 0.8) red++;
  }
  return red / n;
}

/**
 * Crop a rectangle (device px) out of a decoded image.
 * @param {Buffer | Png} img @param {{ x: number; y: number; width: number; height: number }} r @returns {Png}
 */
export function crop(img, r) {
  const P = decode(img);
  const x0 = Math.max(0, Math.floor(r.x));
  const y0 = Math.max(0, Math.floor(r.y));
  const w = Math.min(P.width - x0, Math.round(r.width));
  const h = Math.min(P.height - y0, Math.round(r.height));
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const src = ((y0 + y) * P.width + x0) * 4;
    Buffer.from(P.data.buffer, P.data.byteOffset + src, w * 4).copy(data, y * w * 4);
  }
  return { width: w, height: h, data };
}
