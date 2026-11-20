/**
 * Ambient life (§5.4): 2 dragonflies (4 paper wings flickering at 30 Hz, Lissajous wander, sometimes
 * resting 1–2 s on a non-reachable lily), 3 water striders darting in 120 ms jumps, 4 drifting petals
 * and 3–5 paper sparkles twinkling over 600 ms. World-space, kept around the camera, deterministic.
 * No dark fish shapes: only the gator is dark under water.
 */
import type { Vec2 } from '../contracts';
import { SHADOW } from './color';
import { star } from './draw';
import { EASE_UI, clamp01 } from './ease';
import { rand3 } from './noise';
import { PALETTE } from './palette';
import type { Bounds } from './world';

const TAU = Math.PI * 2;

export interface LifeWorld {
  /** Visual (swayed) pad centre. */
  padPos(id: number, out: Vec2): Vec2;
  /** A visible, non-reachable, unoccupied lily to rest on, or -1. */
  pickRestPad(salt: number): number;
  /** True if a world point is on a pad or on sand (striders and sparkles stay on open water). */
  blocked(x: number, y: number): boolean;
}

interface Fly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  mode: 0 | 1 | 2; // wander, approach, rest
  until: number;
  pad: number;
  n: number;
}

interface Strider {
  x: number;
  y: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  jumpAt: number;
  /** Start of the current 120 ms dart. */
  js: number;
  heading: number;
  n: number;
}

interface Drift {
  x: number;
  y: number;
  rot: number;
  spin: number;
  size: number;
}

interface Spark {
  x: number;
  y: number;
  start: number;
  n: number;
}

const tmp: Vec2 = { x: 0, y: 0 };

export class Life {
  private t = 0;
  private flies: Fly[] = [];
  private striders: Strider[] = [];
  private petals: Drift[] = [];
  private sparks: Spark[] = [];
  private primed = false;

  constructor(private seed: number) {
    for (let i = 0; i < 2; i++) this.flies.push({ x: 50, y: 0, vx: 0, vy: 0, heading: 0, mode: 0, until: 3 + i * 2.5, pad: -1, n: 0 });
    for (let i = 0; i < 3; i++) this.striders.push({ x: 0, y: 0, x0: 0, y0: 0, x1: 0, y1: 0, jumpAt: 0.4 * i, js: -1, heading: 0, n: 0 });
    for (let i = 0; i < 4; i++) this.petals.push({ x: 0, y: 0, rot: 0, spin: 0, size: 1.2 });
    for (let i = 0; i < 5; i++) this.sparks.push({ x: 0, y: 0, start: -1, n: 0 });
  }

  reset(seed: number): void {
    this.seed = seed;
    this.primed = false;
  }

  private place(b: Bounds, w: LifeWorld, salt: number, out: Vec2): Vec2 {
    for (let k = 0; k < 12; k++) {
      out.x = Math.max(0, b.xL) + rand3(this.seed, salt, k) * (Math.min(100, b.xR) - Math.max(0, b.xL));
      out.y = b.yB + rand3(this.seed, salt, k + 50) * (b.yT - b.yB);
      if (!w.blocked(out.x, out.y)) return out;
    }
    return out;
  }

