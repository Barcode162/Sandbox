/**
 * Render-only juice state (§6): hit-stop, shake, and fixed pools of particles and ripple rings.
 * Pools are struct-of-arrays sized once; spawning past capacity recycles the oldest slot, so a frame
 * never allocates (plan §Performance budgets, memory). Pure logic; drawing lives in the renderer.
 */
import { rand3 } from './noise';

/** Particle kinds. */
export const PK = { Droplet: 0, Bubble: 1, Petal: 2, Splash: 3, Sand: 4 } as const;
export type PK = (typeof PK)[keyof typeof PK];

export class Particles {
  readonly cap: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly vz: Float32Array;
  readonly g: Float32Array;
  readonly age: Float32Array;
  readonly life: Float32Array;
  readonly size: Float32Array;
  readonly rot: Float32Array;
  readonly spin: Float32Array;
  readonly kind: Uint8Array;
  /** Spawn a ripple when it lands (droplets on water). */
  readonly ripple: Uint8Array;
  private next = 0;
  alive = 0;

  constructor(cap: number) {
    this.cap = cap;
    const f = () => new Float32Array(cap);
    this.x = f(); this.y = f(); this.z = f(); this.vx = f(); this.vy = f(); this.vz = f(); this.g = f();
    this.age = f(); this.life = f(); this.size = f(); this.rot = f(); this.spin = f();
    this.kind = new Uint8Array(cap);
    this.ripple = new Uint8Array(cap);
  }

  spawn(kind: PK, x: number, y: number, vx: number, vy: number, z: number, vz: number, g: number, life: number, size: number, ripple = false): number {
    // Prefer a dead slot; else recycle round-robin.
    let i = -1;
    for (let n = 0; n < this.cap; n++) {
      const j = (this.next + n) % this.cap;
      if (this.life[j]! <= 0) {
        i = j;
        break;
      }
    }
    if (i < 0) i = this.next;
    else this.alive++;
    this.next = (i + 1) % this.cap;
    this.kind[i] = kind;
    this.x[i] = x; this.y[i] = y; this.z[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz; this.g[i] = g;
    this.age[i] = 0; this.life[i] = life; this.size[i] = size;
    this.rot[i] = 0; this.spin[i] = 0;
    this.ripple[i] = ripple ? 1 : 0;
    return i;
  }

  /** Advance by dt seconds. Landed droplets call onLand(x, y) (a ripple on water). */
  step(dt: number, onLand: (x: number, y: number, size: number) => void): void {
    for (let i = 0; i < this.cap; i++) {
      const life = this.life[i]!;
      if (life <= 0) continue;
      const a = this.age[i]! + dt;
      if (a >= life) {
        if (this.ripple[i]) onLand(this.x[i]! + this.vx[i]! * (life - this.age[i]!), this.y[i]! + this.vy[i]! * (life - this.age[i]!), this.size[i]!);
        this.life[i] = 0;
        this.alive--;
        continue;
      }
      this.age[i] = a;
      this.x[i] = this.x[i]! + this.vx[i]! * dt;
      this.y[i] = this.y[i]! + this.vy[i]! * dt;
      this.vz[i] = this.vz[i]! - this.g[i]! * dt;
      this.z[i] = Math.max(0, this.z[i]! + this.vz[i]! * dt);
      this.rot[i] = this.rot[i]! + this.spin[i]! * dt;
    }
  }

  clear(): void {
    this.life.fill(0);
    this.alive = 0;
  }
}

export class Ripples {
  readonly cap: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly r0: Float32Array;
  readonly r1: Float32Array;
  readonly a0: Float32Array;
  readonly age: Float32Array;
  readonly life: Float32Array;
  private next = 0;

  constructor(cap: number) {
    this.cap = cap;
    const f = () => new Float32Array(cap);
    this.x = f(); this.y = f(); this.r0 = f(); this.r1 = f(); this.a0 = f(); this.age = f(); this.life = f();
  }

  /** A ring from r0 to r1 over life seconds, alpha a0 → 0, starting after `delay` seconds. */
  spawn(x: number, y: number, r0: number, r1: number, life: number, a0: number, delay = 0): void {
    const i = this.next;
    this.next = (i + 1) % this.cap;
    this.x[i] = x; this.y[i] = y; this.r0[i] = r0; this.r1[i] = r1; this.a0[i] = a0;
    this.age[i] = -delay;
    this.life[i] = life;
  }

  step(dt: number): void {
    for (let i = 0; i < this.cap; i++) if (this.life[i]! > 0) {
      this.age[i] = this.age[i]! + dt;
      if (this.age[i]! >= this.life[i]!) this.life[i] = 0;
    }
  }

  clear(): void {
    this.life.fill(0);
  }
}

/** Exponential shake: amplitude px·e^(−kt) with k = 3.6/duration (8 px over 300 ms ⇒ k = 12, §6). */
export class Shake {
  private amp = 0;
  private k = 12;
  private t = 0;
  private n = 0;

  kick(px: number, ms: number): void {
    if (px <= 0) return;
    const cur = this.current();
    if (px >= cur) {
      this.amp = px;
      this.k = 3.6 / Math.max(0.05, ms / 1000);
      this.t = 0;
    }
  }

  current(): number {
    return this.amp * Math.exp(-this.k * this.t);
  }

  /** Advance and write this frame's offset into out (deterministic jitter). */
  step(dt: number, out: { x: number; y: number }): void {
    this.t += dt;
    this.n++;
    const a = this.current();
    if (a < 0.05) {
      out.x = 0;
      out.y = 0;
      return;
    }
    out.x = (rand3(this.n, 1) * 2 - 1) * a;
    out.y = (rand3(this.n, 2) * 2 - 1) * a;
  }

  reset(): void {
    this.amp = 0;
  }
}

/** Render-only freeze. `until` is in render-clock ms. */
export class HitStop {
  until = -Infinity;
  hold(nowMs: number, ms: number): void {
    if (ms > 0) this.until = Math.max(this.until, nowMs + ms);
  }
  active(nowMs: number): boolean {
    return nowMs < this.until;
  }
  reset(): void {
    this.until = -Infinity;
  }
}
