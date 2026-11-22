// Blot rendering (§6 shapes, pips, Pale, squash, hit flash) + pop responses (§11). FROZEN signatures.
// Shape is the colourblind signal: disc · 3–6 lobes · comet · hexagon · scribble · maw (§6, §15).
import type { BlotKind, DrawPass, Fx, RenderFrame, SimEvent, SimState, WorldLayer } from '../contracts/types';
import { BLOTS, LOBE, PALE } from '../data/blots';
import { BOSS_FEEL, HIT, MOTION, POP } from '../data/feel';
import { burst, type FleckStyle } from './fx';
import { P, SHADOW_OFFSET, type PaletteToken } from '../data/palette';
import { pointAt, tangentAt, type MutVec } from '../sim/path';
import { ctxOf, makeCanvas } from '../ui/draw';

export interface BlotDrawOpts { pale: boolean; colourblind: boolean; scale?: number; phase?: number; alpha?: number }

/** Full paint options used by the world layer (the exported drawBlotShape fills in the defaults). */
interface Paint {
  pale: boolean;
  cb: boolean;
  scale: number;
  phase: number;
  alpha: number;
  /** Travel direction (radians): comet and maw face it. */
  angle: number;
  /** Knot loops = ⌈hp/3⌉; boss maw widens below 10 %. */
  hp: number;
  hpFrac: number;
  flash: boolean;
}

const SAMPLES = 24;
const COS = new Float64Array(SAMPLES);
const SIN = new Float64Array(SAMPLES);
for (let i = 0; i < SAMPLES; i++) { COS[i] = Math.cos((i / SAMPLES) * Math.PI * 2); SIN[i] = Math.sin((i / SAMPLES) * Math.PI * 2); }
const PX = new Float64Array(SAMPLES);
const PY = new Float64Array(SAMPLES);

const color = (kind: BlotKind): string => P[BLOTS[kind].color as PaletteToken];
/** Per-kind phase offset so neighbouring kinds do not wobble in lockstep. */
const PHASE_OFFSET: Readonly<Record<BlotKind, number>> = { dot: 0, drop: 0.7, splat: 1.9, splash: 2.6, blotch: 3.8, streak: 0, wax: 0, knot: 0.4, inkmaw: 5.1 };

/** radius(θ) = R(1 + 0.14 sin(nθ + φ)), traced through 24 samples with quadratic midpoints (smooth lobes). */
function traceLobed(c: CanvasRenderingContext2D, x: number, y: number, R: number, n: number, phi: number, amp: number): void {
  for (let i = 0; i < SAMPLES; i++) {
    const th = (i / SAMPLES) * Math.PI * 2;
    const r = R * (1 + amp * Math.sin(n * th + phi));
    PX[i] = x + COS[i] * r; PY[i] = y + SIN[i] * r;
  }
  c.moveTo((PX[SAMPLES - 1] + PX[0]) / 2, (PY[SAMPLES - 1] + PY[0]) / 2);
  for (let i = 0; i < SAMPLES; i++) {
    const j = (i + 1) % SAMPLES;
    c.quadraticCurveTo(PX[i], PY[i], (PX[i] + PX[j]) / 2, (PY[i] + PY[j]) / 2);
  }
  c.closePath();
}

function traceHex(c: CanvasRenderingContext2D, x: number, y: number, R: number): void {
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    const px = x + Math.cos(a) * R, py = y + Math.sin(a) * R;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath();
}

/** Comet: ellipse 1.8:1 along travel; its tail strokes are drawn separately. */
function traceComet(c: CanvasRenderingContext2D, x: number, y: number, R: number, angle: number): void {
  c.ellipse(x, y, R * 1.2, (R * 1.2) / 1.8, angle, 0, Math.PI * 2);
}

/** The body outline for a kind (no fill/stroke). */
function traceBody(c: CanvasRenderingContext2D, kind: BlotKind, x: number, y: number, R: number, o: Paint): void {
  const d = BLOTS[kind];
  c.beginPath();
  switch (d.shape) {
    case 'disc': case 'scribble': c.arc(x, y, R, 0, Math.PI * 2); break;
    case 'lobed': traceLobed(c, x, y, R, d.lobes, o.phase + PHASE_OFFSET[kind], LOBE.amplitude); break;
    case 'maw': traceLobed(c, x, y, R, d.lobes, o.phase * 0.6 + PHASE_OFFSET[kind], LOBE.amplitude); break;
    case 'comet': traceComet(c, x, y, R, o.angle); break;
    case 'hexagon': traceHex(c, x, y, R); break;
  }
}

