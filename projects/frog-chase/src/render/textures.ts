/**
 * Pre-rendered print tiles (§5.2, plan §14.5): a seamless 512² halftone of `water-b` dots (4 px pitch,
 * radius 0.9–1.6 px from 2-octave periodic value noise) and a 256² paper-grain tile. Built once, then
 * drawn as scrolling patterns. The low quality tier uses a 256² halftone at 8 px pitch and no grain.
 */
import { valueNoise, rand3 } from './noise';
import { PALETTE } from './palette';

function canvasOf(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

/**
 * Halftone dots of `water-b`. pitch px between dot centres; size must be a multiple of pitch·16.
 * `opaque` bakes them onto `water-a` (the river base: an opaque blit, no blending); otherwise the dots
 * sit on transparent (laid over the submerged gator so it reads as under the print).
 */
export function makeHalftone(size: number, pitch: number, opaque = false): HTMLCanvasElement {
  const c = canvasOf(size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const cells = size / pitch;
  const radius = new Float32Array(cells * cells);
  for (let j = 0; j < cells; j++)
    for (let i = 0; i < cells; i++) {
      const n = 0.65 * valueNoise(i / 16, j / 16, cells / 16, 11) + 0.35 * valueNoise(i / 8, j / 8, cells / 8, 23);
      radius[j * cells + i] = (0.9 + 0.7 * n) * (pitch / 4);
    }
  const [r, g, b] = rgb(PALETTE.waterB);
  const [ar, ag, ab] = rgb(PALETTE.waterA);
  const half = pitch / 2;
  for (let y = 0; y < size; y++) {
    const cj = Math.floor(y / pitch);
    const dy = y + 0.5 - (cj * pitch + half);
    for (let x = 0; x < size; x++) {
      const ci = Math.floor(x / pitch);
      const dx = x + 0.5 - (ci * pitch + half);
      const cover = Math.max(0, Math.min(1, radius[cj * cells + ci]! - Math.sqrt(dx * dx + dy * dy) + 0.5));
      const k = (y * size + x) * 4;
      if (opaque) {
        img.data[k] = Math.round(ar + (r - ar) * cover);
        img.data[k + 1] = Math.round(ag + (g - ag) * cover);
        img.data[k + 2] = Math.round(ab + (b - ab) * cover);
        img.data[k + 3] = 255;
        continue;
      }
      if (cover <= 0) continue;
      img.data[k] = r;
      img.data[k + 1] = g;
      img.data[k + 2] = b;
      img.data[k + 3] = Math.round(cover * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Paper grain (§5.2: 6% multiply). Baked as ink with alpha 0.06·(1 − v): drawn source-over it darkens
 * like a 6% multiply of grey v (toward ink rather than black), at a fraction of multiply's raster cost.
 */
export function makeGrain(size: number): HTMLCanvasElement {
  const c = canvasOf(size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const [ir, ig, ib] = rgb(PALETTE.ink);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      // Fibre-ish grain: fine noise plus a soft periodic mottling.
      const fine = rand3(x, y, 91);
      const mot = valueNoise(x / 32, y / 32, size / 32, 5);
      const dark = 0.55 * fine + 0.45 * mot;
      const k = (y * size + x) * 4;
      img.data[k] = ir;
      img.data[k + 1] = ig;
      img.data[k + 2] = ib;
      img.data[k + 3] = Math.round(255 * 0.06 * dark);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}
