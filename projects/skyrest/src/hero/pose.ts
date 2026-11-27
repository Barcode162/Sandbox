// src/hero/pose.ts — owned by WO-003. The hero's whole animation as a pure function of (action, action time):
// the model AND the slash trail both read it, so the trail is exact at any instant (manual stepping, hit-stop
// freezes, slow-mo) and never depends on how many frames were rendered. No three/DOM.
//
// Rig space: +z = hero forward, +x = hero's LEFT, y up, feet at 0. Hierarchy: root → (hop) → pivot at PIVOT_Y
// (lean = rot x, twist = rot y, roll = rot z, Euler 'YXZ') → hips at HIPS_Y (relative to the pivot).
import type { HeroAction } from '../contracts.ts';
import { HERO } from '../tuning/hero.ts';

export const PIVOT_Y = 0.56;
export const HIPS_Y = 0.36;
export const SHOULDER_R = { x: -0.17, y: 0.33, z: 0.0 } as const; // hips space
export const ARM_LEN = 0.27;
export const BLADE_LEN = 1.04; // grip → tip (0.14 grip + 0.9 blade)
/** Swing centre (hips space) for the trail's 1.3× tip radius. */
export const SWING_C = { x: -0.05, y: 0.3, z: 0.0 } as const;

export interface Pose {
  hop: number; lean: number; twist: number; roll: number; bob: number; squash: number;
  headYaw: number; headPitch: number; legL: number; legR: number; armLx: number; armLz: number;
  /** Desired grip (hips space); the arm clamps it to its reach. */
  gx: number; gy: number; gz: number;
  /** Blade direction (hips space, unit). */
  dx: number; dy: number; dz: number;
  /** Extra cape lift (rad) for leaps/rolls. */
  cape: number;
  /** 0..1: this instant is inside a sweep (the trail draws only these samples). */
  sweep: number;
}

export function newPose(): Pose {
  return { hop: 0, lean: 0, twist: 0, roll: 0, bob: 0, squash: 1, headYaw: 0, headPitch: 0, legL: 0, legR: 0, armLx: 0, armLz: 0.25, gx: 0, gy: 0, gz: 0, dx: 0, dy: 1, dz: 0, cape: 0, sweep: 0 };
}

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const DEG = Math.PI / 180;
const CHOP_CANT = 35 * DEG;

/** Inputs besides the action clock (all plain numbers so callers never allocate). */
export interface PoseCtx {
  /** Ambient seconds (breath, sway). */
  time: number;
  /** Run cycle phase source: metres travelled. */
  stride: number;
  /** 0..1 horizontal speed / run speed. */
  speed: number;
  /** Frames idle (sword-to-shoulder after 6 s). */
  idleFrames: number;
  /** Head yaw toward the temple (rad, rig space), used by the idle flourish. */
  gazeYaw: number;
  /** 1 if the current roll goes backward. */
  rollBack: number;
}

function rest(p: Pose, c: PoseCtx): void {
  p.hop = 0; p.lean = 0; p.twist = 0; p.roll = 0; p.bob = 0; p.cape = 0; p.sweep = 0;
  p.squash = 1 + 0.02 * Math.sin(c.time * Math.PI); // breath, 0.5 Hz
  p.headYaw = 0; p.headPitch = 0; p.legL = 0.06; p.legR = -0.06; p.armLx = 0.1; p.armLz = 0.28;
  // Ready stance: sword out to the right-front, blade angled forward and a little up (the reference read).
  setGrip(p, -0.3, 0.12, 0.16);
  setDir(p, -0.42, 0.28, 0.86);
  // After 6 s idle: sword to the shoulder, gaze at the temple.
  const k = easeInOut(clamp01((c.idleFrames - 360) / 40));
  if (k > 0) {
    blendGrip(p, -0.2, 0.3, 0.08, k);
    blendDir(p, 0.15, 0.75, -0.65, k);
    p.headYaw += c.gazeYaw * k;
    p.headPitch -= 0.12 * k;
  }
}

function setGrip(p: Pose, x: number, y: number, z: number): void {
  p.gx = x; p.gy = y; p.gz = z;
}
function setDir(p: Pose, x: number, y: number, z: number): void {
  const l = Math.hypot(x, y, z) || 1;
  p.dx = x / l; p.dy = y / l; p.dz = z / l;
}
function blendGrip(p: Pose, x: number, y: number, z: number, k: number): void {
  p.gx += (x - p.gx) * k; p.gy += (y - p.gy) * k; p.gz += (z - p.gz) * k;
}
function blendDir(p: Pose, x: number, y: number, z: number, k: number): void {
  setDir(p, p.dx + (x - p.dx) * k, p.dy + (y - p.dy) * k, p.dz + (z - p.dz) * k);
}

