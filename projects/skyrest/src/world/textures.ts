// src/world/textures.ts — owned by WO-002. Procedural canvas textures (§4.2): grass mottle, cliff strata, leaf
// scallops, cloud-sea noise, waterfall streaks, banners, the emblem glyph, cumulus billboards, soft puffs.
// Built once at init; deterministic (seeded), no platform randomness.
import * as THREE from 'three';
import { makeRng } from '../core/rng.ts';
import { PALETTE } from '../tuning/world.ts';
import { fbm2 } from './noise.ts';

const css = (hex: number, a = 1) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;

function canvas(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function finish(c: HTMLCanvasElement, wrap = true, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Writes tileable fbm into an ImageData via a colour ramp callback. */
function noiseFill(g: CanvasRenderingContext2D, n: number, scale: number, octaves: number, seed: number,
  ramp: (v: number, x: number, y: number) => [number, number, number, number]) {
  const img = g.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      // Tileable: blend four offset samples across the wrap seam.
      const u = x / n, v = y / n;
      const s = (ax: number, ay: number) => fbm2(ax * scale, ay * scale, octaves, seed);
      const val = s(u, v) * (1 - u) * (1 - v) + s(u - 1, v) * u * (1 - v) + s(u, v - 1) * (1 - u) * v + s(u - 1, v - 1) * u * v;
      const [r, gg, b, a] = ramp(val, x, y);
      const i = (y * n + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = gg;
      img.data[i + 2] = b;
      img.data[i + 3] = a;
    }
  g.putImageData(img, 0, 0);
}

const rgb = (hex: number): [number, number, number] => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const mixc = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 255];

/** Grass mottle: grass-mid ↔ grass-lit patches + 6 % grass-tip speckle + small dark clover marks. */
export function grassTexture(): THREE.Texture {
  const n = 512;
  const [c, g] = canvas(n);
  const mid = rgb(PALETTE.grassMid), lit = rgb(PALETTE.grassLit);
  noiseFill(g, n, 6, 4, 3, (v) => mixc(mid, lit, Math.min(1, Math.max(0, v * 1.4 + 0.5))));
  const rnd = makeRng(91);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * n, y = rnd() * n;
    g.fillStyle = css(PALETTE.grassTip, 0.55);
    g.fillRect(x, y, 1 + rnd() * 2, 2 + rnd() * 3);
  }
  for (let i = 0; i < 260; i++) {
    const x = rnd() * n, y = rnd() * n, r = 3 + rnd() * 5;
    g.fillStyle = css(PALETTE.grassShade, 0.28);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + rnd();
      g.beginPath();
      g.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, r * 0.4, a, 0, Math.PI * 2);
      g.fill();
    }
  }
  return finish(c);
}

/** Cliff strata: horizontal bands of cliff-lit / cliff-mid with darker seams, cracks and drip streaks. */
export function cliffTexture(): THREE.Texture {
  const n = 512;
  const [c, g] = canvas(n);
  const lit = rgb(PALETTE.cliffLit), mid = rgb(PALETTE.cliffMid);
  noiseFill(g, n, 5, 4, 5, (v, x, y) => {
    const band = Math.sin((y / n) * Math.PI * 2 * 6 + v * 2.2) * 0.5 + 0.5;
    const t = Math.min(1, Math.max(0, band * 0.75 + v * 0.5 + 0.1 * Math.sin(x * 0.05)));
    return mixc(mid, lit, t);
  });
  const rnd = makeRng(17);
  // Seams between strata.
  for (let k = 0; k < 6; k++) {
    const y0 = ((k + 0.5) / 6) * n;
    g.strokeStyle = css(PALETTE.cliffShade, 0.45);
    g.lineWidth = 2 + rnd() * 2;
    g.beginPath();
    for (let x = 0; x <= n; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.03 + k) * 6 + (rnd() - 0.5) * 4);
    g.stroke();
  }
  // Vertical cracks and drip streaks.
  for (let i = 0; i < 70; i++) {
    const x = rnd() * n, y = rnd() * n, len = 30 + rnd() * 120;
    const grd = g.createLinearGradient(x, y, x, y + len);
    grd.addColorStop(0, css(PALETTE.cliffShade, 0.35));
    grd.addColorStop(1, css(PALETTE.cliffShade, 0));
    g.fillStyle = grd;
    g.fillRect(x, y, 2 + rnd() * 4, len);
  }
  for (let i = 0; i < 40; i++) {
    const x = rnd() * n, y = rnd() * n;
    g.fillStyle = css(PALETTE.cliffLit, 0.4);
    g.fillRect(x, y, 6 + rnd() * 20, 2);
  }
  return finish(c);
}

