/**
 * World dressing (§5.4): sand banks (start, finish and the desktop side margins), pebbles, sand ripples,
 * cut-paper reed clumps (5–9 blades, ±3° sway, 2.4–3.6 s periods), the finish bank's hollow log with
 * bloom flowers, and the generator's decor (buds, petals, flowers on stalks). Deterministic per seed.
 * Draws in world units (y up) on the world transform.
 */
import type { Decor } from '../contracts';
import { LOG_END, LOG_FILL, PEBBLE, REED_DARK, SAND_LINE, SHADOW } from './color';
import { rand3 } from './noise';
import { PALETTE } from './palette';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export interface Bounds {
  xL: number;
  xR: number;
  yB: number;
  yT: number;
}

/** Shore lines in wu. The river is x 0..100 between the south shore and the north shore. */
export function southShore(x: number, seed: number): number {
  const s = (seed % 97) * 0.13;
  return 7 + 1.4 * Math.sin(0.19 * x + 1.3 + s) + 0.8 * Math.sin(0.47 * x + 0.4 + s * 2);
}
export function northShore(x: number, northY: number, seed: number): number {
  const s = (seed % 89) * 0.17;
  return northY - 7.5 - 1.4 * Math.sin(0.17 * x + 2.1 + s) - 0.8 * Math.sin(0.51 * x + s);
}
export function leftEdge(y: number): number {
  return -1.4 - 1.3 * (1 + Math.sin(0.11 * y + 0.7)) * 0.5 - 0.7 * (1 + Math.sin(0.37 * y)) * 0.5;
}
export function rightEdge(y: number): number {
  return 101.4 + 1.3 * (1 + Math.sin(0.12 * y + 2.2)) * 0.5 + 0.7 * (1 + Math.sin(0.33 * y + 1)) * 0.5;
}

/**
 * Each bank region is filled on its own (overlapping subpaths of opposite winding would cancel).
 * With `shadow`, only a thin strip between the shifted and the true shore is filled: the sand covers the rest.
 */
function fillBanks(ctx: CanvasRenderingContext2D, b: Bounds, northY: number, seed: number, shadow: boolean): void {
  const pad = 6;
  const ox = shadow ? 0.35 * 1.6 : 0, oy = shadow ? -0.45 * 1.6 : 0;
  const step = Math.max(1.5, (b.xR - b.xL) / 90);
  const y0 = b.yB - pad, y1 = b.yT + pad, x0 = b.xL - pad, x1 = b.xR + pad;
  if (b.xL < 0) {
    ctx.beginPath();
    for (let y = y0; y <= y1; y += step) ctx.lineTo(leftEdge(y) + ox, y + oy);
    if (shadow) for (let y = y1; y >= y0; y -= step) ctx.lineTo(leftEdge(y), y);
    else {
      ctx.lineTo(x0, y1);
      ctx.lineTo(x0, y0);
    }
    ctx.fill();
  }
  if (b.xR > 100) {
    ctx.beginPath();
    for (let y = y0; y <= y1; y += step) ctx.lineTo(rightEdge(y) + ox, y + oy);
    if (shadow) for (let y = y1; y >= y0; y -= step) ctx.lineTo(rightEdge(y), y);
    else {
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1, y0);
    }
    ctx.fill();
  }
  if (b.yB < 14) {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) ctx.lineTo(x + ox, southShore(x, seed) + oy);
    if (shadow) for (let x = x1; x >= x0; x -= step) ctx.lineTo(x, southShore(x, seed));
    else {
      ctx.lineTo(x1, y0);
      ctx.lineTo(x0, y0);
    }
    ctx.fill();
  }
  if (b.yT > northY - 14) {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) ctx.lineTo(x + ox, northShore(x, northY, seed) + oy);
    if (shadow) for (let x = x1; x >= x0; x -= step) ctx.lineTo(x, northShore(x, northY, seed));
    else {
      ctx.lineTo(x1, y1);
      ctx.lineTo(x0, y1);
    }
    ctx.fill();
  }
}

/** Is a world point on sand? */
export function onBank(x: number, y: number, northY: number, seed: number): boolean {
  return x < leftEdge(y) || x > rightEdge(y) || y < southShore(x, seed) || y > northShore(x, northY, seed);
}

