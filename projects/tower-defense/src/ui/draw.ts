// Shared canvas primitives for the garden, HUD, sidebar and screens (§4 Look): easing, paper plates with
// hard (+3,+4) shadows, torn edges, fixed-advance digits, wrapped text, hotkey badges and vector glyphs.
import type { Rect } from '../contracts/types';
import { DIGIT_ADVANCE_EM, FONT_DISPLAY, FONT_UI, P, SHADOW_OFFSET } from '../data/palette';
import { MOTION } from '../data/feel';

export type Ctx = CanvasRenderingContext2D;

// ───────── easing (§4 Motion) ─────────
export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
export const outCubic = (t: number): number => 1 - (1 - clamp01(t)) ** 3;
export const inQuad = (t: number): number => clamp01(t) ** 2;
export const inOutSine = (t: number): number => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
export function backOut(t: number): number {
  const c1 = MOTION.backOutS, c3 = c1 + 1, u = clamp01(t) - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
}
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Render-only seeded RNG (mulberry32) — never shared with the sim. */
export function renderRng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────── fonts (§4 Type) ─────────
export const uiFont = (size: number, weight = 600): string => `${weight} ${size}px ${FONT_UI}`;
export const displayFont = (size: number): string => `italic 400 ${size}px ${FONT_DISPLAY}`;

export function fmt(n: number): string {
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? `−${s}` : s;
}

/** Width of `text` on the fixed digit advance (§4, §16.1): digits 0.62 em, separators 0.32 em. */
export function digitsWidth(text: string, size: number): number {
  let w = 0;
  for (const ch of text) w += (ch === ',' || ch === '.' ? 0.32 : DIGIT_ADVANCE_EM) * size;
  return w;
}

/** Draw text with every glyph centred in a fixed cell, so counters never jitter. Returns the width. */
export function drawDigits(c: Ctx, text: string, x: number, y: number, size: number, align: 'left' | 'right' | 'center' = 'left'): number {
  const w = digitsWidth(text, size);
  let cx = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  c.textAlign = 'center';
  for (const ch of text) {
    const adv = (ch === ',' || ch === '.' ? 0.32 : DIGIT_ADVANCE_EM) * size;
    c.fillText(ch, cx + adv / 2, y);
    cx += adv;
  }
  c.textAlign = 'left';
  return w;
}