/** Leaf scallops: overlapping round leaf clumps, each lit on top with a darker crevice (−18 %) underneath. */
export function leafTexture(): THREE.Texture {
  const n = 512;
  const [c, g] = canvas(n);
  g.fillStyle = '#c4c4c4';
  g.fillRect(0, 0, n, n);
  const rnd = makeRng(23);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * n, y = rnd() * n, r = 10 + rnd() * 16;
    for (const ox of [-n, 0, n])
      for (const oy of [-n, 0, n]) {
        const cx = x + ox, cy = y + oy;
        if (cx < -r || cx > n + r || cy < -r || cy > n + r) continue;
        const grd = g.createRadialGradient(cx - r * 0.2, cy - r * 0.35, r * 0.1, cx, cy, r);
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(0.65, '#ececec');
        grd.addColorStop(0.92, '#bdbdbd');
        grd.addColorStop(1, 'rgba(170,170,170,0)');
        g.fillStyle = grd;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
      }
  }
  return finish(c, true, false);
}

/** Cloud sea: two octaves of billowy noise, white with cloud-shade valleys; alpha 1 (the sea is opaque). */
export function cloudSeaTexture(): THREE.Texture {
  const n = 512;
  const [c, g] = canvas(n);
  const lit = rgb(PALETTE.cloudLit), shade = rgb(PALETTE.cloudShade), deep = rgb(PALETTE.cloudDeep);
  noiseFill(g, n, 4, 5, 9, (v) => {
    const t = Math.min(1, Math.max(0, v * 1.6 + 0.55));
    return t > 0.5 ? mixc(shade, lit, (t - 0.5) * 2) : mixc(deep, shade, t * 2);
  });
  return finish(c);
}

/** Waterfall streaks: white body with vertical blue streaks; alpha thins at the edges. Greyscale-friendly. */
export function fallTexture(): THREE.Texture {
  const w = 128, h = 512;
  const [c, g] = canvas(w, h);
  g.fillStyle = css(PALETTE.fallWhite);
  g.fillRect(0, 0, w, h);
  const rnd = makeRng(57);
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w, y = rnd() * h, len = 40 + rnd() * 200, wd = 1 + rnd() * 4;
    g.fillStyle = css(PALETTE.fallStreak, 0.35 + rnd() * 0.45);
    for (const oy of [-h, 0, h]) g.fillRect(x, y + oy, wd, len);
  }
  for (let i = 0; i < 50; i++) {
    const x = rnd() * w, y = rnd() * h;
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (const oy of [-h, 0, h]) g.fillRect(x, y + oy, 2 + rnd() * 3, 20 + rnd() * 60);
  }
  return finish(c);
}

/** Soft round puff (mist, cumulus lobes, petals' alpha): white radial falloff. */
export function puffTexture(): THREE.Texture {
  const n = 128;
  const [c, g] = canvas(n);
  const grd = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, n, n);
  return finish(c, false);
}