/** Sand with its hard shadow on the water (bank height 1.6 wu). */
export function drawBanks(ctx: CanvasRenderingContext2D, b: Bounds, northY: number, seed: number): void {
  ctx.fillStyle = SHADOW;
  fillBanks(ctx, b, northY, seed, true);
  ctx.fillStyle = PALETTE.bank;
  fillBanks(ctx, b, northY, seed, false);
}

const CELL = 13;

/**
 * Pebbles and sand ripples on visible sand cells. Batched: one path per ink (shadow, three pebble tones,
 * ripple lines), so a wide desktop margin costs five fills, not hundreds.
 */
export function drawBankDetail(ctx: CanvasRenderingContext2D, b: Bounds, northY: number, seed: number): void {
  const i0 = Math.floor(b.xL / CELL) - 1, i1 = Math.ceil(b.xR / CELL) + 1;
  const j0 = Math.floor(b.yB / CELL) - 1, j1 = Math.ceil(b.yT / CELL) + 1;
  for (let pass = 0; pass < 5; pass++) {
    ctx.beginPath();
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const cx = (i + rand3(i, j, seed)) * CELL, cy = (j + rand3(j, i, seed + 1)) * CELL;
        const r = rand3(i, j, seed + 7);
        if (pass < 4 ? r >= 0.45 : r < 0.45 || r >= 0.75) continue;
        if (!onBank(cx, cy, northY, seed)) continue;
        // Keep the sand right under the frog clean (start and finish).
        if (Math.abs(cx - 50) < 9 && (Math.abs(cy) < 6 || Math.abs(cy - northY) < 6)) continue;
        if (pass === 4) {
          for (let k = 0; k < 3; k++) {
            const yy = cy + k * 1.6;
            ctx.moveTo(cx - 3.5, yy);
            ctx.quadraticCurveTo(cx, yy + 1.1, cx + 3.5, yy);
          }
          continue;
        }
        const n = 1 + Math.floor(rand3(i, j, 3) * 3);
        for (let k = 0; k < n; k++) {
          if (pass > 0 && k % 3 !== pass - 1) continue;
          const px = cx + (rand3(i, j, 10 + k) - 0.5) * 5, py = cy + (rand3(i, j, 20 + k) - 0.5) * 5;
          const rr = 0.8 + rand3(i, j, 30 + k) * 1.3;
          const rot = rand3(i, j, 40 + k) * Math.PI;
          const ox = pass === 0 ? 0.3 : 0, oy = pass === 0 ? -0.4 : 0;
          ctx.moveTo(px + ox + Math.cos(rot) * rr, py + oy + Math.sin(rot) * rr);
          ctx.ellipse(px + ox, py + oy, rr, rr * 0.7, rot, 0, TAU);
        }
      }
    if (pass === 4) {
      ctx.strokeStyle = SAND_LINE;
      ctx.lineWidth = 0.45;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else {
      ctx.fillStyle = pass === 0 ? SHADOW : PEBBLE[pass - 1]!;
      ctx.fill();
    }
  }
}

/** Reed clump positions along every visible shore edge. */
export interface ReedClump {
  x: number;
  y: number;
  n: number;
  period: number;
  phase: number;
  id: number;
}