  /** dt in ambient seconds (already halved under reduced motion). */
  update(dt: number, b: Bounds, w: LifeWorld): void {
    this.t += dt;
    const t = this.t;
    const cy = (b.yB + b.yT) / 2, hy = (b.yT - b.yB) / 2;
    if (!this.primed) {
      this.primed = true;
      this.flies.forEach((f, i) => {
        f.x = 30 + 40 * i;
        f.y = cy + hy * 0.4;
        f.mode = 0;
        f.until = t + 3 + i * 2.5;
      });
      this.striders.forEach((s, i) => {
        this.place(b, w, 100 + i, tmp);
        s.x = s.x0 = s.x1 = tmp.x;
        s.y = s.y0 = s.y1 = tmp.y;
        s.jumpAt = t + 0.3 + i * 0.37;
      });
      this.petals.forEach((p, i) => {
        p.x = b.xL + rand3(this.seed, 200 + i) * (b.xR - b.xL);
        p.y = b.yB + rand3(this.seed, 210 + i) * (b.yT - b.yB);
        p.rot = rand3(this.seed, 220 + i) * TAU;
        p.spin = (rand3(this.seed, 230 + i) - 0.5) * 0.6;
        p.size = 1 + rand3(this.seed, 240 + i) * 0.7;
      });
      this.sparks.forEach((s, i) => (s.start = t + i * 0.23));
    }

    // Dragonflies.
    for (let i = 0; i < this.flies.length; i++) {
      const f = this.flies[i]!;
      let tx: number, ty: number;
      if (f.mode === 0) {
        const k = 1 + 0.21 * i;
        tx = 50 + 38 * Math.sin(0.31 * k * t + i * 2.1) + 6 * Math.sin(1.7 * t + i);
        // Wander ahead of the frog (20–42% from the top), clear of the lit chips.
        ty = cy + hy * (0.38 + 0.22 * Math.sin(0.43 * k * t + i)) + 3 * Math.sin(1.3 * t + 2 * i);
        if (t > f.until) {
          const pad = w.pickRestPad(f.n++ * 7 + i);
          if (pad >= 0) {
            f.mode = 1;
            f.pad = pad;
            f.until = t + 1.1;
          } else f.until = t + 2;
        }
      } else {
        w.padPos(f.pad, tmp);
        tx = tmp.x + (i ? -3 : 3);
        ty = tmp.y + 2;
        if (f.mode === 1 && t > f.until) {
          f.mode = 2;
          f.until = t + 1 + rand3(this.seed, i, f.n);
        } else if (f.mode === 2 && t > f.until) {
          f.mode = 0;
          f.until = t + 4 + rand3(this.seed, i + 9, f.n) * 3;
        }
      }
      if (f.mode === 2) {
        f.x = tx;
        f.y = ty;
        f.vx = f.vy = 0;
      } else {
        // Critically damped follow: no snapping when the camera moves.
        const om = f.mode === 1 ? 5 : 2.6;
        const ax = om * om * (tx - f.x) - 2 * om * f.vx, ay = om * om * (ty - f.y) - 2 * om * f.vy;
        f.vx += ax * dt;
        f.vy += ay * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.vx * f.vx + f.vy * f.vy > 4) f.heading = Math.atan2(f.vy, f.vx);
      }
    }

    // Water striders: rest 0.5–1.4 s, then a 120 ms dart of 6–12 wu over open water.
    for (let i = 0; i < this.striders.length; i++) {
      const s = this.striders[i]!;
      if (s.x < b.xL - 5 || s.x > b.xR + 5 || s.y < b.yB - 5 || s.y > b.yT + 5) {
        this.place(b, w, 300 + i * 31 + s.n++, tmp);
        s.x = s.x0 = s.x1 = tmp.x;
        s.y = s.y0 = s.y1 = tmp.y;
      }
      if (t >= s.jumpAt) {
        s.x0 = s.x;
        s.y0 = s.y;
        for (let k = 0; k < 6; k++) {
          const a = rand3(this.seed, i * 97 + s.n, k) * TAU;
          const d = 6 + rand3(this.seed, i * 89 + s.n, k) * 6;
          s.x1 = s.x0 + Math.cos(a) * d;
          s.y1 = s.y0 + Math.sin(a) * d;
          if (!w.blocked(s.x1, s.y1) && s.x1 > 2 && s.x1 < 98) break;
          s.x1 = s.x0;
          s.y1 = s.y0;
        }
        s.heading = Math.atan2(s.y1 - s.y0, s.x1 - s.x0);
        s.js = t;
        s.n++;
        s.jumpAt = t + 0.12 + 0.5 + rand3(this.seed, i, s.n) * 0.9;
      }
      const p = EASE_UI(clamp01((t - s.js) / 0.12));
      s.x = s.x0 + (s.x1 - s.x0) * p;
      s.y = s.y0 + (s.y1 - s.y0) * p;
    }