/** Greedy word wrap to `maxW` at the current font. */
export function wrapText(c: Ctx, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (line && c.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

// ───────── shapes ─────────
export function roundRectPath(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

/** A paper plate: hard shadow duplicate (+3,+4, no blur), fill, optional 1-px crease outline (§4 Light). */
export function plate(c: Ctx, r: Rect, radius: number, fill: string, opts: { shadow?: boolean; stroke?: string | null; lift?: number } = {}): void {
  const lift = opts.lift ?? 0;
  if (opts.shadow !== false) {
    c.fillStyle = P.shadow;
    roundRectPath(c, r.x + SHADOW_OFFSET.x, r.y + SHADOW_OFFSET.y, r.w, r.h, radius);
    c.fill();
  }
  roundRectPath(c, r.x, r.y - lift, r.w, r.h, radius);
  c.fillStyle = fill;
  c.fill();
  const stroke = opts.stroke === undefined ? P.crease : opts.stroke;
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
}

/** Torn-paper rectangle path: every edge zig-zags by ±amp with a seeded jitter (§9 sidebar, §10.7 card). */
export function tornRectPath(c: Ctx, x: number, y: number, w: number, h: number, seed: number, amp = 3, step = 9, edges = { t: true, r: true, b: true, l: true }): void {
  const rnd = renderRng(seed);
  const j = (on: boolean): number => (on ? (rnd() - 0.5) * 2 * amp : 0);
  c.beginPath();
  c.moveTo(x, y);
  for (let px = x + step; px < x + w; px += step) c.lineTo(px, y + j(edges.t));
  c.lineTo(x + w, y);
  for (let py = y + step; py < y + h; py += step) c.lineTo(x + w + j(edges.r), py);
  c.lineTo(x + w, y + h);
  for (let px = x + w - step; px > x; px -= step) c.lineTo(px, y + h + j(edges.b));
  c.lineTo(x, y + h);
  for (let py = y + h - step; py > y; py -= step) c.lineTo(x + j(edges.l), py);
  c.closePath();
}

/** Torn paper card with its hard shadow and a crease highlight along the top. */
export function tornCard(c: Ctx, r: Rect, seed: number, fill: string = P.paper): void {
  c.fillStyle = P.shadow;
  tornRectPath(c, r.x + SHADOW_OFFSET.x, r.y + SHADOW_OFFSET.y, r.w, r.h, seed);
  c.fill();
  c.fillStyle = fill;
  tornRectPath(c, r.x, r.y, r.w, r.h, seed);
  c.fill();
  c.strokeStyle = P.crease;
  c.lineWidth = 1;
  c.stroke();
  c.strokeStyle = P.foldWhite;
  c.beginPath();
  c.moveTo(r.x + 8, r.y + 3);
  c.lineTo(r.x + r.w - 8, r.y + 3);
  c.stroke();
}

/** 20×20 hotkey badge (§13): ink square with the key in fold-white. */
export function badge(c: Ctx, x: number, y: number, key: string, alpha = 1): void {
  const w = key.length > 1 ? 12 + key.length * 7 : 20;
  c.globalAlpha *= alpha;
  roundRectPath(c, x, y, w, 20, 4);
  c.fillStyle = P.ink;
  c.fill();
  c.fillStyle = P.foldWhite;
  c.font = uiFont(12);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(key, x + w / 2, y + 10.5);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.globalAlpha /= alpha;
}

export function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

// ───────── vector glyphs (no reliance on font coverage for ▶ ✕ ✓ ◀) ─────────
export function glyphPlay(c: Ctx, x: number, y: number, s: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x, y - s / 2);
  c.lineTo(x + s * 0.86, y);
  c.lineTo(x, y + s / 2);
  c.closePath();
  c.fill();
}
export function glyphArrow(c: Ctx, x: number, y: number, s: number, dir: -1 | 1, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x + dir * s * 0.43, y);
  c.lineTo(x - dir * s * 0.43, y - s / 2);
  c.lineTo(x - dir * s * 0.43, y + s / 2);
  c.closePath();
  c.fill();
}
export function glyphCross(c: Ctx, x: number, y: number, s: number, color: string, width = 2): void {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - s / 2, y - s / 2);
  c.lineTo(x + s / 2, y + s / 2);
  c.moveTo(x + s / 2, y - s / 2);
  c.lineTo(x - s / 2, y + s / 2);
  c.stroke();
}
export function glyphCheck(c: Ctx, x: number, y: number, s: number, color: string): void {
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - s / 2, y);
  c.lineTo(x - s / 8, y + s * 0.38);
  c.lineTo(x + s / 2, y - s * 0.4);
  c.stroke();
}
export function glyphLock(c: Ctx, x: number, y: number, color: string): void {
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y - 3, 4, Math.PI, 0);
  c.stroke();
  c.fillRect(x - 6, y - 3, 12, 9);
}
/** Five-point paper star (§10.2). */
export function starPath(c: Ctx, x: number, y: number, r: number, inner = 0.45): void {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    if (i) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}

/** Damage-type icons for the Fold card stats (§10.4): Cut blade / Crush stone / Wash drop / Glare eye. */
export function typeIcon(c: Ctx, type: 'cut' | 'crush' | 'wash' | 'glare', x: number, y: number, color: string = P.ink): void {
  c.fillStyle = color;
  c.strokeStyle = color;
  c.lineWidth = 1.5;
  c.beginPath();
  if (type === 'cut') { c.moveTo(x - 5, y + 5); c.lineTo(x + 5, y - 5); c.lineTo(x + 2, y + 1); c.closePath(); c.fill(); }
  else if (type === 'crush') { c.moveTo(x - 5, y + 3); c.lineTo(x - 3, y - 3); c.lineTo(x + 3, y - 4); c.lineTo(x + 5, y + 2); c.lineTo(x, y + 5); c.closePath(); c.fill(); }
  else if (type === 'wash') { c.moveTo(x, y - 6); c.quadraticCurveTo(x + 5, y + 1, x, y + 5); c.quadraticCurveTo(x - 5, y + 1, x, y - 6); c.fill(); }
  else { c.ellipse(x, y, 6, 3.5, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fill(); }
}

/** Offscreen canvas factory: DOM canvas, OffscreenCanvas, or null (Node unit tests draw directly). */
export function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas | null {
  try {
    if (typeof document !== 'undefined') {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      return cv;
    }
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  } catch { /* fall through */ }
  return null;
}
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export function ctxOf(cv: AnyCanvas): Ctx | null {
  return (cv.getContext('2d') as Ctx | null) ?? null;
}