/** Horizontal arc around the shoulders: angle a (0 = forward, + = toward the hero's left), tilted by `tilt`
 *  (blade rises toward the hero's right when tilt > 0). */
function arc(p: Pose, a: number, tilt: number, drop: number): void {
  const sx = Math.sin(a), cz = Math.cos(a);
  const y = -sx * tilt - drop;
  setGrip(p, SWING_C.x + sx * 0.36, SWING_C.y + y * 0.36, SWING_C.z + cz * 0.36);
  setDir(p, sx, y, cz);
}

/** One combo swing. t = frames into the action (float). */
function swing(p: Pose, c: PoseCtx, i: number, t: number): void {
  const h = HERO.combo[i]!;
  const S = h.startup, A = h.active, R = h.recovery;
  rest(p, c);
  p.squash = 1;
  if (i < 2) {
    // 1: slash R→L (a: right-back → left); 2: backslash L→R rising (mirror).
    const dir = i === 0 ? 1 : -1;
    // Diagonal planes so the crescent reads from behind-above: 1 falls from high-right to low-left,
    // 2 rises from low-left to high-right (the reference's arc).
    const a0 = -105 * DEG * dir, a1 = 95 * DEG * dir;
    const tilt = i === 0 ? 0.85 : -0.95;
    const w0 = S * 0.45; // sweep starts here; the blade crosses the front just as the hitbox opens
    let a: number;
    if (t < w0) a = a0 * easeOut(t / w0);
    else if (t < S + A) a = a0 + (a1 - a0) * easeOut((t - w0) / (S + A - w0));
    else a = a1;
    const back = clamp01((t - (S + A + R * 0.35)) / (R * 0.65));
    arc(p, a, tilt, 0.08);
    if (back > 0) {
      blendGrip(p, -0.3, 0.12, 0.16, easeInOut(back));
      blendDir(p, -0.42, 0.28, 0.86, easeInOut(back));
    }
    p.sweep = t >= w0 && t <= S + A + 1 ? 1 : 0;
    p.twist = a * 0.32 * (1 - back);
    const lunge = t < S + A ? easeOut(t / (S + A)) : 1 - back;
    p.lean = 0.16 * lunge;
    p.legL = 0.45 * lunge; p.legR = -0.35 * lunge;
    p.armLx = -0.5 * lunge; p.armLz = 0.55 * lunge;
    p.headYaw = -p.twist * 0.6;
    p.cape = 0.25 * lunge;
  } else {
    // 3: leaping spin, then an overhead chop that ends in the ground (vertical crescent).
    const hopEnd = S + A;
    // Peak (0.35 m) exactly as the chop connects, then drop hard into the ground strike.
    p.hop = t < S ? h.hop * Math.sin((Math.PI / 2) * (t / S)) : t < hopEnd ? h.hop * (1 - Math.pow((t - S) / A, 2)) : 0;
    const spinEnd = S - 2;
    p.twist = t < spinEnd ? -2 * Math.PI * easeInOut(t / spinEnd) : 0;
    const w0 = S - 3;
    let b: number; // blade angle from straight up toward forward
    if (t < w0) b = -35 * DEG * easeOut(t / w0) - 10 * DEG;
    else if (t < S + A) b = -45 * DEG + 200 * DEG * easeOut((t - w0) / (S + A - w0));
    else b = 155 * DEG;
    const back = clamp01((t - (S + A + R * 0.45)) / (R * 0.55));
    // The chop plane is canted 35° toward the hero's right, so from behind it reads as a crescent, not a line.
    const sb = Math.sin(b), cb = Math.cos(b);
    const ux = -Math.sin(CHOP_CANT), uy = Math.cos(CHOP_CANT);
    setGrip(p, -0.1 + ux * cb * 0.3, 0.36 + uy * cb * 0.3, 0.04 + sb * 0.3);
    setDir(p, ux * cb, uy * cb, sb);
    if (back > 0) {
      blendGrip(p, -0.3, 0.12, 0.16, easeInOut(back));
      blendDir(p, -0.42, 0.28, 0.86, easeInOut(back));
    }
    p.sweep = t >= w0 && t <= S + A + 1 ? 1 : 0;
    const crouch = t >= S + A ? 1 - back : 0;
    p.lean = (t < S + A ? -0.1 + 0.45 * clamp01((t - w0) / (S + A - w0)) : 0.35) * (1 - back);
    p.bob = -0.1 * crouch;
    p.squash = t >= S + A && t < S + A + 4 ? 0.88 : 1;
    p.legL = t < hopEnd ? -0.7 * Math.sin(Math.PI * clamp01(t / hopEnd)) : 0.5 * crouch;
    p.legR = t < hopEnd ? -0.4 * Math.sin(Math.PI * clamp01(t / hopEnd)) : -0.5 * crouch;
    p.armLx = -1.2 * (1 - back); p.armLz = 0.2;
    p.cape = t < hopEnd ? 0.5 : 0.2 * crouch;
  }
}

