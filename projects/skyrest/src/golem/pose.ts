// src/golem/pose.ts — owned by WO-004. The Stone Guardian's body language as a pure function of sim state + time:
// per-part golem-local position/rotation for every action (idle breath, walk, slam / sweep / toss / double slam
// with a 120 ms anticipation lean, stuck fists, stagger kneel, phase-2 roar, assembly from the mound), plus the
// per-part out-of-phase bob that makes it read as "held together by magic". Deterministic (moments, tests).
// Pure: no three/DOM.
import type { GolemState } from '../contracts.ts';
import { GOLEM } from '../tuning/golem.ts';
import { PARTS } from './parts-data.ts';
import { gx, wakeLength } from './sim.ts';

export const PART_COUNT = PARTS.length;
/** Stride of the pose buffer: x, y, z, rx, ry, rz, scale. */
export const POSE_STRIDE = 7;
export const createPose = () => new Float32Array(PART_COUNT * POSE_STRIDE);

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInQuad = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function hash(i: number, k: number): number {
  const x = Math.sin(i * 91.7 + k * 47.3) * 24634.6345;
  return x - Math.floor(x);
}

/** Body-level knobs one action sets; parts are then placed from them. Reused (no allocation). */
interface Rig {
  drop: number;
  lean: number;
  twist: number;
  headTilt: number;
  fist: [Float64Array, Float64Array];
  foot: [Float64Array, Float64Array];
  back: Float64Array;
  backScale: number;
  shake: number;
  /** 0..1 how high the fists are drawn (the view ramps the attacking limb's runes with it). */
  reach: number;
}
const rig: Rig = {
  drop: 0, lean: 0, twist: 0, headTilt: 0,
  fist: [new Float64Array(3), new Float64Array(3)], foot: [new Float64Array(3), new Float64Array(3)],
  back: new Float64Array(3), backScale: 1, shake: 0, reach: 0,
};
const restOf = (name: string) => PARTS.find((p) => p.name === name)!.rest;
const FIST_L = restOf('fistL'), FIST_R = restOf('fistR'), FOOT_L = restOf('footL'), FOOT_R = restOf('footR'), BACK = restOf('back');
const OVERHEAD_L = [0.55, 4.15, -0.15], OVERHEAD_R = [-0.55, 4.15, -0.15];
const GROUND_L = [0.42, 0.42, 2.25], GROUND_R = [-0.42, 0.42, 2.25];

function set3(a: Float64Array, x: number, y: number, z: number): void {
  a[0] = x;
  a[1] = y;
  a[2] = z;
}
function mix3(a: Float64Array, p: ArrayLike<number>, q: ArrayLike<number>, t: number): void {
  a[0] = lerp(p[0]!, q[0]!, t);
  a[1] = lerp(p[1]!, q[1]!, t);
  a[2] = lerp(p[2]!, q[2]!, t);
}
const tmpA = new Float64Array(3), tmpB = new Float64Array(3);

function rest(time: number): void {
  const b = Math.sin((time * Math.PI * 2) / 2.8);
  rig.drop = 0.03 * b;
  rig.lean = 0.02 * b;
  rig.twist = 0;
  rig.headTilt = 0;
  rig.shake = 0;
  rig.reach = 0;
  rig.backScale = 1;
  set3(rig.fist[0], FIST_L[0], FIST_L[1] + 0.04 * b, FIST_L[2]);
  set3(rig.fist[1], FIST_R[0], FIST_R[1] + 0.04 * b, FIST_R[2]);
  set3(rig.foot[0], FOOT_L[0], FOOT_L[1], FOOT_L[2]);
  set3(rig.foot[1], FOOT_R[0], FOOT_R[1], FOOT_R[2]);
  set3(rig.back, BACK[0], BACK[1], BACK[2]);
}

