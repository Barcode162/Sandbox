/**
 * Cut-paper drawing primitives (§5.2). All functions draw in WORLD units on a context whose transform
 * maps world → device with y up (see renderer `setWorld`). `px` = world units per CSS pixel, for the
 * few things specified in pixels (1 px registration offset, 1 px ink rim, 2 px chip shadow).
 * Shared by the renderer and the UI tell diagram/legend so the card shows the exact pad the player saw.
 */
import type { Pad, Slot } from '../contracts';
import { FROG_DARK_SINK, FROG_SINK, GATOR_RISE, PAD_FILL, PAD_LOW_FILL, PAD_UNDER, PAD_VEIN, SHADOW, SINK_RAMP } from './color';
import { rand3 } from './noise';
import { PALETTE } from './palette';
import type { Bubble, FrogPose, PadLook } from './pose';
import { EASE_POP, clamp01 } from './ease';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
/** §5.2 pad notch: 28° V. */
const NOTCH = 14 * DEG;
/** Curl fold: the folded segment spans 30% of the rim (±54°). */
const FOLD = 54 * DEG;
const FOLD_D = Math.cos(FOLD);

// ───────────── pad shapes (unit radius, local +x = pad.rot) ─────────────

export interface PadShapes {
  body: Path2D;
  /** Curl only: the folded flap (pale underside showing) and the full disc for the flipped underside. */
  flap: Path2D | null;
  full: Path2D;
  veins: Path2D;
}

const cutRadius = (id: number, i: number) => 1 + 0.02 * (rand3(id, i, 77) * 2 - 1);

/** 14 scissor-cut vertices (±2% radius), §5.2. */
function rimPoints(id: number): { a: number; r: number }[] {
  const off = rand3(id, 3, 5) * TAU;
  const pts: { a: number; r: number }[] = [];
  for (let i = 0; i < 14; i++) pts.push({ a: (off + (i * TAU) / 14) % TAU, r: cutRadius(id, i) });
  return pts.sort((p, q) => p.a - q.a);
}

export function buildPadShapes(pad: Pad): PadShapes {
  const rim = rimPoints(pad.id);
  const full = new Path2D();
  rim.forEach((p, i) => (i ? full.lineTo(Math.cos(p.a) * p.r, Math.sin(p.a) * p.r) : full.moveTo(Math.cos(p.a) * p.r, Math.sin(p.a) * p.r)));
  full.closePath();

  let body = full;
  let flap: Path2D | null = null;
  if (pad.kind === 'lily' || pad.kind === 'bank') {
    // V-notch: apex near the centre, edges at ±14°.
    body = new Path2D();
    body.moveTo(0.07, 0);
    body.lineTo(Math.cos(NOTCH), Math.sin(NOTCH));
    for (const p of rim) if (p.a > NOTCH && p.a < TAU - NOTCH) body.lineTo(Math.cos(p.a) * p.r, Math.sin(p.a) * p.r);
    body.lineTo(Math.cos(-NOTCH), Math.sin(-NOTCH));
    body.closePath();
  } else if (pad.kind === 'curl') {
    // Chord cut at the fold; the cut-off segment is mirrored over the chord as the pale flap.
    body = new Path2D();
    body.moveTo(FOLD_D, Math.sin(FOLD));
    for (const p of rim) if (p.a > FOLD && p.a < TAU - FOLD) body.lineTo(Math.cos(p.a) * p.r, Math.sin(p.a) * p.r);
    body.lineTo(FOLD_D, -Math.sin(FOLD));
    body.closePath();
    flap = new Path2D();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = -FOLD + (2 * FOLD * i) / n;
      const x = 2 * FOLD_D - Math.cos(a) * 0.985, y = Math.sin(a) * 0.985;
      if (i === 0) flap.moveTo(x, y);
      else flap.lineTo(x, y);
    }
    flap.closePath();
  }

  const veins = new Path2D();
  const start = pad.kind === 'curl' ? 1 : 0;
  for (let i = 0; i < 4; i++) {
    const a = (72 + 72 * i) * DEG;
    const len = 0.78 - 0.06 * rand3(pad.id, i, 9);
    veins.moveTo(0.08 * Math.cos(a), 0.08 * Math.sin(a));
    veins.lineTo(len * Math.cos(a), len * Math.sin(a));
  }
  if (start) {
    // Curl veins stop at the fold crease.
    veins.moveTo(0.08, 0);
    veins.lineTo(FOLD_D - 0.04, 0);
  }
  return { body, flap, full, veins };
}