function pips(c: CanvasRenderingContext2D, x: number, y: number, R: number, n: number, o: Paint): void {
  if (n <= 0) return;
  const pr = LOBE.pipR * Math.max(0.75, o.scale);
  c.beginPath();
  if (n === 1) { c.moveTo(x + pr, y); c.arc(x, y, pr, 0, Math.PI * 2); }
  else for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
    const px = x + Math.cos(a) * R * LOBE.pipRing, py = y + Math.sin(a) * R * LOBE.pipRing;
    c.moveTo(px + pr, py); c.arc(px, py, pr, 0, Math.PI * 2);
  }
  c.globalAlpha = o.alpha * (o.cb ? 1 : LOBE.pipAlpha);
  c.fillStyle = P.paper;
  c.fill();
  if (o.cb) { c.lineWidth = 1; c.strokeStyle = P.ink; c.globalAlpha = o.alpha; c.stroke(); }
}

/** 45° hatch every 4 px, clipped to the body (Pale is dashed AND hatched, §16.7). */
function hatch(c: CanvasRenderingContext2D, kind: BlotKind, x: number, y: number, R: number, o: Paint): void {
  c.save();
  traceBody(c, kind, x, y, R, o);
  c.clip();
  const ext = R * 1.6;
  c.beginPath();
  for (let k = -ext * 2; k <= ext * 2; k += PALE.hatchSpacing) { c.moveTo(x + k - ext, y + ext); c.lineTo(x + k + ext, y - ext); }
  c.lineWidth = 1;
  c.strokeStyle = color(kind);
  c.globalAlpha = o.alpha * (o.cb ? 1 : 0.6);
  c.stroke();
  c.restore();
}