    // Petals drift with the 6 wu/s current and re-enter from the far side.
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i]!;
      p.x += 6 * dt * (0.8 + 0.1 * i);
      p.y += Math.sin(t * 0.7 + i) * 0.6 * dt;
      p.rot += p.spin * dt;
      if (p.x > b.xR + 4) {
        p.x = b.xL - 4;
        p.y = b.yB + rand3(this.seed, 400 + i, Math.floor(t)) * (b.yT - b.yB);
      }
      if (p.y < b.yB - 6) p.y += b.yT - b.yB + 10;
      if (p.y > b.yT + 6) p.y -= b.yT - b.yB + 10;
    }

    // Sparkles: 3–5 alive; each lives 600 ms, then rests 0.3–1.4 s and re-seeds elsewhere.
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i]!;
      if (t >= s.start + 0.6) {
        s.n++;
        s.start = t + (i < 3 ? 0.1 : 0.3) + rand3(this.seed, 500 + i, s.n) * (i < 3 ? 0.35 : 1.1);
        this.place(b, w, 600 + i * 53 + s.n, tmp);
        s.x = tmp.x;
        s.y = tmp.y;
      }
    }
  }

  /** Water-level life: striders and sparkles (under pads' shadows is fine: they are on water). */
  drawWater(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    ctx.lineCap = 'round';
    for (let i = 0; i < this.striders.length; i++) {
      const s = this.striders[i]!;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.heading);
      // Dimples where the feet press the surface.
      ctx.strokeStyle = 'rgba(243,235,216,0.55)';
      ctx.lineWidth = 0.22;
      ctx.beginPath();
      for (let k = 0; k < LEGS.length; k += 2) {
        ctx.moveTo(LEGS[k]! + 0.45, LEGS[k + 1]!);
        ctx.arc(LEGS[k]!, LEGS[k + 1]!, 0.45, 0, TAU);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(29,43,58,0.75)';
      ctx.lineWidth = 0.16;
      ctx.beginPath();
      for (let k = 0; k < LEGS.length; k += 2) {
        ctx.moveTo(0, 0);
        ctx.lineTo(LEGS[k]!, LEGS[k + 1]!);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(29,43,58,0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.0, 0.36, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.paper;
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i]!;
      const u = (t - s.start) / 0.6;
      if (u < 0 || u > 1) continue;
      const k = Math.sin(Math.PI * u);
      ctx.globalAlpha = 0.9 * k;
      star(ctx, s.x, s.y, 1.5 * k + 0.2, 0.5);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i]!;
      ctx.fillStyle = SHADOW;
      ctx.beginPath();
      ctx.ellipse(p.x + 0.3, p.y - 0.4, p.size, p.size * 0.45, p.rot, 0, TAU);
      ctx.fill();
      ctx.fillStyle = i % 2 ? PALETTE.paper : PALETTE.padUnder;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.45, p.rot, 0, TAU);
      ctx.fill();
    }
  }

  /** Air-level life: dragonflies with their shadows far below. */
  drawAir(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    for (let i = 0; i < this.flies.length; i++) {
      const f = this.flies[i]!;
      const resting = f.mode === 2;
      const h = resting ? 1.2 : 9;
      const wingA = resting ? 0.85 : 0.55 + 0.3 * Math.sin(TAU * 30 * t + i);
      for (let pass = 0; pass < 2; pass++) {
        ctx.save();
        if (pass === 0) ctx.translate(f.x + 0.35 * h, f.y - 0.45 * h);
        else ctx.translate(f.x, f.y);
        ctx.rotate(f.heading);
        const spread = resting ? 1 : 0.85 + 0.15 * Math.sin(TAU * 30 * t);
        // Four wings (paper), two pairs.
        ctx.fillStyle = pass === 0 ? SHADOW : PALETTE.paper;
        ctx.globalAlpha = pass === 0 ? 0.7 : wingA;
        ctx.beginPath();
        for (let k = 0; k < WINGS.length; k += 3) {
          const wx = WINGS[k]!, wy = WINGS[k + 1]!;
          const a = WINGS[k + 2]! * spread;
          ctx.moveTo(wx + Math.cos(a) * 3.6, wy + Math.sin(a) * 3.6);
          ctx.ellipse(wx + Math.cos(a) * 1.9, wy + Math.sin(a) * 1.9, 2.1, 0.62, a, 0, TAU);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = pass === 0 ? SHADOW : PALETTE.ink;
        ctx.beginPath();
        ctx.ellipse(-0.8, 0, 2.9, 0.42, 0, 0, TAU);
        ctx.moveTo(2.9, 0);
        ctx.arc(2.3, 0, 0.62, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

/** Strider foot points (x, y pairs) and dragonfly wings (x, y, angle triples), flat so draw loops never allocate. */
const LEGS = new Float32Array([2.6, 1.6, 2.6, -1.6, -0.4, 2.4, -0.4, -2.4, -2.4, 1.9, -2.4, -1.9]);
const WINGS = new Float32Array([1.0, 0, 1.35, 1.0, 0, -1.35, 0.2, 0, 1.85, 0.2, 0, -1.85]);
