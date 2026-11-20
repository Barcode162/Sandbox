/**
 * The sunk card's tell diagram (§7.4) and the pause menu's tell legend, painted with the renderer's own
 * pad code, so the card shows the real culprit pad (its rotation, its cut edge: polish 17) re-drawn live:
 * bubbles rise and the curl rocks at full speed (tells never slow down, §10).
 */
import type { Pad } from '../contracts';
import { buildPadShapes, drawBubble, drawPad, drawPadShadow, type PadShapes } from '../render/draw';
import { PALETTE } from '../render/palette';
import { bubbleAt, createPadLook, curlRock, padBob, type Bubble, type PadLook } from '../render/pose';

const TAU = Math.PI * 2;
const FONT = '800 13px ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif';

interface Slot {
  pad: Pad;
  shapes: PadShapes;
}

const look: PadLook = createPadLook();
const bub: Bubble = { angle: 0, dist: 0, scale: 0, pop: 0 };

/** A pad moved to the origin (diagrams draw in their own frame). */
function atOrigin(p: Pad): Slot {
  const pad: Pad = { ...p, x: 0, y: 0 };
  return { pad, shapes: buildPadShapes(pad) };
}

export function syntheticPad(kind: Pad['kind'], id: number, rot: number): Pad {
  return { id, layer: 0, index: 0, x: 0, y: 0, r: 10, kind, rot, phase: 1.3 + id };
}

function sizeCanvas(c: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(cssW * dpr), H = Math.round(cssH * dpr);
  if (c.width !== W || c.height !== H) {
    c.width = W;
    c.height = H;
    c.style.aspectRatio = `${cssW} / ${cssH}`;
  }
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Draw one pad centred at (cx, cy) screen px with radius R px, live. Returns px per wu. */
function paintPad(ctx: CanvasRenderingContext2D, s: Slot, cx: number, cy: number, R: number, tellS: number, dpr: number): number {
  const k = R / s.pad.r;
  const p = s.pad;
  look.dx = 0;
  look.scale = padBob(p, tellS * 0.5);
  look.rock = p.kind === 'curl' ? curlRock(p, tellS) : 0;
  look.height = p.kind === 'soggy' ? 0 : 0.45 * p.r;
  look.tilt = 0;
  look.flip = 1;
  look.sink = 0;
  look.under = 0;
  ctx.save();
  ctx.setTransform(dpr * k, 0, 0, -dpr * k, dpr * cx, dpr * cy);
  drawPadShadow(ctx, p, s.shapes, look);
  drawPad(ctx, p, s.shapes, look, 1, 1 / k);
  if (p.kind === 'soggy') {
    for (const i of [0, 1] as const) {
      bubbleAt(p, i, tellS, bub);
      drawBubble(ctx, p, 0, p.r * look.scale, bub, 1 / k);
    }
  }
  ctx.restore();
  return k;
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2 + (y1 - y0) * 0.2, (y0 + y1) / 2 - (x1 - x0) * 0.2, x1, y1);
  ctx.stroke();
  const a = Math.atan2(y1 - ((y0 + y1) / 2 - (x1 - x0) * 0.2), x1 - ((x0 + x1) / 2 + (y1 - y0) * 0.2));
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(a - 0.45) * 7, y1 - Math.sin(a - 0.45) * 7);
  ctx.lineTo(x1 - Math.cos(a + 0.45) * 7, y1 - Math.sin(a + 0.45) * 7);
  ctx.closePath();
  ctx.fill();
}

export class TellDiagram {
  readonly canvas: HTMLCanvasElement;
  private culprit: Slot;
  private honest: Slot;
  private callouts: [string, string];

