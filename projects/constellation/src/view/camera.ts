// src/view/camera.ts — orbit rig (experience.md §8): drag orbits, right/two-finger drag pans,
// wheel/pinch dollies 0.92× per notch, damping 0.08, distance 25–520; focus-fly 900 ms `inout`
// with a mid-flight lift; idle drift 0.6°/s after 8 s; panels shift the principal point.
import { PerspectiveCamera, Vector3 } from 'three';
import type { Insets } from './contracts.ts';
import { clamp, easeInOut, lerp, range } from './motion.ts';

export const MIN_DIST = 25;
// 1600 lets a narrow phone fit a many-island memory (the Guidebook) whole (M-0003 F-001).
export const MAX_DIST = 1600;
const VFOV = 45;
const DEG = Math.PI / 180;

interface Pose {
  tx: number;
  ty: number;
  tz: number;
  dist: number;
  az: number;
  el: number;
}

interface Fly {
  from: Pose;
  to: Pose;
  t0: number;
  dur: number;
  lift: number;
  resolve: () => void;
}

export class CameraRig {
  readonly camera = new PerspectiveCamera(VFOV, 1, 0.5, 4000);
  /** Current (damped) pose and the goal it chases. */
  private cur: Pose = { tx: 0, ty: 0, tz: 0, dist: 300, az: 0, el: 12 * DEG };
  private goal: Pose = { ...this.cur };
  private fly: Fly | null = null;
  private width = 1;
  private height = 1;
  insets: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
  /** Clock ms of the last user input (drift waits 8 s). */
  lastInput = 0;
  private driftGain = 0;
  driftAllowed = true;
  private dragging = false;
  private liftY = 0;

  setSize(w: number, h: number): void {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.applyProjection();
  }

  setInsets(insets: Insets): void {
    this.insets = insets;
    this.applyProjection();
  }

  /** Free area (not covered by panels) in CSS px. */
  freeArea(): { w: number; h: number } {
    return {
      w: Math.max(80, this.width - this.insets.left - this.insets.right),
      h: Math.max(80, this.height - this.insets.top - this.insets.bottom),
    };
  }

  private applyProjection(): void {
    const c = this.camera;
    c.aspect = this.width / this.height;
    // Shift the principal point to the centre of the free area: content moves by (left-right)/2.
    const dx = (this.insets.left - this.insets.right) / 2;
    const dy = (this.insets.top - this.insets.bottom) / 2;
    if (dx !== 0 || dy !== 0) c.setViewOffset(this.width, this.height, -dx, -dy, this.width, this.height);
    else c.clearViewOffset();
    c.updateProjectionMatrix();
  }

  /** Pixels per world unit at depth 1 (vertical). */
  pxScale(): number {
    return this.height / 2 / Math.tan((VFOV * DEG) / 2);
  }

  /** Distance that fits a sphere of radius R in the free area. */
  fitDistance(R: number): number {
    const { w, h } = this.freeArea();
    const vfov = VFOV * DEG * (h / this.height);
    const hfov = 2 * Math.atan(Math.tan((VFOV * DEG) / 2) * (w / this.height));
    return clamp(R / Math.sin(Math.min(hfov, vfov) / 2), MIN_DIST, MAX_DIST);
  }

  pose(): Pose {
    return { ...this.cur };
  }

  get distance(): number {
    return this.cur.dist;
  }

  get busy(): boolean {
    return this.fly !== null;
  }

  /** Jump (no animation). */
  snap(p: Partial<Pose>): void {
    this.cancelFly();
    Object.assign(this.cur, p);
    Object.assign(this.goal, p);
  }

  cancelFly(): void {
    if (this.fly) {
      const r = this.fly.resolve;
      this.fly = null;
      r();
    }
  }

