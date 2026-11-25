// src/core/math.ts — FROZEN (WO-001). Allocation-free helpers shared by sim and views.
import type { Vec2 } from '../contracts.ts';

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Wrap an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}
/** Shortest-path angle lerp. */
export const lerpAngle = (a: number, b: number, t: number) => a + wrapAngle(b - a) * t;
/** Rotate `a` toward `b` by at most `maxStep` radians. */
export function turnToward(a: number, b: number, maxStep: number): number {
  const d = wrapAngle(b - a);
  return Math.abs(d) <= maxStep ? b : a + Math.sign(d) * maxStep;
}
/** Facing angle for a ground direction (facing 0 = -z, PI/2 = +x). */
export const facingOf = (dx: number, dz: number) => Math.atan2(dx, -dz);
export const dirX = (facing: number) => Math.sin(facing);
export const dirZ = (facing: number) => -Math.cos(facing);
export const dist2 = (a: Vec2, b: Vec2) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
export const dist = (a: Vec2, b: Vec2) => Math.sqrt(dist2(a, b));
export function copyVec(into: Vec2, from: Vec2): Vec2 {
  into.x = from.x;
  into.z = from.z;
  return into;
}
/** Exponential approach factor for a frame of dt seconds (framerate-independent smoothing). */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);