  constructor(culprit: Pad, honest: Pad | null, callouts: [string, string]) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', `Tell diagram: ${callouts.join(' and ')}`);
    this.culprit = atOrigin(culprit);
    this.honest = atOrigin(honest ?? syntheticPad('lily', culprit.id + 1000, culprit.rot + 2));
    this.callouts = callouts;
  }

  paint(tellS: number): void {
    const cssW = Math.max(220, Math.min(420, this.canvas.clientWidth || 300));
    const cssH = Math.round(cssW * 0.56);
    const ctx = sizeCanvas(this.canvas, cssW, cssH);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, cssW, cssH);
    // A little pond swatch behind the pads.
    ctx.fillStyle = PALETTE.waterA;
    ctx.beginPath();
    ctx.roundRect(0, 0, cssW, cssH, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.waterB;
    for (let y = 3; y < cssH; y += 5) for (let x = 3 + ((y / 5) % 2) * 2.5; x < cssW; x += 5) ctx.fillRect(x, y, 1.6, 1.6);
    const R = Math.min(cssH * 0.27, cssW * 0.15);
    const hx = cssW * 0.24, cx = cssW * 0.64, cy = cssH * 0.5;
    paintPad(ctx, this.honest, hx, cy, R, tellS, dpr);
    paintPad(ctx, this.culprit, cx, cy, R, tellS, dpr);

    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.paper;
    ctx.textAlign = 'center';
    ctx.fillText('honest', hx, cy + R + 14 > cssH - 8 ? cssH - 8 : cy + R + 14);
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 2;
    const [a, b] = this.callouts;
    const p = this.culprit.pad;
    const lx = cssW - 6;
    ctx.textAlign = 'right';
    // Callout 1 (bottom): "no shadow" points at where a shadow would be; "curled edge" at the flap.
    const ang1 = p.kind === 'curl' ? p.rot + look.rock : -0.9;
    const t1x = cx + Math.cos(ang1) * R * (p.kind === 'curl' ? 0.7 : 1.15);
    const t1y = cy - Math.sin(ang1) * R * (p.kind === 'curl' ? 0.7 : 1.15);
    ctx.fillText(a, lx, cssH - 12);
    arrow(ctx, lx - ctx.measureText(a).width * 0.5, cssH - 22, t1x, t1y + 4);
    // Callout 2 (top): "bubbles" at a live bubble; "rocks" with a rocking arc over the pad.
    ctx.fillText(b, lx, 12);
    if (p.kind === 'soggy') {
      // Point at whichever bubble is up right now (one always is, polish 4).
      bubbleAt(p, 0, tellS, bub);
      if (bub.scale <= 0) bubbleAt(p, 1, tellS, bub);
      const d = bub.dist * R + 4;
      arrow(ctx, lx - ctx.measureText(b).width * 0.5, 22, cx + Math.cos(bub.angle) * d, cy - Math.sin(bub.angle) * d);
    } else {
      const r2 = R * 1.18;
      ctx.beginPath();
      ctx.arc(cx, cy, r2, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55);
      ctx.stroke();
      for (const s of [-1, 1]) {
        const e = -Math.PI / 2 + 0.55 * s;
        const ex = cx + Math.cos(e) * r2, ey = cy + Math.sin(e) * r2;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 6 * s, ey - 3);
        ctx.lineTo(ex - 2 * s, ey + 5);
        ctx.closePath();
        ctx.fill();
      }
      arrow(ctx, lx - ctx.measureText(b).width * 0.5, 22, cx + R * 0.5, cy - r2 + 2);
    }
  }
}

/** Three live pads for the pause menu's legend. */
export class TellLegend {
  readonly canvases: HTMLCanvasElement[];
  private slots: Slot[];

  constructor() {
    const kinds: Pad['kind'][] = ['lily', 'soggy', 'curl'];
    this.slots = kinds.map((k, i) => atOrigin(syntheticPad(k, 9100 + i, 0.9 + i * 1.7)));
    this.canvases = kinds.map(() => document.createElement('canvas'));
  }

  paint(tellS: number): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (let i = 0; i < 3; i++) {
      const c = this.canvases[i]!;
      const ctx = sizeCanvas(c, 72, 72);
      ctx.clearRect(0, 0, 72, 72);
      ctx.fillStyle = PALETTE.waterA;
      ctx.beginPath();
      ctx.arc(36, 36, 36, 0, TAU);
      ctx.fill();
      paintPad(ctx, this.slots[i]!, 34, 35, 22, tellS, dpr);
    }
  }
}