/** Painted cumulus for the far billboards: stacked lobes, lit top, cloud-shade belly. */
export function cumulusTexture(): THREE.Texture {
  const w = 512, h = 256;
  const [c, g] = canvas(w, h);
  const rnd = makeRng(73);
  const lobes: [number, number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const x = 70 + rnd() * (w - 140);
    const r = 34 + rnd() * 52 * (1 - Math.abs(x - w / 2) / w);
    lobes.push([x, h - 50 - r * (0.55 + rnd() * 0.5), r]);
  }
  for (const [x, y, r] of lobes) {
    const grd = g.createRadialGradient(x - r * 0.25, y - r * 0.4, r * 0.1, x, y, r);
    grd.addColorStop(0, css(PALETTE.cloudLit));
    grd.addColorStop(0.7, css(0xf2f6fb));
    grd.addColorStop(1, css(PALETTE.cloudShade));
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // Flat belly.
  const belly = g.createLinearGradient(0, h - 90, 0, h - 40);
  belly.addColorStop(0, css(PALETTE.cloudShade, 0));
  belly.addColorStop(1, css(PALETTE.cloudShade, 1));
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = belly;
  g.fillRect(0, h - 90, w, 60);
  g.globalCompositeOperation = 'destination-out';
  g.fillRect(0, h - 40, w, 40);
  g.globalCompositeOperation = 'source-over';
  const t = finish(c, false);
  t.premultiplyAlpha = true;
  return t;
}

/** Banner cloth: banner blue with a gold trim border and an original upward chevron + dot device. */
export function bannerTexture(): THREE.Texture {
  const w = 128, h = 448;
  const [c, g] = canvas(w, h);
  g.fillStyle = css(PALETTE.banner);
  g.fillRect(0, 0, w, h);
  g.strokeStyle = css(PALETTE.bannerTrim);
  g.lineWidth = 7;
  g.strokeRect(10, 10, w - 20, h - 64);
  // Swallow-tail cut at the bottom (alpha).
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(w / 2, h - 52);
  g.lineTo(w, h);
  g.fill();
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = css(PALETTE.bannerTrim);
  g.beginPath();
  g.moveTo(w / 2, 120);
  g.lineTo(w / 2 + 34, 190);
  g.lineTo(w / 2 + 18, 190);
  g.lineTo(w / 2, 152);
  g.lineTo(w / 2 - 18, 190);
  g.lineTo(w / 2 - 34, 190);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(w / 2, 200);
  g.lineTo(w / 2 + 34, 270);
  g.lineTo(w / 2 + 18, 270);
  g.lineTo(w / 2, 232);
  g.lineTo(w / 2 - 18, 270);
  g.lineTo(w / 2 - 34, 270);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(w / 2, 310, 9, 0, Math.PI * 2);
  g.fill();
  return finish(c, false);
}

/** Stone wall courses for the temple: faint block joints on white (multiplied over the vertex colour). */
export function stoneTexture(): THREE.Texture {
  const n = 256;
  const [c, g] = canvas(n);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, n, n);
  const rnd = makeRng(29);
  g.strokeStyle = 'rgba(150,160,190,0.55)';
  g.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    const y = row * 32;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(n, y);
    g.stroke();
    const off = row % 2 ? 32 : 0;
    for (let x = off; x < n; x += 64) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 32);
      g.stroke();
    }
  }
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(170,180,205,${0.05 + rnd() * 0.12})`;
    g.fillRect(rnd() * n, rnd() * n, 2 + rnd() * 6, 2 + rnd() * 6);
  }
  return finish(c);
}

/** Wood grain for planks and posts. */
export function woodTexture(): THREE.Texture {
  const n = 256;
  const [c, g] = canvas(n);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, n, n);
  const rnd = makeRng(61);
  for (let i = 0; i < 70; i++) {
    const y = rnd() * n;
    g.strokeStyle = `rgba(120,80,50,${0.1 + rnd() * 0.25})`;
    g.lineWidth = 1 + rnd() * 2;
    g.beginPath();
    for (let x = 0; x <= n; x += 8) g.lineTo(x, y + Math.sin(x * 0.04 + i) * 3);
    g.stroke();
  }
  return finish(c);
}