function details(c: CanvasRenderingContext2D, kind: BlotKind, x: number, y: number, R: number, o: Paint): void {
  const d = BLOTS[kind];
  const a = o.alpha;
  switch (d.shape) {
    case 'comet': {
      // 3 tail strokes trailing behind the head
      const bx = -Math.cos(o.angle), by = -Math.sin(o.angle), nx = -by, ny = bx;
      c.lineCap = 'round';
      c.strokeStyle = color(kind);
      for (let i = -1; i <= 1; i++) {
        const sx = x + bx * R * 0.9 + nx * i * R * 0.38, sy = y + by * R * 0.9 + ny * i * R * 0.38;
        const len = R * (i === 0 ? 1.5 : 1.05);
        c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + bx * len + nx * i * R * 0.25, sy + by * len + ny * i * R * 0.25);
        c.lineWidth = i === 0 ? 2.4 : 1.8;
        c.globalAlpha = a * (o.pale ? 0.45 : 0.85) * (i === 0 ? 1 : 0.7);
        c.stroke();
      }
      break;
    }
    case 'hexagon': {
      // stamped ring + gloss arc, top-left (the sun, §4 Light)
      c.globalAlpha = a * 0.75;
      c.strokeStyle = P.waxGloss;
      c.lineWidth = 1.4;
      c.beginPath(); c.arc(x, y, R * 0.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(x, y, R * 0.3, 0, Math.PI * 2); c.globalAlpha = a * 0.35; c.stroke();
      c.globalAlpha = a * 0.9;
      c.lineWidth = 2;
      c.lineCap = 'round';
      c.beginPath(); c.arc(x, y, R * 0.74, Math.PI * 1.08, Math.PI * 1.42); c.stroke();
      break;
    }
    case 'scribble': {
      // thread loops: ⌈hp/3⌉ (12 hp → 4, the count tells how tough it still is)
      const loops = Math.max(1, Math.ceil(o.hp / 3));
      c.strokeStyle = P.thread;
      c.lineWidth = 1.3;
      c.globalAlpha = a * 0.9;
      const spin = o.phase * 0.35;
      for (let i = 0; i < loops; i++) {
        const t = spin + (i * Math.PI) / loops;
        c.beginPath();
        c.ellipse(x + Math.cos(t * 2.3) * R * 0.08, y + Math.sin(t * 1.7) * R * 0.08, R * 0.72, R * (0.26 + 0.07 * (i % 2)), t, 0, Math.PI * 2);
        c.stroke();
      }
      break;
    }
    case 'maw': {
      // jagged paper maw facing travel, widening 1.2× below 10 %; drips below
      const open = o.hpFrac < 0.1 ? 1.2 : 1;
      const fx = Math.cos(o.angle), fy = Math.sin(o.angle), nx = -fy, ny = fx;
      const cx = x + fx * R * 0.28, cy = y + fy * R * 0.28;
      const half = R * 0.42 * open, h = R * 0.2 * open;
      const teeth = 5;
      c.beginPath();
      for (let i = 0; i <= teeth * 2; i++) {
        const u = -1 + i / teeth, j = i % 2 ? 0.45 : 1;
        const px = cx + nx * u * half + fx * (-h * j * (1 - u * u * 0.6)), py = cy + ny * u * half + fy * (-h * j * (1 - u * u * 0.6));
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      for (let i = teeth * 2; i >= 0; i--) {
        const u = -1 + i / teeth, j = i % 2 ? 0.45 : 1;
        c.lineTo(cx + nx * u * half + fx * (h * j * (1 - u * u * 0.6)), cy + ny * u * half + fy * (h * j * (1 - u * u * 0.6)));
      }
      c.closePath();
      c.globalAlpha = a;
      c.fillStyle = P.paper;
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = P.ink;
      c.stroke();
      // eyes: two paper slits above the maw
      c.fillStyle = P.foldWhite;
      for (let side = -1; side <= 1; side += 2) {
        c.beginPath();
        c.ellipse(x - fx * R * 0.12 + nx * side * R * 0.3, y - fy * R * 0.12 + ny * side * R * 0.3, R * 0.09, R * 0.05, o.angle, 0, Math.PI * 2);
        c.fill();
      }
      // drips
      c.fillStyle = color(kind);
      for (let i = 0; i < 4; i++) {
        const t = (o.phase * 0.25 + i * 0.29) % 1;
        const dx = x + (i - 1.5) * R * 0.38, dy = y + R * (0.86 + 0.32 * t);
        c.globalAlpha = a * (1 - t);
        c.beginPath();
        c.arc(dx, dy, R * 0.07 * (1 - t * 0.4), 0, Math.PI * 2);
        c.fill();
      }
      break;
    }
    default: break;
  }
}

/** Shadow duplicate only (+3,+4, no blur). The world layer draws all shadows before all bodies. */
function paintShadow(c: CanvasRenderingContext2D, kind: BlotKind, x: number, y: number, o: Paint): void {
  const R = BLOTS[kind].radius * o.scale;
  traceBody(c, kind, x + SHADOW_OFFSET.x, y + SHADOW_OFFSET.y, R, o);
  c.globalAlpha = o.alpha * (o.pale ? 0.4 : 1);
  c.fillStyle = P.shadow;
  c.fill();
}

function paintBody(c: CanvasRenderingContext2D, kind: BlotKind, x: number, y: number, o: Paint): void {
  const d = BLOTS[kind];
  const R = d.radius * o.scale;
  const a = o.alpha;
  traceBody(c, kind, x, y, R, o);
  c.globalAlpha = a * (o.pale ? PALE.fillAlpha : 1);
  c.fillStyle = color(kind);
  c.fill();
  c.lineWidth = d.boss ? 2 : 1.5;
  c.strokeStyle = P.ink;
  c.globalAlpha = a * (o.pale ? 0.9 : 0.85);
  if (o.pale) c.setLineDash(PALE.dash as unknown as number[]);
  c.stroke();
  if (o.pale) { c.setLineDash(NO_DASH); hatch(c, kind, x, y, R, o); }
  if (!o.pale && d.shape !== 'scribble' && d.shape !== 'hexagon') {
    // paper sheen from the top-left sun
    c.globalAlpha = a * 0.3;
    c.strokeStyle = P.foldWhite;
    c.lineWidth = Math.max(1, R * 0.16);
    c.lineCap = 'round';
    c.beginPath(); c.arc(x, y, R * 0.6, Math.PI * 1.1, Math.PI * 1.4); c.stroke();
  }
  details(c, kind, x, y, R, o);
  pips(c, x, y, R, d.pips, o);
  if (o.flash) {
    traceBody(c, kind, x, y, R, o);
    c.globalAlpha = HIT.flashAlpha;
    c.fillStyle = P.foldWhite;
    c.fill();
  }
  c.globalAlpha = 1;
}
const NO_DASH: number[] = [];

const scratch: Paint = { pale: false, cb: false, scale: 1, phase: 0, alpha: 1, angle: 0, hp: 0, hpFrac: 1, flash: false };

/** Draw one blot shape at (x,y); used by the world layer, the title and the settings colourblind preview (§10.8). */
export function drawBlotShape(ctx: CanvasRenderingContext2D, kind: BlotKind, x: number, y: number, o: BlotDrawOpts): void {
  const p = scratch;
  p.pale = o.pale && BLOTS[kind].paleEligible; p.cb = o.colourblind; p.scale = o.scale ?? 1; p.phase = o.phase ?? 0;
  p.alpha = o.alpha ?? 1; p.angle = 0; p.hp = BLOTS[kind].hp; p.hpFrac = 1; p.flash = false;
  ctx.save();
  paintShadow(ctx, kind, x, y, p);
  paintBody(ctx, kind, x, y, p);
  ctx.restore();
}

// ───────────────────────────── sprite cache ─────────────────────────────
// R18–R20 put several hundred blots on screen. Tracing each one's 24-sample quadratic outline, stroke,
// sheen and pips every frame made the blot pass ~6 ms of CPU raster by itself, so the world layer blits
// pre-painted sprites instead. A sprite is the same paintShadow/paintBody output, painted once at device
// resolution and keyed by everything that changes its pixels: kind, layer (shadow/body/flash), Pale,
// colourblind, and a bucket of the lobe phase (32 per 2π, ≤ 0.3 px of outline drift between buckets)
// or of the comet's heading (64 per turn). Knots (hp-driven, spinning loops) and the Inkmaw (one boss,
// maw widens at 10 %) stay live. Without a canvas (Vitest) every blot is drawn live.

const PHASE_BUCKETS = 32;
const ANGLE_BUCKETS = 64;
const TAU = Math.PI * 2;
const SPRITE_KINDS: Readonly<Record<BlotKind, number>> = { dot: 0, drop: 1, splat: 2, splash: 3, blotch: 4, streak: 5, wax: 6, knot: -1, inkmaw: -1 };
const enum Layer { Shadow = 0, Body = 1, Flash = 2 }

interface Sprite { readonly cv: CanvasImageSource }

/** Half-extent (logical px) that holds the shape, its stroke, sheen and the comet's tail. */
const spriteHalf = (kind: BlotKind): number => {
  const R = BLOTS[kind].radius;
  return Math.ceil(BLOTS[kind].shape === 'comet' ? R * 2.6 + 3 : R * (1 + LOBE.amplitude) + 3);
};

function createSpriteCache() {
  const map = new Map<number, Sprite | null>();
  let res = 0;
  let disabled = false;
  const p: Paint = { pale: false, cb: false, scale: 1, phase: 0, alpha: 1, angle: 0, hp: 1, hpFrac: 1, flash: false };

  function paint(kind: BlotKind, layer: Layer, pale: boolean, cb: boolean, bucket: number): Sprite | null {
    const half = spriteHalf(kind);
    const px = Math.ceil(half * 2 * res);
    const cv = makeCanvas(px, px);
    const g = cv && ctxOf(cv);
    if (!cv || !g) { disabled = true; return null; }
    const shape = BLOTS[kind].shape;
    p.pale = pale; p.cb = cb; p.hp = BLOTS[kind].hp;
    p.phase = shape === 'lobed' ? (bucket * TAU) / PHASE_BUCKETS - PHASE_OFFSET[kind] : 0;
    p.angle = shape === 'comet' ? (bucket * TAU) / ANGLE_BUCKETS : 0;
    g.setTransform(res, 0, 0, res, px / 2, px / 2);
    const c = g as unknown as CanvasRenderingContext2D;
    if (layer === Layer.Shadow) paintShadow(c, kind, -SHADOW_OFFSET.x, -SHADOW_OFFSET.y, p);
    else if (layer === Layer.Body) paintBody(c, kind, 0, 0, p);
    else { traceBody(c, kind, 0, 0, BLOTS[kind].radius, p); c.globalAlpha = HIT.flashAlpha; c.fillStyle = P.foldWhite; c.fill(); }
    return { cv: cv as CanvasImageSource };
  }

  return {
    /** Device px per logical px of `c`; a change (resize, DPR) drops every sprite. False → draw live. */
    begin(c: CanvasRenderingContext2D): boolean {
      if (disabled || typeof c.getTransform !== 'function') return false;
      const m = c.getTransform() as DOMMatrix | undefined;
      if (!m || !Number.isFinite(m.a) || !Number.isFinite(m.e) || m.b !== 0 || m.c !== 0) return false;
      const r = Math.round(Math.hypot(m.a, m.b) * 64) / 64;
      if (!(r > 0)) return false;
      if (r !== res) { map.clear(); res = r; }
      return true;
    },
    get(kind: BlotKind, layer: Layer, pale: boolean, cb: boolean, phase: number, angle: number): Sprite | null {
      const ki = SPRITE_KINDS[kind];
      const shape = BLOTS[kind].shape;
      let bucket = 0;
      if (shape === 'lobed') {
        const t = (((phase + PHASE_OFFSET[kind]) % TAU) + TAU) % TAU;
        bucket = Math.round((t / TAU) * PHASE_BUCKETS) % PHASE_BUCKETS;
      } else if (shape === 'comet') {
        const t = ((angle % TAU) + TAU) % TAU;
        bucket = Math.round((t / TAU) * ANGLE_BUCKETS) % ANGLE_BUCKETS;
      }
      // Only the flags that change a layer's pixels go into its key: the shadow ignores colourblind, the
      // flash silhouette ignores both colourblind and Pale (F-010).
      if (layer !== Layer.Body) cb = false;
      if (layer === Layer.Flash) pale = false;
      const key = ((((ki * 3 + layer) * 2 + (pale ? 1 : 0)) * 2 + (cb ? 1 : 0)) << 7) | bucket;
      let sp = map.get(key);
      if (sp === undefined) { sp = paint(kind, layer, pale, cb, bucket); map.set(key, sp); }
      return sp;
    },
  };
}

// ───────────────────────────── world layer ─────────────────────────────

/** Kinds by radius, largest first (§10.5 draw order: blots largest R first); the boss is drawn last so the
 *  Splashes it sheds (F-031) run under the maw and come out ahead of it instead of crossing its face. */
const DRAW_ORDER: readonly BlotKind[] = (Object.keys(BLOTS) as BlotKind[]).sort((a, b) =>
  Number(!!BLOTS[a].boss) - Number(!!BLOTS[b].boss) || BLOTS[b].radius - BLOTS[a].radius || a.localeCompare(b));
const SLOTS = 4096;
const backOut = (t: number): number => { const c1 = MOTION.backOutS, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const outCubic = (t: number): number => 1 - (1 - t) ** 3;
const inOutSine = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * F-014: the inkwell occluder (garden.drawOccluders, drawn between the 'blots' and 'towers' passes) covers
 * x ≲ 80 around y 200. While the boss overlaps it (entry at s 70 … s 175, where its left edge and shadow
 * clear x 84), the boss is painted in the 'towers' pass instead, so it heaves out over the inkwell's lip
 * rather than hiding under it. The path is straight there, so the hand-over is invisible.
 */
const BOSS_OVER_INKWELL_S = 175;

/** §10.6 arrival heave: scaleY 0.85 → 1.05 (outCubic, first 45 %) → 1 (inOutSine); x keeps the volume. */
function heaveY(t: number): number {
  const a = BOSS_FEEL.arrive;
  if (t >= 1) return 1;
  if (t < a.peakAt) return a.squash + (a.overshoot - a.squash) * outCubic(t / a.peakAt);
  return a.overshoot + (1 - a.overshoot) * inOutSine((t - a.peakAt) / (1 - a.peakAt));
}

const DEATH = BOSS_FEEL.death;
const DEATH_FLECK: FleckStyle = { speed: DEATH.speed, size: DEATH.size, lifeMs: DEATH.lifeMs, edge: null, shape: 'tri' };
const DEATH_SCRAP: FleckStyle = { speed: DEATH.scrapSpeed, size: DEATH.scrapSize, lifeMs: DEATH.scrapLifeMs, edge: P.inkSoft, shape: 'scrap' };

/** World layer: draws pass 'blots'; on pop/immune/hit events spawns rings/flecks/sparks through fx. */
export function createBlotLayer(fx: Fx): WorldLayer {
  // per-blot real-time feel, keyed by id % SLOTS (ids are monotonic; a stale slot is detected by its id)
  const slotId = new Int32Array(SLOTS);
  const squashAt = new Float64Array(SLOTS);
  const recoilAt = new Float64Array(SLOTS);
  const recoilX = new Float32Array(SLOTS);
  const recoilY = new Float32Array(SLOTS);
  const flash = new Uint8Array(SLOTS);
  // visual launches (F-022 shed spray, F-023 death scatter): from a point to the blot's sim slot, real time
  const launchAt = new Float64Array(SLOTS);
  const launchMs = new Float32Array(SLOTS);
  const launchX = new Float32Array(SLOTS);
  const launchY = new Float32Array(SLOTS);
  const launchArc = new Float32Array(SLOTS);
  const launchLift = new Float32Array(SLOTS);
  /** Boss arrival heave start (real-time clock), keyed by the boss's blot id. */
  let heaveAt = -1e9;
  let heaveId = 0;
  // where the parent of this step's children stood: the live boss (shed) or the popped boss (death)
  let shedParent = 0, shedTick = -1, shedX = 0, shedY = 0, shedN = 0;
  let deathParent = 0, deathX = 0, deathY = 0;
  let clock = 0;
  let phaseClock = 0;
  const pt: MutVec = { x: 0, y: 0 };
  const tg: MutVec = { x: 0, y: 0 };
  const paint: Paint = { pale: false, cb: false, scale: 1, phase: 0, alpha: 1, angle: 0, hp: 1, hpFrac: 1, flash: false };
  const sprites = createSpriteCache();

  const claim = (id: number): number => {
    const k = id & (SLOTS - 1);
    if (slotId[k] !== id) { slotId[k] = id; squashAt[k] = -1e9; recoilAt[k] = -1e9; flash[k] = 0; launchAt[k] = -1e9; }
    return k;
  };

  function launch(id: number, fromX: number, fromY: number, ms: number, arc: number, lift: number): void {
    const k = claim(id);
    launchAt[k] = clock; launchMs[k] = ms; launchX[k] = fromX; launchY[k] = fromY; launchArc[k] = arc; launchLift[k] = lift;
  }

  /** The boss's position this step, if `id` is the live boss (children spawn before 'bossShed' is emitted). */
  function bossAt(id: number, state: Readonly<SimState>): boolean {
    if (!state.boss || state.boss.blotId !== id) return false;
    if (shedParent === id && shedTick === state.tick) return true;
    const items = state.blots.items;
    for (let i = 0; i < state.blots.count; i++) {
      const b = items[i];
      if (b.alive && b.id === id) { shedParent = id; shedTick = state.tick; shedX = b.x; shedY = b.y; shedN = 0; return true; }
    }
    return false;
  }

  function onSimEvent(e: SimEvent, state?: Readonly<SimState>): void {
    switch (e.type) {
      case 'spawn':
        if (e.parentId === 0) break;
        squashAt[claim(e.blotId)] = clock;
        if (e.parentId === deathParent) {
          // F-023: the Knots scatter from the burst centre out to their slots (s − 24k)
          launch(e.blotId, deathX, deathY, DEATH.scatterMs, 0, 0);
        } else if (state && bossAt(e.parentId, state)) {
          // F-022: each shed Splash sprays from the boss centre to its slot behind it, arcing to alternate sides
          const sh = BOSS_FEEL.shed;
          const n = shedN++;
          const arc = (sh.arcPx[0] + ((sh.arcPx[1] - sh.arcPx[0]) * (n % 6)) / 5) * (n % 2 ? 1 : -1);
          launch(e.blotId, shedX, shedY, sh.launchMs, arc, sh.liftPx);
        }
        break;
      case 'bossArrive': {
        heaveAt = clock; heaveId = e.blotId;
        const items = state?.blots.items;
        if (items && state) for (let i = 0; i < state.blots.count; i++) {
          const b = items[i];
          if (b.id !== e.blotId) continue;
          // the spill it heaves out of: a --knot ring and a splash of its own ink
          const R = BLOTS.inkmaw.radius;
          fx.ring(b.x, b.y, R * 0.6, R * 1.5, P.knot, BOSS_FEEL.arrive.ringMs, 0, 3);
          fx.flecks(b.x, b.y, BOSS_FEEL.arrive.flecks, P.maw, 'tri');
          break;
        }
        break;
      }
      case 'hit': {
        const k = claim(e.blotId);
        flash[k] = 1; recoilAt[k] = clock; recoilX[k] = e.dirX; recoilY[k] = e.dirY;
        break;
      }
      case 'pop': {
        if (BLOTS[e.kind].boss) { deathParent = e.blotId; deathX = e.x; deathY = e.y; }
        const d = BLOTS[e.kind];
        const col = color(e.kind);
        fx.ring(e.x, e.y, d.radius, d.radius * POP.ringScale, col, POP.ringMs, 0, POP.ringWidth);
        fx.flecks(e.x, e.y, 6, col, 'tri');
        if (e.kind === 'knot') fx.flecks(e.x, e.y, 6, P.thread, 'tri');
        break;
      }
      case 'immune':
        fx.sparks(e.x, e.y, 3);
        break;
      case 'bossShed':
        fx.ring(e.x, e.y, BLOTS.inkmaw.radius, BLOTS.inkmaw.radius * 1.5, P.l4, 260, 0, 3);
        fx.flecks(e.x, e.y, 24, P.maw, 'tri');
        break;
      case 'bossDeath': {
        const R = BLOTS.inkmaw.radius;
        for (let i = 0; i < 3; i++) fx.ring(e.x, e.y, R * (0.8 + i * 0.3), R * (1.8 + i * 0.5), i === 1 ? P.ink : P.maw, 420, i * 60, 3);
        // F-023: the only big hit — fast, long-lived flecks, half maw and half knot, plus torn paper scraps
        burst(fx, e.x, e.y, DEATH.flecks / 2, P.maw, DEATH_FLECK);
        burst(fx, e.x, e.y, DEATH.flecks / 2, P.knot, DEATH_FLECK);
        burst(fx, e.x, e.y, DEATH.scraps, P.paper, DEATH_SCRAP);
        break;
      }
      default: break;
    }
  }

  function draw(f: RenderFrame, pass: DrawPass): void {
    // 'blots' paints every blot under the inkwell; 'towers' paints only a boss still over it (F-014)
    const overPass = pass === 'towers';
    if (pass !== 'blots' && !overPass) return;
    const c = f.ctx;
    const s = f.state;
    const items = s.blots.items;
    const n = s.blots.count;
    const reduce = f.settings.reduceMotion;
    const boss = s.boss;
    if (overPass && !boss) return;
    paint.cb = f.settings.colourblind;
    const useSprites = !overPass && sprites.begin(c);
    const outerAlpha = c.globalAlpha;
    // The pass alpha (the title → play fade sets it) scales live paths too: paintShadow/paintBody set
    // globalAlpha absolutely from paint.alpha, so it has to travel in paint (F-011).
    paint.alpha = outerAlpha;
    // Sprites blit in device pixels, snapped to whole pixels: an integer-aligned 1:1 copy is Skia's fast
    // path, where a sub-pixel blit is filtered and costs several times more. Live paths keep the world matrix.
    const m = useSprites ? c.getTransform() : null;
    let identity = false;
    c.save();
    for (let layer = 0; layer < 2; layer++) {
      for (let o = 0; o < DRAW_ORDER.length; o++) {
        const kind = DRAW_ORDER[o];
        if (overPass && !BLOTS[kind].boss) continue;
        for (let i = 0; i < n; i++) {
          const b = items[i];
          if (!b.alive || b.kind !== kind) continue;
          const sv = b.ps + (b.s - b.ps) * f.alpha;
          if (BLOTS[kind].boss && (sv < BOSS_OVER_INKWELL_S) !== overPass) continue;
          pointAt(sv, pt);
          let x = pt.x, y = pt.y;
          const k = claim(b.id);
          let scale = 1;
          const st = clock - squashAt[k];
          if (st >= 0 && st < POP.childSquashMs) scale = POP.childSquashFrom + (1 - POP.childSquashFrom) * backOut(st / POP.childSquashMs);
          const rt = clock - recoilAt[k];
          if (rt >= 0 && rt < HIT.recoilMs) { const m = HIT.recoilPx * (1 - rt / HIT.recoilMs); x += recoilX[k] * m; y += recoilY[k] * m; }
          // visual launch: from the parent's centre to the sim slot (backOut), arcing off the line and lifting
          // off its shadow; motion is real time, so it plays through the sim's hit-stop
          let lift = 0;
          const lt = clock - launchAt[k];
          if (lt >= 0 && lt < launchMs[k]) {
            const t = lt / launchMs[k];
            const fx0 = launchX[k], fy0 = launchY[k];
            const dx = x - fx0, dy = y - fy0;
            const e = reduce ? outCubic(t) : backOut(t);
            const bump = Math.sin(Math.PI * t);
            const len = Math.hypot(dx, dy) || 1;
            x = fx0 + dx * e - (dy / len) * launchArc[k] * bump;
            y = fy0 + dy * e + (dx / len) * launchArc[k] * bump;
            lift = launchLift[k] * bump;
          }
          paint.pale = b.pale; paint.scale = scale; paint.hp = b.hp;
          paint.phase = reduce ? 0 : phaseClock * LOBE.phaseSpeed;
          paint.hpFrac = boss && boss.blotId === b.id ? b.hp / boss.maxHp : 1;
          tangentAt(sv, tg);
          paint.angle = Math.atan2(tg.y, tg.x);
          paint.flash = layer === 1 && flash[k] === 1;
          if (layer === 1) { flash[k] = 0; y -= lift; }
          if (useSprites && SPRITE_KINDS[kind] >= 0) {
            const pale = paint.pale && BLOTS[kind].paleEligible;
            const sp = sprites.get(kind, layer === 0 ? Layer.Shadow : Layer.Body, pale, paint.cb, paint.phase, paint.angle);
            if (sp && m) {
              if (!identity) { c.setTransform(1, 0, 0, 1, 0, 0); identity = true; }
              const ox = layer === 0 ? SHADOW_OFFSET.x : 0, oy = layer === 0 ? SHADOW_OFFSET.y : 0;
              const w = (sp.cv as HTMLCanvasElement).width * scale;
              const dx = Math.round((x + ox) * m.a + m.e - w / 2), dy = Math.round((y + oy) * m.d + m.f - w / 2);
              c.globalAlpha = outerAlpha;
              if (scale === 1) c.drawImage(sp.cv, dx, dy); else c.drawImage(sp.cv, dx, dy, w, w);
              if (paint.flash) {
                const fl = sprites.get(kind, Layer.Flash, pale, paint.cb, paint.phase, paint.angle);
                if (fl) { if (scale === 1) c.drawImage(fl.cv, dx, dy); else c.drawImage(fl.cv, dx, dy, w, w); }
              }
              continue;
            }
          }
          if (identity) { c.setTransform(m!); identity = false; }
          const ht = b.id === heaveId ? (clock - heaveAt) / BOSS_FEEL.arrive.ms : 1;
          if (ht >= 0 && ht < 1 && !reduce) {
            // §10.6 arrival heave, anchored at the base so it rises out of the spill
            const sy = heaveY(ht), sx = 1 + (1 - sy) * 0.6, base = y + BLOTS[kind].radius;
            c.save();
            c.translate(x, base); c.scale(sx, sy); c.translate(-x, -base);
            if (layer === 0) paintShadow(c, kind, x, y, paint); else paintBody(c, kind, x, y, paint);
            c.restore();
            continue;
          }
          if (layer === 0) paintShadow(c, kind, x, y, paint);
          else paintBody(c, kind, x, y, paint);
        }
      }
    }
    c.restore();
  }

  return {
    onSimEvent,
    update(dtRealMs) { clock += dtRealMs; phaseClock += dtRealMs / 1000; },
    draw,
    reset() {
      slotId.fill(0); squashAt.fill(-1e9); recoilAt.fill(-1e9); flash.fill(0); launchAt.fill(-1e9);
      heaveAt = -1e9; heaveId = 0; shedParent = 0; shedTick = -1; deathParent = 0;
      clock = 0; phaseClock = 0;
    },
  };
}