/**
 * One pad (§4.2, §5.2). `level` indexes the light ramp (0 lit … 4 dim).
 * Lily: notch, veins, hard shadow. Soggy: no shadow, no notch, 6% darker, 1 px ink rim. Curl: folded flap
 * with its own shadow; rocks; tilts and flips to its underside.
 */
export function drawPadShadow(ctx: CanvasRenderingContext2D, pad: Pad, shapes: PadShapes, look: PadLook): void {
  const fade = 1 - look.under;
  if (look.height <= 0.01 || fade <= 0) return;
  const R = pad.r * look.scale;
  const across = 1 - (1 - Math.cos(25 * DEG)) * look.tilt;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(pad.x + look.dx + 0.35 * look.height, pad.y - 0.45 * look.height);
  ctx.rotate(pad.rot + look.rock);
  ctx.scale(R * across * look.flip, R);
  ctx.fillStyle = SHADOW;
  ctx.fill(look.flip < 0 ? shapes.full : shapes.body);
  ctx.restore();
}

/** Pad surface (draw every pad's shadow first with drawPadShadow, so shadows never fall on neighbours). */
export function drawPad(ctx: CanvasRenderingContext2D, pad: Pad, shapes: PadShapes, look: PadLook, level: number, px: number): void {
  const x = pad.x + look.dx, y = pad.y;
  const R = pad.r * look.scale;
  const ang = pad.rot + look.rock;
  const across = 1 - (1 - Math.cos(25 * DEG)) * look.tilt;
  const sxs = R * across * look.flip;
  const flipped = look.flip < 0;
  const fade = 1 - look.under;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(sxs, R);
  if (pad.kind === 'soggy') {
    ctx.fillStyle = look.under > 0 ? SINK_RAMP[Math.round(look.under * 10)]! : PAD_LOW_FILL[level]!;
    if (look.under > 0.6) ctx.globalAlpha = 1 - (look.under - 0.6) * 1.6;
    ctx.fill(shapes.body);
    // The only edge it has: a 1 px ink rim (§4.2).
    ctx.lineWidth = px / R;
    ctx.strokeStyle = 'rgba(29,43,58,0.55)';
    ctx.stroke(shapes.body);
    ctx.globalAlpha = 0.45 * fade;
    ctx.lineWidth = 0.5 / R;
    ctx.strokeStyle = PAD_VEIN[level]!;
    ctx.stroke(shapes.veins);
    ctx.restore();
    return;
  }
  if (flipped) {
    ctx.fillStyle = PAD_UNDER[level]!;
    ctx.fill(shapes.full);
    ctx.lineWidth = 0.9 / R;
    ctx.strokeStyle = PAD_VEIN[level]!;
    ctx.globalAlpha = 0.5;
    ctx.stroke(shapes.veins);
    ctx.restore();
    return;
  }
  ctx.fillStyle = PAD_FILL[level]!;
  ctx.fill(shapes.body);
  ctx.restore();

  // Veins, 1 px off-register (§5.2 print).
  ctx.save();
  ctx.translate(x + px, y - px);
  ctx.rotate(ang);
  ctx.scale(sxs, R);
  ctx.lineWidth = 0.6 / R;
  ctx.lineCap = 'round';
  ctx.strokeStyle = PAD_VEIN[level]!;
  ctx.stroke(shapes.veins);
  ctx.restore();

  if (shapes.flap) {
    // The lifted flap casts its own small shadow onto the pad, then shows its pale underside.
    const fh = 1.4 + 2.2 * look.tilt;
    ctx.save();
    ctx.translate(x + 0.35 * fh, y - 0.45 * fh);
    ctx.rotate(ang);
    ctx.scale(sxs, R);
    ctx.fillStyle = SHADOW;
    ctx.fill(shapes.flap);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(sxs, R);
    ctx.fillStyle = PAD_UNDER[level]!;
    ctx.fill(shapes.flap);
    ctx.lineWidth = 0.55 / R;
    ctx.strokeStyle = PAD_VEIN[level]!;
    ctx.beginPath();
    ctx.moveTo(FOLD_D, Math.sin(FOLD) * 0.98);
    ctx.lineTo(FOLD_D, -Math.sin(FOLD) * 0.98);
    ctx.stroke();
    ctx.restore();
  }
}

