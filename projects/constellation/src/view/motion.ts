// src/view/motion.ts — easing, ranges and the single animation clock (experience.md §7 motion language, §13).
import type { RendererClock } from './contracts.ts';

/** r(t,a,b) = clamp((t−a)/(b−a),0,1). */
export function range(t: number, a: number, b: number): number {
  if (b <= a) return t >= b ? 1 : 0;
  return Math.min(1, Math.max(0, (t - a) / (b - a)));
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/** Solves a CSS cubic-bezier(x1,y1,x2,y2) for y at x (Newton + bisection fallback). */
function bezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-5) return sy(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** cubic-bezier(.22,1,.36,1) */
export const easeOut = bezier(0.22, 1, 0.36, 1);
/** cubic-bezier(.34,1.56,.64,1) — overshoots past 1. */
export const easeBack = bezier(0.34, 1.56, 0.64, 1);
export const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

/** Deterministic 0..1 hash of a string (FNV-1a). */
export function hash01(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** The one clock: real time unless paused or set (tests freeze frames with it). */
export function createClock(): RendererClock {
  let origin = performance.now();
  let pausedAt: number | null = null;
  return {
    now: () => (pausedAt ?? performance.now() - origin),
    pause() {
      if (pausedAt === null) pausedAt = performance.now() - origin;
    },
    resume() {
      if (pausedAt !== null) {
        origin = performance.now() - pausedAt;
        pausedAt = null;
      }
    },
    set(ms: number) {
      pausedAt = ms;
    },
    get paused() {
      return pausedAt !== null;
    },
  };
}