  flyTo(p: Partial<Pose>, now: number, dur: number, lift = 0.15): Promise<void> {
    this.cancelFly();
    const to = { ...this.goal, ...p };
    if (dur <= 0) {
      this.snap(to);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const from = { ...this.cur };
      // Take the short way round in azimuth.
      while (to.az - from.az > Math.PI) to.az -= Math.PI * 2;
      while (to.az - from.az < -Math.PI) to.az += Math.PI * 2;
      const travel = Math.hypot(to.tx - from.tx, to.ty - from.ty, to.tz - from.tz) + Math.abs(to.dist - from.dist);
      this.fly = { from, to, t0: now, dur, lift: lift * travel, resolve };
    });
  }

  // ── Input ────────────────────────────────────────────────────────────────────────
  input(now: number): void {
    this.lastInput = now;
  }

  beginDrag(): void {
    this.dragging = true;
  }

  endDrag(): void {
    this.dragging = false;
  }

  orbitBy(dxPx: number, dyPx: number, now: number): void {
    this.input(now);
    this.cancelFly();
    this.goal.az -= dxPx * 0.005;
    this.goal.el = clamp(this.goal.el + dyPx * 0.005, -1.35, 1.35);
  }

  panBy(dxPx: number, dyPx: number, now: number): void {
    this.input(now);
    this.cancelFly();
    const k = (this.goal.dist / this.pxScale()) * 1;
    const right = new Vector3();
    const up = new Vector3();
    this.camera.matrixWorld.extractBasis(right, up, new Vector3());
    this.goal.tx += (-right.x * dxPx + up.x * dyPx) * k;
    this.goal.ty += (-right.y * dxPx + up.y * dyPx) * k;
    this.goal.tz += (-right.z * dxPx + up.z * dyPx) * k;
  }

  dolly(notches: number, now: number): void {
    this.input(now);
    this.cancelFly();
    this.goal.dist = clamp(this.goal.dist * Math.pow(0.92, notches), MIN_DIST, MAX_DIST);
  }

  /** Advance one frame. `dt` in clock ms. */
  update(now: number, dt: number, driftOn: boolean): void {
    if (this.fly) {
      const f = this.fly;
      const u = easeInOut(range(now, f.t0, f.t0 + f.dur));
      const keys: Array<keyof Pose> = ['tx', 'ty', 'tz', 'dist', 'az', 'el'];
      for (const k of keys) this.cur[k] = lerp(f.from[k], f.to[k], u);
      this.liftY = f.lift * Math.sin(Math.PI * u);
      Object.assign(this.goal, this.cur);
      if (u >= 1) {
        this.liftY = 0;
        Object.assign(this.cur, f.to);
        Object.assign(this.goal, f.to);
        this.fly = null;
        f.resolve();
      }
    } else {
      // Idle drift: ramp in over 1200 ms after 8 s of stillness; ramp out in 300 ms on input.
      const want = driftOn && this.driftAllowed && !this.dragging && now - this.lastInput > 8000 ? 1 : 0;
      const rate = want > this.driftGain ? dt / 1200 : dt / 300;
      this.driftGain = want > this.driftGain ? Math.min(want, this.driftGain + rate) : Math.max(want, this.driftGain - rate);
      if (this.driftGain > 0) this.goal.az += ((0.6 * DEG) / 1000) * dt * this.driftGain;
      const k = 1 - Math.pow(1 - 0.08, Math.max(0, dt) / (1000 / 60));
      const keys: Array<keyof Pose> = ['tx', 'ty', 'tz', 'dist', 'az', 'el'];
      for (const key of keys) this.cur[key] = lerp(this.cur[key], this.goal[key], k);
    }
    const c = this.cur;
    const ce = Math.cos(c.el);
    this.camera.position.set(c.tx + Math.sin(c.az) * ce * c.dist, c.ty + Math.sin(c.el) * c.dist + this.liftY, c.tz + Math.cos(c.az) * ce * c.dist);
    this.camera.lookAt(c.tx, c.ty, c.tz);
    this.camera.updateMatrixWorld();
  }

  get drifting(): boolean {
    return this.driftGain > 0.001;
  }
}