/** Soggy bubbles (§4.2): paper discs r 1.2 wu at the rim, with a pop ring as each one breaks. */
export function drawBubble(ctx: CanvasRenderingContext2D, pad: Pad, dx: number, R: number, b: Bubble, px: number): void {
  const bx = pad.x + dx + Math.cos(b.angle) * b.dist * R;
  const by = pad.y + Math.sin(b.angle) * b.dist * R;
  if (b.scale > 0) {
    const r = 1.2 * b.scale;
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(29,43,58,0.35)';
    ctx.beginPath();
    ctx.arc(bx - r * 0.25, by + r * 0.3, r * 0.32, 0, TAU);
    ctx.fill();
  } else if (b.pop > 0) {
    ctx.strokeStyle = PALETTE.paper;
    ctx.globalAlpha = 1 - b.pop;
    ctx.lineWidth = Math.max(px, 0.35);
    ctx.beginPath();
    ctx.arc(bx, by, 1.2 + 1.4 * b.pop, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ───────────── chips (§5.3) ─────────────

export type ChipGlyph = Slot | 'X';

const ARROW = (() => {
  if (typeof Path2D === 'undefined') return null;
  const p = new Path2D();
  p.moveTo(-0.52, -0.13);
  p.lineTo(0.04, -0.13);
  p.lineTo(0.04, -0.42);
  p.lineTo(0.56, 0);
  p.lineTo(0.04, 0.42);
  p.lineTo(0.04, 0.13);
  p.lineTo(-0.52, 0.13);
  p.closePath();
  return p;
})();
const CROSS = (() => {
  if (typeof Path2D === 'undefined') return null;
  const p = new Path2D();
  const w = 0.13, l = 0.5;
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    const c = Math.cos(a), s = Math.sin(a);
    const pt = (u: number, v: number): [number, number] => [u * c - v * s, u * s + v * c];
    p.moveTo(...pt(-l, -w));
    p.lineTo(...pt(l, -w));
    p.lineTo(...pt(l, w));
    p.lineTo(...pt(-l, w));
    p.closePath();
  }
  return p;
})();
const GLYPH_ROT: Record<Slot, number> = { L: Math.PI, F: Math.PI / 2, R: 0 };

/**
 * Ink disc with a paper glyph and its own 2 px shadow. `inverted` = paper disc, ink glyph (polish 9).
 * `glyphPx` caps the glyph at the §5.3 chip-glyph size (16/20 px).
 */
export function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, glyph: ChipGlyph, inverted: boolean, scale: number, px: number, glyphPx: number): void {
  if (scale <= 0.001) return;
  const r = R * scale;
  ctx.fillStyle = SHADOW;
  ctx.beginPath();
  ctx.arc(x + 1.5 * px, y - 2 * px, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = inverted ? PALETTE.paper : PALETTE.ink;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  const g = Math.min(r * 1.05, glyphPx * px * scale);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(glyph === 'X' ? 0 : GLYPH_ROT[glyph]);
  ctx.scale(g, g);
  ctx.fillStyle = inverted ? PALETTE.ink : PALETTE.paper;
  ctx.fill(glyph === 'X' ? CROSS! : ARROW!);
  ctx.restore();
}

// ───────────── frog (§5.2, original) ─────────────

const FROG_BODY = (() => {
  if (typeof Path2D === 'undefined') return null;
  const p = new Path2D();
  // Top-down teardrop, 7.5 long × 6 wide: a narrower snout (+x), broad haunches.
  p.moveTo(4.1, 0);
  p.bezierCurveTo(4.1, 1.9, 2.4, 2.9, 0.3, 3.0);
  p.bezierCurveTo(-2.0, 3.05, -3.4, 1.9, -3.4, 0);
  p.bezierCurveTo(-3.4, -1.9, -2.0, -3.05, 0.3, -3.0);
  p.bezierCurveTo(2.4, -2.9, 4.1, -1.9, 4.1, 0);
  p.closePath();
  p.moveTo(2.4 + 1.3, 2.0);
  p.arc(2.4, 2.0, 1.3, 0, TAU);
  p.moveTo(2.4 + 1.3, -2.0);
  p.arc(2.4, -2.0, 1.3, 0, TAU);
  return p;
})();

/** Leg polyline points, folded (0) → open V (1). Hip, knee, foot for the +y side (mirrored for −y). */
const LEG_FOLD = [-2.2, 1.9, -3.6, 3.2, -1.2, 3.7];
const LEG_OPEN = [-2.6, 1.5, -5.2, 3.4, -7.8, 4.6];
const legPts = new Float32Array(6);

function legPath(ctx: CanvasRenderingContext2D, legs: number, side: 1 | -1): void {
  for (let i = 0; i < 6; i++) legPts[i] = LEG_FOLD[i]! + (LEG_OPEN[i]! - LEG_FOLD[i]!) * legs;
  ctx.moveTo(legPts[0]!, legPts[1]! * side);
  ctx.lineTo(legPts[2]!, legPts[3]! * side);
  ctx.lineTo(legPts[4]!, legPts[5]! * side);
}

export function drawFrog(ctx: CanvasRenderingContext2D, p: FrogPose, alpha: number): void {
  if (alpha <= 0) return;
  const sink = Math.round(clamp01(p.under) * 10);
  const sxl = p.scale * p.along, syl = p.scale * p.across;
  // Shadow (silhouette incl. legs).
  ctx.save();
  ctx.globalAlpha = alpha * (1 - p.under) * p.shadowA;
  ctx.translate(p.x + 0.35 * p.shadowH, p.y - 0.45 * p.shadowH);
  ctx.rotate(p.facing);
  ctx.scale(sxl, syl);
  ctx.fillStyle = PALETTE.ink;
  ctx.fill(FROG_BODY!);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  legPath(ctx, p.legs, 1);
  legPath(ctx, p.legs, -1);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.facing);
  ctx.scale(sxl, syl);
  const dark = FROG_DARK_SINK[sink]!;
  // Hind legs under the body; webbed feet when open.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  legPath(ctx, p.legs, 1);
  legPath(ctx, p.legs, -1);
  ctx.stroke();
  if (p.legs > 0.25) {
    ctx.fillStyle = dark;
    for (const side of [1, -1] as const) {
      const fx = legPts[4]!, fy = legPts[5]! * side;
      ctx.beginPath();
      ctx.moveTo(fx + 0.6, fy);
      ctx.lineTo(fx - 1.1, fy + 1.0 * side);
      ctx.lineTo(fx - 1.2, fy - 0.6 * side);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Front feet.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(1.6, 3.0, 0.9, 0.55, 0.5, 0, TAU);
  ctx.ellipse(1.6, -3.0, 0.9, 0.55, -0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = FROG_SINK[sink]!;
  ctx.fill(FROG_BODY!);
  // Three spots.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(-0.9, 1.05, 0.72, 0, TAU);
  ctx.moveTo(-1.5 + 0.55, -1.0);
  ctx.arc(-1.5, -1.0, 0.55, 0, TAU);
  ctx.moveTo(0.7 + 0.45, -0.35);
  ctx.arc(0.7, -0.35, 0.45, 0, TAU);
  ctx.fill();
  if (p.under < 0.7) {
    // Eyes: paper discs with ink pupils looking at the target (polish 6).
    const la = Math.atan2(p.lookY - p.y, p.lookX - p.x) - p.facing;
    const lx = Math.cos(la) * 0.38, ly = Math.sin(la) * 0.38;
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(2.5, 2.05, 0.92, 0, TAU);
    ctx.moveTo(2.5 + 0.92, -2.05);
    ctx.arc(2.5, -2.05, 0.92, 0, TAU);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(2.5 + lx, 2.05 + ly, 0.5, 0, TAU);
    ctx.moveTo(2.5 + lx + 0.5, -2.05 + ly);
    ctx.arc(2.5 + lx, -2.05 + ly, 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ───────────── gator (§5.2) ─────────────

/** Submerged body: `water-deep` silhouette under the halftone. pts = [x0,y0,x1,y1,…] head-neck first. */
export function drawGatorBody(ctx: CanvasRenderingContext2D, pts: Float32Array, n: number, alpha: number): void {
  if (alpha <= 0 || n < 2) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.waterDeep;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const r = 3.4 - (2.3 * i) / (n - 1);
    const x = pts[i * 2]!, y = pts[i * 2 + 1]!;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  // Tail: a tapered tip beyond the last segment.
  const lx = pts[(n - 1) * 2]!, ly = pts[(n - 1) * 2 + 1]!;
  const ax = lx - pts[(n - 2) * 2]!, ay = ly - pts[(n - 2) * 2 + 1]!;
  const al = Math.hypot(ax, ay) || 1;
  const ux = ax / al, uy = ay / al;
  ctx.moveTo(lx - uy * 1.1, ly + ux * 1.1);
  ctx.lineTo(lx + ux * 6.5, ly + uy * 6.5);
  ctx.lineTo(lx + uy * 1.1, ly - ux * 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Scute dashes breaking the surface every 2 segments (§5.2). */
export function drawScutes(ctx: CanvasRenderingContext2D, pts: Float32Array, n: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.gatorRidge;
  for (let i = 1; i < n - 1; i += 2) {
    const x = pts[i * 2]!, y = pts[i * 2 + 1]!;
    const dx = pts[(i + 1) * 2]! - x, dy = pts[(i + 1) * 2 + 1]! - y;
    const a = Math.atan2(dy, dx);
    const w = 1.0 - i * 0.07;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.roundRect(-0.9, w * 0.55, 1.8, 0.65, 0.3);
    ctx.roundRect(-0.9, -w * 0.55 - 0.65, 1.8, 0.65, 0.3);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export interface HeadLook {
  x: number;
  y: number;
  heading: number;
  /** Full opening angle, radians. */
  jaw: number;
  eyeScale: number;
  /** 0 open … 1 closed eyelids. */
  lid: number;
  /** Where the slit pupils look (world point). */
  lookX: number;
  lookY: number;
  /** 0 under water … 1 fully surfaced. Eyes rise first. */
  surface: number;
  /** Uniform scale (flank jaws are drawn larger to frame a pad). */
  scale: number;
  /** One-frame paper flash on the tooth tips (polish 15). */
  flash: boolean;
}

export function createHeadLook(): HeadLook {
  return { x: 0, y: 0, heading: Math.PI / 2, jaw: 0, eyeScale: 1, lid: 0, lookX: 0, lookY: 0, surface: 1, scale: 1, flash: false };
}

const SNOUT = 10.2;

function jawHalf(ctx: CanvasRenderingContext2D, side: 1 | -1): void {
  ctx.moveTo(-0.6, 0);
  ctx.lineTo(SNOUT - 0.9, 0);
  ctx.quadraticCurveTo(SNOUT + 0.3, 0, SNOUT, 1.05 * side);
  ctx.quadraticCurveTo(SNOUT - 0.4, 1.9 * side, 7.5, 2.0 * side);
  ctx.lineTo(1.6, 3.1 * side);
  ctx.lineTo(-0.6, 3.25 * side);
  ctx.closePath();
}

function skull(ctx: CanvasRenderingContext2D): void {
  ctx.ellipse(-2.0, 0, 3.4, 3.7, 0, 0, TAU);
}

/** The head above water: skull, two jaw halves hinged at x = 0, jaw wedge with 5 teeth a side, eyes, nostrils. */
export function drawGatorHead(ctx: CanvasRenderingContext2D, h: HeadLook): void {
  const s = h.surface;
  if (s <= 0.001) return;
  const half = h.jaw / 2;
  const eyesUp = EASE_POP(clamp01(s / 0.55));
  const headUp = clamp01((s - 0.35) / 0.65);
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.heading);
  ctx.scale(h.scale, h.scale);

  if (headUp > 0) {
    const col = GATOR_RISE[Math.round(headUp * 10)]!;
    // Shadow of the whole head, height 1.6 wu.
    ctx.save();
    ctx.translate((0.35 * 1.6 * headUp) / h.scale, (-0.45 * 1.6 * headUp) / h.scale);
    ctx.rotate(0);
    ctx.fillStyle = SHADOW;
    ctx.globalAlpha = headUp;
    ctx.beginPath();
    skull(ctx);
    ctx.fill();
    for (const side of [1, -1] as const) {
      ctx.save();
      ctx.rotate(half * side);
      ctx.beginPath();
      jawHalf(ctx, side);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    ctx.globalAlpha = headUp;
    if (half > 1 * DEG) {
      // Mouth interior wedge.
      ctx.fillStyle = PALETTE.jaw;
      ctx.beginPath();
      ctx.moveTo(-0.6, 0);
      ctx.lineTo(Math.cos(half) * SNOUT, Math.sin(half) * SNOUT);
      ctx.lineTo(Math.cos(-half) * SNOUT, Math.sin(-half) * SNOUT);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = col;
    ctx.beginPath();
    skull(ctx);
    ctx.fill();
    for (const side of [1, -1] as const) {
      ctx.save();
      ctx.rotate(half * side);
      if (half > 2 * DEG) {
        // 5 paper teeth along the inner edge, pointing into the mouth.
        ctx.fillStyle = PALETTE.paper;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const tx = 2.0 + i * 1.65;
          ctx.moveTo(tx - 0.5, 0.05 * side);
          ctx.lineTo(tx, -0.95 * side);
          ctx.lineTo(tx + 0.5, 0.05 * side);
        }
        ctx.fill();
      }
      ctx.fillStyle = col;
      ctx.beginPath();
      jawHalf(ctx, side);
      ctx.fill();
      // Nostril bump.
      ctx.fillStyle = PALETTE.gatorRidge;
      ctx.beginPath();
      ctx.arc(SNOUT - 1.1, 0.75 * side, 0.55, 0, TAU);
      ctx.fill();
      if (h.flash) {
        // Tooth-tip flash: a paper 4-point spark at the jaw tip.
        ctx.fillStyle = PALETTE.paper;
        star(ctx, SNOUT + 0.2, 0.6 * side, 2.4, 0.5);
      }
      ctx.restore();
    }
  }

  // Eye domes (rise first). Scale 1 + 0.5τ is in eyeScale.
  ctx.globalAlpha = 1;
  const es = h.eyeScale * eyesUp;
  if (es > 0.01) {
    const la = Math.atan2(h.lookY - h.y, h.lookX - h.x) - h.heading;
    const px = Math.cos(la) * 0.32 * es, py = Math.sin(la) * 0.32 * es;
    for (const side of [1, -1] as const) {
      const ex = -2.1, ey = 2.55 * side;
      ctx.fillStyle = SHADOW;
      ctx.beginPath();
      ctx.arc(ex + 0.5, ey - 0.6, 1.65 * es, 0, TAU);
      ctx.fill();
      ctx.fillStyle = headUp > 0.5 ? PALETTE.gator : GATOR_RISE[6]!;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.65 * es, 0, TAU);
      ctx.fill();
      ctx.fillStyle = PALETTE.gatorEye;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.12 * es, 0, TAU);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.ellipse(ex + px, ey + py, 0.24 * es, 0.92 * es, 0, 0, TAU);
      ctx.fill();
      if (h.lid > 0.01) {
        // Eyelid closes from the front edge (blink 80 ms, half-closed when sated).
        ctx.fillStyle = PALETTE.gator;
        ctx.beginPath();
        ctx.ellipse(ex + 1.12 * es * (1 - h.lid), ey, 1.2 * es * h.lid + 0.01, 1.22 * es, 0, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/** A 4-point sparkle (paper), used for sparkles and the tooth flash. */
export function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, w: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.quadraticCurveTo(x + w * 0.3, y + w * 0.3, x, y + r);
  ctx.quadraticCurveTo(x - w * 0.3, y + w * 0.3, x - r, y);
  ctx.quadraticCurveTo(x - w * 0.3, y - w * 0.3, x, y - r);
  ctx.quadraticCurveTo(x + w * 0.3, y - w * 0.3, x + r, y);
  ctx.fill();
}