/** Slam: anticipation lean, fists overhead (t 0..1 of the windup). */
function slamWindup(t: number, fromGround: boolean): void {
  const ant = clamp01(t / 0.13);
  const up = easeOutCubic(clamp01((t - 0.08) / 0.62));
  rig.lean = fromGround ? lerp(0.45, -0.2, up) : -0.1 * ant - 0.12 * up;
  rig.headTilt = -0.2 * up;
  rig.reach = up;
  const s = fromGround ? 1 : 0;
  for (let i = 0; i < 2; i++) {
    const from = s ? (i ? GROUND_R : GROUND_L) : i ? FIST_R : FIST_L;
    mix3(rig.fist[i]!, from, i ? OVERHEAD_R : OVERHEAD_L, up);
  }
  rig.shake = t > 0.7 ? 0.025 : 0;
}
function slamStrike(t: number): void {
  const k = easeInQuad(clamp01(t));
  rig.lean = lerp(-0.2, 0.45, k);
  rig.headTilt = lerp(-0.2, 0.15, k);
  rig.reach = 1;
  mix3(rig.fist[0], OVERHEAD_L, GROUND_L, k);
  mix3(rig.fist[1], OVERHEAD_R, GROUND_R, k);
  rig.drop = -0.15 * k;
}
/** Fists stay buried for 55 % of the recovery (the punish window), then heave back. */
function slamRecover(t: number, time: number): void {
  const pull = easeInOut(clamp01((t - 0.55) / 0.45));
  const tug = t < 0.55 ? 0.03 * Math.sin(time * 26) * clamp01((t - 0.2) * 4) : 0;
  rig.lean = lerp(0.45, rig.lean, pull);
  rig.headTilt = lerp(0.15, 0, pull);
  rig.drop = lerp(-0.15, rig.drop, pull);
  mix3(tmpA, GROUND_L, rig.fist[0], pull);
  mix3(tmpB, GROUND_R, rig.fist[1], pull);
  set3(rig.fist[0], tmpA[0]! + tug, tmpA[1]!, tmpA[2]!);
  set3(rig.fist[1], tmpB[0]! - tug, tmpB[1]!, tmpB[2]!);
  rig.reach = 1 - pull;
}

const SWEEP_R = 2.6, SWEEP_A0 = (-130 * Math.PI) / 180, SWEEP_A1 = (70 * Math.PI) / 180;
function sweepAt(a: number, out: Float64Array): void {
  set3(out, Math.sin(a) * SWEEP_R, 1.05, Math.cos(a) * SWEEP_R);
}
function sweepWindup(t: number): void {
  const ant = clamp01(t / 0.15);
  const k = easeOutCubic(clamp01((t - 0.1) / 0.75));
  rig.lean = -0.08 * ant;
  rig.twist = -0.6 * k;
  sweepAt(SWEEP_A0, tmpA);
  mix3(rig.fist[1], FIST_R, tmpA, k);
  rig.fist[0][1] = FIST_L[1] + 0.5 * k;
  rig.reach = k;
}
function sweepStrike(t: number): void {
  const k = easeOutCubic(clamp01(t));
  rig.twist = lerp(-0.6, 0.7, k);
  rig.lean = 0.12 * k;
  sweepAt(lerp(SWEEP_A0, SWEEP_A1, k), rig.fist[1]);
  rig.fist[0][1] = FIST_L[1] + 0.5;
  rig.reach = 1;
}
function sweepRecover(t: number): void {
  const k = easeInOut(clamp01(t));
  rig.twist = lerp(0.7, 0, k);
  rig.lean = lerp(0.12, rig.lean, k);
  sweepAt(SWEEP_A1, tmpA);
  mix3(rig.fist[1], tmpA, FIST_R, k);
  rig.fist[0][1] = lerp(FIST_L[1] + 0.5, FIST_L[1], k);
  rig.reach = 1 - k;
}