function skill(p: Pose, c: PoseCtx, t: number): void {
  const k = HERO.skill;
  const end = k.startup + k.tickGap + 2;
  rest(p, c);
  const s = clamp01(t / end);
  p.twist = -2 * Math.PI * 1.25 * easeInOut(s);
  const back = clamp01((t - end - 4) / (k.recovery - 6));
  const out = 1 - easeInOut(back);
  // Blade held straight out to the right, level, sweeping the full circle with the spin.
  setGrip(p, -0.42 * out + -0.3 * (1 - out), 0.26 * out + 0.12 * (1 - out), 0.05 * out + 0.16 * (1 - out));
  setDir(p, -1 * out - 0.42 * (1 - out), -0.04 * out + 0.28 * (1 - out), 0.12 * out + 0.86 * (1 - out));
  p.sweep = t >= 2 && t <= end ? 1 : 0;
  p.lean = 0.12 * out;
  p.bob = -0.06 * out;
  p.armLx = 0; p.armLz = 1.1 * out + 0.28 * (1 - out);
  p.legL = 0.35 * out; p.legR = -0.35 * out;
  p.cape = 0.6 * out;
}

function dodge(p: Pose, c: PoseCtx, t: number): void {
  const n = HERO.dodge.frames;
  rest(p, c);
  const s = clamp01(t / n);
  const sign = c.rollBack ? -1 : 1;
  p.lean = sign * 2 * Math.PI * easeOut(clamp01((t - 1) / (n - 5)));
  // Squash 0.85 on take-off, stretch 1.15 over 60 ms, settle.
  p.squash = t < 2 ? 0.85 : t < 5 ? 1.15 - (t - 2) * 0.05 : 1;
  const tuck = Math.sin(Math.PI * clamp01((t - 1) / (n - 3)));
  p.bob = -0.18 * tuck;
  p.hop = 0.12 * tuck;
  p.legL = -1.3 * tuck; p.legR = -1.1 * tuck;
  p.armLx = -0.9 * tuck; p.armLz = 0.3;
  setGrip(p, -0.22, 0.1 + 0.05 * tuck, 0.12);
  setDir(p, -0.3, -0.2 * tuck + 0.3 * (1 - tuck), -0.9 * tuck + 0.85 * (1 - tuck));
  p.cape = 0;
  p.sweep = 0;
  p.headPitch = 0.3 * tuck;
  void s;
}

function hurt(p: Pose, c: PoseCtx, t: number): void {
  rest(p, c);
  const k = 1 - easeOut(clamp01(t / HERO.hurt.frames));
  p.lean = -0.38 * k;
  p.headPitch = -0.35 * k;
  p.armLx = -0.9 * k; p.armLz = 0.7 * k + 0.28;
  p.legL = 0.4 * k; p.legR = -0.2 * k;
  blendGrip(p, -0.34, 0.3, -0.05, k);
  blendDir(p, -0.5, 0.75, -0.2, k);
  p.cape = 0.4 * k;
}

function dead(p: Pose, c: PoseCtx, t: number): void {
  rest(p, c);
  const k = easeOut(clamp01(t / 36));
  p.bob = -0.2 * k;
  p.lean = 0.42 * k;
  p.headPitch = 0.45 * k;
  p.legL = -1.4 * k; p.legR = 0.9 * k;
  p.armLx = -0.3 * k;
  // Sword planted point-down in front-right.
  blendGrip(p, -0.25, 0.08, 0.32, k);
  blendDir(p, -0.1, -0.95, 0.25, k);
  p.squash = 1;
}