export function collectReeds(b: Bounds, northY: number, seed: number, out: ReedClump[]): number {
  let n = 0;
  const push = (x: number, y: number, id: number) => {
    if (x < b.xL - 12 || x > b.xR + 12 || y < b.yB - 12 || y > b.yT + 12) return;
    const c = out[n] ?? (out[n] = { x: 0, y: 0, n: 0, period: 0, phase: 0, id: 0 });
    c.x = x;
    c.y = y;
    c.n = 5 + Math.floor(rand3(id, 1, seed) * 5);
    c.period = 2.4 + rand3(id, 2, seed) * 1.2;
    c.phase = rand3(id, 3, seed) * TAU;
    c.id = id;
    n++;
  };
  const S = 15;
  if (b.xL < 0 || b.xR > 100)
    for (let j = Math.floor(b.yB / S) - 1; j <= Math.ceil(b.yT / S) + 1; j++) {
      const y = j * S + rand3(j, 5, seed) * 8;
      if (y < southShore(0, seed) || y > northShore(0, northY, seed)) continue;
      if (b.xL < 0) push(leftEdge(y) - 2.2 - rand3(j, 6, seed) * 2, y, j * 2);
      if (b.xR > 100) push(rightEdge(y) + 2.2 + rand3(j, 7, seed) * 2, y, j * 2 + 1);
      // Second row deeper in the margin on wide screens.
      if (b.xL < -30 && rand3(j, 8, seed) < 0.6) push(-14 - rand3(j, 9, seed) * 22, y + 4, 9000 + j);
      if (b.xR > 130 && rand3(j, 10, seed) < 0.6) push(114 + rand3(j, 11, seed) * 22, y + 4, 9500 + j);
    }
  const T = 17;
  for (let i = Math.floor(b.xL / T) - 1; i <= Math.ceil(b.xR / T) + 1; i++) {
    const x = i * T + rand3(i, 12, seed) * 7;
    if (Math.abs(x - 50) < 13) continue;
    if (b.yB < 14) push(x, southShore(x, seed) - 2.4, 20000 + i);
    if (b.yT > northY - 14 && Math.abs(x - 73) > 18) push(x, northShore(x, northY, seed) + 2.4, 30000 + i);
  }
  return n;
}

/** Blades fan up-screen; sway ±3° (50% speed under reduced motion via ambientS). One path per ink. */
export function drawReeds(ctx: CanvasRenderingContext2D, clumps: readonly ReedClump[], n: number, ambientS: number, shadowPass: boolean): void {
  const ox = shadowPass ? 0.35 * 3 : 0, oy = shadowPass ? -0.45 * 3 : 0;
  for (let ink = 0; ink < (shadowPass ? 1 : 2); ink++) {
    ctx.beginPath();
    for (let c = 0; c < n; c++) {
      const k = clumps[c]!;
      const sway = 3 * DEG * Math.sin((TAU * ambientS) / k.period + k.phase);
      for (let i = 0; i < k.n; i++) {
        if (!shadowPass && (i % 3 === 1 ? 1 : 0) !== ink) continue;
        const u = k.n > 1 ? i / (k.n - 1) - 0.5 : 0;
        const a = Math.PI / 2 + u * 1.5 + (rand3(k.id, i, 4) - 0.5) * 0.3 + sway * (1 + Math.abs(u));
        const len = 5 + rand3(k.id, i, 5) * 5.5;
        const w = 0.55 + rand3(k.id, i, 6) * 0.35;
        const bx = k.x + u * 2.2 + ox, by = k.y + oy;
        const ca = Math.cos(a), sa = Math.sin(a);
        const nx = -sa * w, ny = ca * w;
        ctx.moveTo(bx + nx, by + ny);
        ctx.quadraticCurveTo(bx + ca * len * 0.55 + nx * 0.8, by + sa * len * 0.55 + ny * 0.8, bx + ca * len, by + sa * len);
        ctx.quadraticCurveTo(bx + ca * len * 0.55 - nx * 0.8, by + sa * len * 0.55 - ny * 0.8, bx - nx, by - ny);
        ctx.closePath();
      }
    }
    ctx.fillStyle = shadowPass ? SHADOW : ink ? REED_DARK : PALETTE.reed;
    ctx.fill();
  }
}

function flower(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, petal: string, centre: string, rot: number): void {
  ctx.fillStyle = SHADOW;
  ctx.beginPath();
  ctx.arc(x + 0.35 * 1.8, y - 0.45 * 1.8, r * 1.05, 0, TAU);
  ctx.fill();
  ctx.fillStyle = petal;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * TAU) / 5;
    const ex = x + Math.cos(a) * r * 0.55, ey = y + Math.sin(a) * r * 0.55;
    ctx.moveTo(ex + Math.cos(a) * r * 0.55, ey + Math.sin(a) * r * 0.55);
    ctx.ellipse(ex, ey, r * 0.55, r * 0.34, a, 0, TAU);
  }
  ctx.fill();
  ctx.fillStyle = centre;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, TAU);
  ctx.fill();
}