const TOSS_GRIP_L = [0.45, 3.3, -0.5], TOSS_GRIP_R = [-0.45, 3.3, -0.5], TOSS_HELD = [0, 3.8, -0.25];
const TOSS_FOLLOW_L = [0.6, 2.2, 1.5], TOSS_FOLLOW_R = [-0.6, 2.2, 1.5];
function tossWindup(t: number): void {
  const ant = clamp01(t / 0.15);
  const grab = easeOutCubic(clamp01((t - 0.05) / 0.45));
  const lift = easeOutCubic(clamp01((t - 0.45) / 0.4));
  rig.lean = -0.06 * ant - 0.22 * lift;
  rig.headTilt = -0.15 * lift;
  mix3(rig.fist[0], FIST_L, TOSS_GRIP_L, grab);
  mix3(rig.fist[1], FIST_R, TOSS_GRIP_R, grab);
  rig.fist[0][1] = rig.fist[0][1]! + 0.5 * lift;
  rig.fist[1][1] = rig.fist[1][1]! + 0.5 * lift;
  mix3(rig.back, BACK, TOSS_HELD, lift);
  rig.reach = grab;
  rig.shake = t > 0.75 ? 0.02 : 0;
}
function tossStrike(f: number, frames: number): void {
  // The throw happens in the first 8 frames; then the body eases back while the boulder flies.
  const k = easeOutCubic(clamp01(f / 8));
  const back = easeInOut(clamp01((f - 10) / Math.max(1, frames - 10)));
  rig.lean = lerp(lerp(-0.22, 0.28, k), 0, back);
  mix3(tmpA, TOSS_GRIP_L, TOSS_FOLLOW_L, k);
  mix3(tmpB, TOSS_GRIP_R, TOSS_FOLLOW_R, k);
  mix3(rig.fist[0], tmpA, FIST_L, back);
  mix3(rig.fist[1], tmpB, FIST_R, back);
  rig.backScale = 0; // the boulder is in the air (the view draws it)
  rig.reach = 1 - back;
}

function kneel(k: number): void {
  rig.drop = lerp(rig.drop, -0.5, k);
  rig.lean = lerp(rig.lean, 0.3, k);
  rig.headTilt = lerp(rig.headTilt, 0.28, k);
  set3(tmpA, 1.65, 0.38, 0.75);
  mix3(rig.fist[0], rig.fist[0], tmpA, k);
  set3(tmpA, -1.65, 0.38, 0.75);
  mix3(rig.fist[1], rig.fist[1], tmpA, k);
}
function roar(k: number, time: number): void {
  rig.headTilt = lerp(rig.headTilt, -0.35, k);
  rig.lean = lerp(rig.lean, -0.18, k);
  set3(tmpA, 2.3, 1.75, 0.45);
  mix3(rig.fist[0], rig.fist[0], tmpA, k);
  set3(tmpA, -2.3, 1.75, 0.45);
  mix3(rig.fist[1], rig.fist[1], tmpA, k);
  rig.shake = 0.035 * k;
  rig.reach = k;
  void time;
}
function walk(f: number): void {
  const c = (f / 66) * Math.PI * 2;
  const sl = Math.sin(c), cl = Math.cos(c);
  rig.foot[0][1] = rig.foot[0][1]! + Math.max(0, sl) * 0.22;
  rig.foot[0][2] = rig.foot[0][2]! + cl * 0.32;
  rig.foot[1][1] = rig.foot[1][1]! + Math.max(0, -sl) * 0.22;
  rig.foot[1][2] = rig.foot[1][2]! - cl * 0.32;
  rig.drop += -0.05 * Math.abs(sl);
  rig.twist += 0.06 * cl;
  rig.fist[0][2] = rig.fist[0][2]! - cl * 0.35;
  rig.fist[1][2] = rig.fist[1][2]! + cl * 0.35;
}

/** Rotate (x, y, z) about the pelvis pivot by lean (x-axis) then twist (y-axis); writes o[0..2]. */
function body(x: number, y: number, z: number, lean: number, twist: number, o: Float64Array): void {
  const py = 1.1;
  const yy = y - py;
  const cl = Math.cos(lean), sl = Math.sin(lean);
  const y1 = yy * cl - z * sl, z1 = yy * sl + z * cl;
  const ct = Math.cos(twist), st = Math.sin(twist);
  o[0] = x * ct + z1 * st;
  o[1] = y1 + py;
  o[2] = -x * st + z1 * ct;
}