function victory(p: Pose, c: PoseCtx, t: number): void {
  rest(p, c);
  const k = easeOutBack(clamp01(t / 20));
  p.hop = t < 20 ? 0.18 * Math.sin(Math.PI * clamp01(t / 20)) : 0;
  blendGrip(p, -0.16, 0.62, 0.08, Math.min(1, k));
  blendDir(p, -0.08, 1, 0.12, Math.min(1, k));
  p.headPitch = -0.25 * Math.min(1, k);
  p.armLz = 0.5;
  p.armLx = -0.2;
  p.lean = -0.08;
}

function run(p: Pose, c: PoseCtx): void {
  rest(p, c);
  const ph = (c.stride / (2 * HERO.footstepM)) * 2 * Math.PI;
  const k = c.speed;
  const sn = Math.sin(ph);
  p.squash = 1;
  p.legL = sn * 0.75 * k;
  p.legR = -sn * 0.75 * k;
  p.bob = 0.04 * Math.abs(Math.cos(ph)) * k;
  p.lean = 6 * DEG * k + 0.05 * k;
  p.armLx = -sn * 0.7 * k;
  p.armLz = 0.25;
  p.twist = sn * 0.08 * k;
  // Sword trails back-right while running.
  blendGrip(p, -0.27, 0.06 + 0.03 * sn, -0.04, k);
  blendDir(p, -0.35, -0.3, -0.88, k);
  p.cape = 0;
}

/** Fill `p` for the hero action at float time `t` (frames since the action began). */
export function poseAt(action: HeroAction, t: number, c: PoseCtx, p: Pose): Pose {
  if (t < 0) t = 0;
  switch (action) {
    case 'attack1': swing(p, c, 0, t); break;
    case 'attack2': swing(p, c, 1, t); break;
    case 'attack3': swing(p, c, 2, t); break;
    case 'skill': skill(p, c, t); break;
    case 'dodge': dodge(p, c, t); break;
    case 'hurt': hurt(p, c, t); break;
    case 'dead': dead(p, c, t); break;
    case 'victory': victory(p, c, t); break;
    case 'run': run(p, c); break;
    default: rest(p, c);
  }
  return p;
}

/** Rig-space hilt + tip of the sword for a pose (same maths as the bone hierarchy). out = [hx,hy,hz, tx,ty,tz]. */
export function swordPoints(p: Pose, out: Float64Array | number[]): void {
  // Hand: shoulder + reach-clamped direction to the desired grip.
  let vx = p.gx - SHOULDER_R.x, vy = p.gy - SHOULDER_R.y, vz = p.gz - SHOULDER_R.z;
  const l = Math.hypot(vx, vy, vz) || 1;
  const r = Math.min(l, ARM_LEN) / l;
  vx = SHOULDER_R.x + vx * r; vy = SHOULDER_R.y + vy * r; vz = SHOULDER_R.z + vz * r;
  out[0] = vx; out[1] = vy; out[2] = vz;
  out[3] = vx + p.dx * BLADE_LEN; out[4] = vy + p.dy * BLADE_LEN; out[5] = vz + p.dz * BLADE_LEN;
  toRig(p, out, 0);
  toRig(p, out, 3);
}

/** Swing centre in rig space (for the trail's outer radius). */
export function swingCentre(p: Pose, out: Float64Array | number[]): void {
  out[0] = SWING_C.x; out[1] = SWING_C.y; out[2] = SWING_C.z;
  toRig(p, out, 0);
}

/** hips space → rig space: + (0, HIPS_Y - PIVOT_Y + bob), scale y by squash, rotate YXZ (twist, lean, roll), + pivot + hop. */
function toRig(p: Pose, o: Float64Array | number[], i: number): void {
  const sq = p.squash, sxz = 1 / Math.sqrt(sq);
  let x = o[i]! * sxz, y = (o[i + 1]! + HIPS_Y - PIVOT_Y + p.bob) * sq, z = o[i + 2]! * sxz;
  // Rz (roll)
  let c = Math.cos(p.roll), s = Math.sin(p.roll);
  let nx = x * c - y * s, ny = x * s + y * c;
  x = nx; y = ny;
  // Rx (lean): y → z
  c = Math.cos(p.lean); s = Math.sin(p.lean);
  ny = y * c - z * s;
  let nz = y * s + z * c;
  y = ny; z = nz;
  // Ry (twist)
  c = Math.cos(p.twist); s = Math.sin(p.twist);
  nx = x * c + z * s;
  nz = -x * s + z * c;
  o[i] = nx; o[i + 1] = y + PIVOT_Y + p.hop; o[i + 2] = nz;
}