/** The finish bank's hollow log with bloom flowers (§5.4). */
export function drawLog(ctx: CanvasRenderingContext2D, northY: number, b: Bounds, ambientS: number): void {
  const x = 74, y = northY + 8.5;
  if (y < b.yB - 20 || y > b.yT + 20) return;
  const L = 30, R = 4.6, rot = -0.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = SHADOW;
  ctx.beginPath();
  ctx.roundRect(-L / 2 + 1.4, -R - 1.9, L, 2 * R, R);
  ctx.fill();
  ctx.fillStyle = LOG_FILL;
  ctx.beginPath();
  ctx.roundRect(-L / 2, -R, L, 2 * R, R);
  ctx.fill();
  // Bark: a few cut strips.
  ctx.strokeStyle = 'rgba(29,43,58,0.28)';
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const yy = -R + 1.4 + i * 1.6;
    ctx.moveTo(-L / 2 + 4 + (i % 2) * 3, yy);
    ctx.lineTo(L / 2 - 6 - (i % 3) * 2, yy + 0.2);
  }
  ctx.stroke();
  // Hollow end.
  ctx.fillStyle = LOG_END;
  ctx.beginPath();
  ctx.ellipse(-L / 2 + 1.2, 0, 2.2, R, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(29,43,58,0.75)';
  ctx.beginPath();
  ctx.ellipse(-L / 2 + 1.2, 0, 1.3, R * 0.68, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  const bob = Math.sin(ambientS * 1.9) * 0.15;
  flower(ctx, x - 4, y + R * 0.4 + bob, 2.6, PALETTE.bloom, PALETTE.paper, 0.3);
  flower(ctx, x + 6, y - R * 0.2 - bob, 2.1, PALETTE.bloom, PALETTE.paper, 1.1);
  flower(ctx, x + 13, y + R * 0.9, 1.7, PALETTE.bloom, PALETTE.paper, 2.2);
  flower(ctx, x - 22, y + 3, 1.8, PALETTE.bloom, PALETTE.paper, 0.7);
}

/** Generator decor (§4.1 G7): never pad-shaped, never chipped. */
export function drawDecor(ctx: CanvasRenderingContext2D, decor: readonly Decor[], b: Bounds, ambientS: number): void {
  for (let i = 0; i < decor.length; i++) {
    const d = decor[i]!;
    if (d.y < b.yB - 8 || d.y > b.yT + 8 || d.x < b.xL - 8 || d.x > b.xR + 8) continue;
    const s = Math.min(4, Math.max(1.2, d.size));
    const sway = Math.sin(ambientS * 1.3 + d.phase);
    if (d.kind === 'bud') {
      const x = d.x + sway * 0.5;
      ctx.fillStyle = SHADOW;
      ctx.beginPath();
      ctx.ellipse(x + 0.7, d.y - 0.9, s * 1.5, s * 0.62, d.rot, 0, TAU);
      ctx.fill();
      ctx.fillStyle = PALETTE.pad;
      ctx.beginPath();
      ctx.ellipse(x, d.y, s * 1.5, s * 0.62, d.rot, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = PALETTE.padVein;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.ellipse(x - Math.cos(d.rot) * s * 0.3, d.y - Math.sin(d.rot) * s * 0.3, s * 0.8, s * 0.3, d.rot, 0.3, Math.PI * 1.6);
      ctx.stroke();
    } else if (d.kind === 'petal') {
      const x = d.x + sway * 0.8;
      const rot = d.rot + sway * 0.25;
      ctx.fillStyle = SHADOW;
      ctx.beginPath();
      ctx.ellipse(x + 0.3, d.y - 0.4, s, s * 0.45, rot, 0, TAU);
      ctx.fill();
      ctx.fillStyle = PALETTE.paper;
      ctx.beginPath();
      ctx.ellipse(x, d.y, s, s * 0.45, rot, 0, TAU);
      ctx.fill();
    } else {
      const fx = d.x + sway * 0.6, fy = d.y + 2.2;
      ctx.strokeStyle = PALETTE.waterDeep;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(d.x - 1.5, d.y - 2.5);
      ctx.quadraticCurveTo(d.x + 0.5, d.y, fx, fy);
      ctx.stroke();
      flower(ctx, fx, fy, s, PALETTE.paper, PALETTE.padUnder, d.rot);
    }
  }
}
