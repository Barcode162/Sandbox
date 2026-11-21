/**
 * Camera (§4.6) and the world→screen transform. Pure; unit-tested in tests/unit/render/camera.test.ts.
 * World: wu, y grows north. Screen: CSS px, y grows down. x is fixed; the river column is centred.
 */
/** Frog target height, fraction of the viewport from the top (§4.6). */
export const ANCHOR = 0.64;
export const CAMERA_OMEGA = 10;
/** §4.6: eases to 0.96 when τ > 0.7, over ≈400 ms. */
export const DANGER_ZOOM = 0.96;
export const ZOOM_OMEGA = 12;

/** §4.1 viewport scale: px per wu. */
export function baseScale(w: number, h: number): number {
  return Math.min(w / 100, h / 150);
}

export interface Spring {
  x: number;
  v: number;
}

/**
 * Exact critically damped spring step (frame-rate independent: one 32 ms step equals two 16 ms steps).
 * x(t) = target + (d + (v + ωd)t)e^(−ωt).
 */
export function springStep(s: Spring, target: number, omega: number, dtSec: number): void {
  if (dtSec <= 0) return;
  const d = s.x - target;
  const k = s.v + omega * d;
  const e = Math.exp(-omega * dtSec);
  s.x = target + (d + k * dtSec) * e;
  s.v = (s.v - omega * k * dtSec) * e;
}

export interface Camera {
  y: Spring;
  zoom: Spring;
  /** Set on first use or a run restart so the camera never swoops in from 0. */
  primed: boolean;
}

export function createCamera(): Camera {
  return { y: { x: 0, v: 0 }, zoom: { x: 1, v: 0 }, primed: false };
}

export interface CameraGoal {
  /** World y the anchor should follow (the frog's visual y). */
  focusY: number;
  zoom: number;
  /** Snap instead of easing (first frame, restart, reduced-motion cuts). */
  cut: boolean;
}

export function stepCamera(cam: Camera, goal: CameraGoal, dtSec: number): void {
  if (!cam.primed || goal.cut) {
    cam.y.x = goal.focusY;
    cam.y.v = 0;
    cam.zoom.x = goal.zoom;
    cam.zoom.v = 0;
    cam.primed = true;
    return;
  }
  springStep(cam.y, goal.focusY, CAMERA_OMEGA, dtSec);
  springStep(cam.zoom, goal.zoom, ZOOM_OMEGA, dtSec);
}

/** The per-frame world→screen mapping. Mutable and reused (no per-frame allocation). */
export interface View {
  w: number;
  h: number;
  /** px per wu including zoom. */
  k: number;
  /** Screen x of world x = 50 (column centre) and screen y of camera focus. */
  cx: number;
  ay: number;
  camY: number;
  shakeX: number;
  shakeY: number;
}

export function createView(): View {
  return { w: 1, h: 1, k: 1, cx: 0, ay: 0, camY: 0, shakeX: 0, shakeY: 0 };
}

export function updateView(v: View, w: number, h: number, cam: Camera, shakeX: number, shakeY: number): void {
  v.w = w;
  v.h = h;
  v.k = baseScale(w, h) * cam.zoom.x;
  v.cx = w / 2;
  v.ay = h * ANCHOR;
  v.camY = cam.y.x;
  v.shakeX = shakeX;
  v.shakeY = shakeY;
}

export const sx = (v: View, x: number): number => v.cx + (x - 50) * v.k + v.shakeX;
export const sy = (v: View, y: number): number => v.ay - (y - v.camY) * v.k + v.shakeY;
/** Inverse mapping (screen → world), used by the ambient life and culling. */
export const wx = (v: View, px: number): number => 50 + (px - v.cx - v.shakeX) / v.k;
export const wy = (v: View, py: number): number => v.camY - (py - v.ay - v.shakeY) / v.k;

/**
 * Win framing (§7.5 step 4): zoom to the spec floor (0.4×, 0.33× under 700 px) with the finish bank 22%
 * down. Wide screens (≥ 1024 px) also pan along the route while it is inked (`winPan`), so the river fills
 * the frame instead of a whole-route thumbnail (F-012, F-019).
 */
export function winGoal(w: number, h: number, topY: number, bottomY: number): { zoom: number; focusY: number } {
  const s = baseScale(w, h);
  const floor = w < 700 ? 0.33 : 0.4;
  const fit = h / ((topY - bottomY) * s);
  const zoom = Math.max(floor, Math.min(1, fit));
  const visible = h / (s * zoom);
  return { zoom, focusY: topY - visible * (ANCHOR - 0.22) };
}

/** Wide-screen win: when the trace runs and for how long (ms after the win), and the pan's return. */
export const WIN_WIDE = { traceAt: 300, traceMs: 1200, returnAt: 2000 } as const;

/**
 * Camera focus that keeps the trace's drawing head at mid-screen, clamped so the view never leaves the
 * river (finish framing at the top, start bank at the bottom).
 */
export function winPan(w: number, h: number, zoom: number, headY: number, finishFocus: number, bottomY: number): number {
  const k = baseScale(w, h) * zoom;
  const centred = headY - (h * (ANCHOR - 0.5)) / k;
  const lowest = bottomY + (h * (1 - ANCHOR)) / k;
  return Math.min(finishFocus, Math.max(lowest, centred));
}