/** Where each part lies in the dormant mound (golem-local). */
export function moundOf(i: number, out: Float64Array): Float64Array {
  const p = PARTS[i]!;
  const a = p.order * 2.39996 + 0.6;
  const r = p.order < 5 ? 0.3 + 0.35 * hash(i, 1) : 0.55 + 0.75 * hash(i, 2);
  out[0] = Math.sin(a) * r;
  out[2] = Math.cos(a) * r - 0.1;
  out[1] = p.size[1] * 0.78 + (p.order > 9 ? 0.35 : 0) + (p.order === 13 ? 0.35 : 0);
  return out;
}

const o = new Float64Array(3);
const mound = new Float64Array(3);

/** Fill `out` with every part's golem-local transform. `tf` = fractional actionFrame (actionFrame − 1 + alpha). */
export function computePose(g: Readonly<GolemState>, tf: number, time: number, out: Float32Array): Rig {
  const x = gx(g as GolemState);
  rest(time);
  const a = g.action;
  const atk = g.attack;
  const wl = Math.max(1, x.windupLen);
  if (a === 'walk') walk(tf);
  else if (a === 'windup' && (atk === 'slam' || atk === 'doubleSlam')) slamWindup(tf / wl, atk === 'doubleSlam' && x.slamIndex === 1);
  else if (a === 'strike' && (atk === 'slam' || atk === 'doubleSlam')) slamStrike(tf / GOLEM.attacks.slam.strike);
  else if (a === 'recover' && (atk === 'slam' || atk === 'doubleSlam')) slamRecover(tf / Math.max(1, x.recoverLen), time);
  else if (a === 'windup' && atk === 'sweep') sweepWindup(tf / wl);
  else if (a === 'strike' && atk === 'sweep') sweepStrike(tf / GOLEM.attacks.sweep.strike);
  else if (a === 'recover' && atk === 'sweep') sweepRecover(tf / Math.max(1, x.recoverLen));
  else if (a === 'windup' && atk === 'toss') tossWindup(tf / wl);
  else if (a === 'strike' && atk === 'toss') tossStrike(tf, GOLEM.attacks.toss.strike);
  else if (a === 'recover' && atk === 'toss') {
    rig.backScale = easeOutBack(clamp01(tf / Math.max(1, x.recoverLen) * 1.4));
  } else if (a === 'stagger') {
    const k = Math.min(easeOutCubic(clamp01(tf / 10)), easeInOut(clamp01((GOLEM.staggerFrames - tf) / 18)));
    kneel(k);
  }
  if (g.enraged && x.roar > 0 && a === 'idle') {
    const done = GOLEM.roarFrames - x.roar;
    roar(Math.min(easeOutCubic(clamp01(done / 10)), clamp01(x.roar / 12)), time);
  }

  const assembling = a === 'dormant' || a === 'wake';
  const wakeT = a === 'wake' ? clamp01(tf / wakeLength(g as GolemState)) : 0;
  const shakeT = time * 57;
  for (let i = 0; i < PART_COUNT; i++) {
    const p = PARTS[i]!;
    const r = p.rest;
    const k = i * POSE_STRIDE;
    let px = r[0], py = r[1], pz = r[2], rx = 0, ry = 0, rz = 0, sc = 1;
    if (p.role === 'foot') {
      const f = rig.foot[p.side > 0 ? 0 : 1];
      px = f[0]!;
      py = f[1]!;
      pz = f[2]!;
    } else if (p.role === 'thigh') {
      const f = rig.foot[p.side > 0 ? 0 : 1];
      px = r[0];
      py = r[1] + rig.drop * 0.6 + (f[1]! - FOOT_L[1]) * 0.5;
      pz = r[2] + (f[2]! - FOOT_L[2]) * 0.45 + (rig.drop < -0.2 ? -rig.drop * 0.7 : 0);
    } else if (p.role === 'pelvis') {
      py = r[1] + rig.drop;
      ry = rig.twist * 0.4;
    } else if (p.role === 'fist') {
      const f = rig.fist[p.side > 0 ? 0 : 1];
      px = f[0]!;
      py = f[1]!;
      pz = f[2]!;
      rx = rig.lean * 0.5;
      rz = p.side * 0.1;
    } else if (p.role === 'arm') {
      // Between the (leaned) shoulder and the fist, pushed a little outward: the arm stays "connected".
      const sh = PARTS[p.side > 0 ? 11 : 12]!.rest;
      body(sh[0], sh[1] + rig.drop, sh[2], rig.lean, rig.twist, o);
      const f = rig.fist[p.side > 0 ? 0 : 1];
      px = lerp(o[0]!, f[0]!, 0.48) + p.side * 0.16;
      py = lerp(o[1]!, f[1]!, 0.48);
      pz = lerp(o[2]!, f[2]!, 0.48);
      rx = rig.lean * 0.6;
    } else if (p.role === 'back') {
      if (rig.back[1]! > BACK[1] + 0.01) {
        px = rig.back[0]!;
        py = rig.back[1]!;
        pz = rig.back[2]!;
      } else {
        body(r[0], r[1] + rig.drop, r[2], rig.lean, rig.twist, o);
        px = o[0]!;
        py = o[1]!;
        pz = o[2]!;
      }
      sc = rig.backScale;
    } else {
      // torso, head, shoulders ride the lean/twist about the pelvis.
      body(r[0], r[1] + rig.drop, r[2], rig.lean, rig.twist, o);
      px = o[0]!;
      py = o[1]!;
      pz = o[2]!;
      rx = rig.lean;
      ry = rig.twist;
      if (p.role === 'head') {
        rx += rig.headTilt;
        py += 0.08; // floats a hand's breadth above the torso
      }
    }
    // Out-of-phase bob (0.03–0.06 m, 1.6–2.4 s) + a small wobble: held together by magic.
    const amp = 0.03 + 0.03 * hash(i, 3);
    const per = 1.6 + 0.8 * hash(i, 4);
    const ph = hash(i, 5) * Math.PI * 2;
    const w = (time * Math.PI * 2) / per + ph;
    if (p.role !== 'foot') py += amp * Math.sin(w);
    rx += 0.035 * Math.sin(w * 0.7 + 1.3);
    rz += 0.035 * Math.sin(w * 0.9 + 0.4);
    if (rig.shake > 0) {
      px += rig.shake * Math.sin(shakeT + i * 1.7);
      py += rig.shake * 0.6 * Math.sin(shakeT * 1.3 + i * 2.9);
    }
    if (assembling) {
      // Assembly: each part lifts out of the mound bottom → top, spins and snaps in (easeOutBack).
      moundOf(i, mound);
      const start = (p.order / PART_COUNT) * 0.55;
      const u = clamp01((wakeT - start) / 0.4);
      const e = easeOutBack(u);
      const spin = (1 - easeOutCubic(u)) * (1.5 + hash(i, 6) * 2.5);
      const lift = Math.sin(Math.PI * clamp01(u)) * 0.7;
      px = lerp(mound[0]!, px, e);
      py = lerp(mound[1]!, py, e) + lift;
      pz = lerp(mound[2]!, pz, e);
      rx = lerp(hash(i, 7) * 2 - 1, rx, e) + spin * 0.3;
      ry = lerp(hash(i, 8) * 6, ry, e) + spin;
      rz = lerp(hash(i, 9) * 2 - 1, rz, e);
    }
    out[k] = px;
    out[k + 1] = py;
    out[k + 2] = pz;
    out[k + 3] = rx;
    out[k + 4] = ry;
    out[k + 5] = rz;
    out[k + 6] = sc;
  }
  return rig;
}

/** 0..1 progress of the assembly for rune ignition (1 once awake). */
export function assembly(g: Readonly<GolemState>, tf: number): number {
  if (g.action === 'dormant') return 0;
  if (g.action === 'wake') return clamp01(tf / wakeLength(g as GolemState));
  return 1;
}
