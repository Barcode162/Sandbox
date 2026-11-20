/**
 * Easing and remap helpers (§5.5 motion language). Pure; shared by render and UI.
 * Every curve the spec names exists here once, so CSS and canvas motion match.
 */

export type Ease = (t: number) => number;

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** §4.3 r(x, a, b): linear remap of [a, b] onto [0, 1], clamped. */
export const remap = (x: number, a: number, b: number): number => clamp01((x - a) / (b - a));
/** §4.3 smooth(): smoothstep. */
export const smooth = (x: number): number => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** CSS-compatible cubic-bezier(x1, y1, x2, y2). Newton with a bisection fallback; exact at 0 and 1. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 6; i++) {
      const e = sx(u) - t;
      if (Math.abs(e) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    let lo = 0, hi = 1;
    u = t;
    for (let i = 0; i < 30; i++) {
      const x = sx(u);
      if (Math.abs(x - t) < 1e-6) break;
      if (x < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

/** §5.5 default UI motion. */
export const EASE_UI = cubicBezier(0.2, 0.8, 0.2, 1);
/** §5.5 pops (chips, stamp, eyes rising). Overshoots to ≈1.12. */
export const EASE_POP = cubicBezier(0.3, 1.6, 0.5, 1);
/** §5.5 falls and sinks (ease-in). */
export const EASE_FALL = cubicBezier(0.5, 0, 0.9, 0.4);
/** §6 hop position in the air. */
export const EASE_AIR = cubicBezier(0.3, 0, 0.4, 1);

export const CSS_EASE = {
  ui: 'cubic-bezier(.2,.8,.2,1)',
  pop: 'cubic-bezier(.3,1.6,.5,1)',
  fall: 'cubic-bezier(.5,0,.9,.4)',
} as const;
