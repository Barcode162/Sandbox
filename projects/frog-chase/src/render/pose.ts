/**
 * Pose maths (§4.2 tells, §4.4 timing, §6 feel). Pure: from SimState, tick + alpha and clocks to numbers.
 * The renderer draws these; unit tests assert them (tests/unit/render/pose.test.ts).
 *
 * Clocks: `simT` = sim.tick + alpha (ticks, interpolated). `ambientS` = ambient seconds (50% under reduced
 * motion). `tellS` = full-speed seconds for gameplay tells (never slowed, §10).
 */
import type { Pad, PadRuntime, SimState, Tuning, Vec2 } from '../contracts';
import { TICK_HZ, ticks } from '../tuning';
import { EASE_AIR, EASE_FALL, EASE_UI, clamp01, lerp, smooth } from './ease';
import { rand3 } from './noise';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ───────────── pads ─────────────

/** §4.1 sway: x += 1.6·sin(2πt/2.8 + φ). Banks never sway. */
export function padSwayX(pad: Pad, ambientS: number): number {
  return pad.kind === 'bank' ? 0 : 1.6 * Math.sin((TAU * ambientS) / 2.8 + pad.phase);
}

/** §4.1 bob: scale = 1 + 0.015·sin(2πt/2.1 + φ). */
export function padBob(pad: Pad, ambientS: number): number {
  return 1 + 0.015 * Math.sin((TAU * ambientS) / 2.1 + pad.phase);
}

/** §4.2 curl rocking: ±4° about the fold axis, 900 ms period (never the 2.1 s bob or 2.8 s sway: polish 5). */
export const CURL_ROCK_PERIOD_S = 0.9;
export const CURL_ROCK_DEG = 4;
export function curlRock(pad: Pad, tellS: number): number {
  return CURL_ROCK_DEG * DEG * Math.sin((TAU * tellS) / CURL_ROCK_PERIOD_S + pad.phase);
}

export interface PadLook {
  /** Sway offset, wu. */
  dx: number;
  scale: number;
  /** Extra in-plane rotation (curl rocking), radians. */
  rock: number;
  /** Cut-paper height in wu (shadow offset = (0.35, 0.45) × height). 0 = sits low. */
  height: number;
  /** Curl tilt progress 0..1 (25° lift of the fold edge) and flip scale across the fold axis (1 → −1). */
  tilt: number;
  flip: number;
  /** Soggy sink 0..1 (pad goes under). */
  sink: number;
  /** 0..1 how far the pad's surface has gone dark (sunk/under). */
  under: number;
}

export function createPadLook(): PadLook {
  return { dx: 0, scale: 1, rock: 0, height: 0, tilt: 0, flip: 1, sink: 0, under: 0 };
}

const msSince = (simT: number, tick: number) => ((simT - tick) * 1000) / TICK_HZ;

/** §6: dip to 0.94 and recover over 180 ms; the curve shared by pad scale and shadow (to 0.6×). */
export function dipCurve(ageMs: number): number {
  if (ageMs < 0 || ageMs >= 180) return 0;
  if (ageMs < 36) return EASE_UI(ageMs / 36);
  return 1 - EASE_UI((ageMs - 36) / 144);
}

/**
 * Visual state of one pad. `dipAgeMs` = ms since the frog last landed on it (Infinity if never).
 * Writes into `out` (no allocation).
 */
export function padLook(pad: Pad, rt: PadRuntime, t: Tuning, simT: number, ambientS: number, tellS: number, dipAgeMs: number, out: PadLook): PadLook {
  out.dx = padSwayX(pad, ambientS);
  out.scale = padBob(pad, ambientS);
  out.rock = 0;
  out.tilt = 0;
  out.flip = 1;
  out.sink = 0;
  out.under = 0;
  out.height = pad.kind === 'soggy' ? 0 : 0.45 * pad.r;
  const dip = dipCurve(dipAgeMs);
  out.scale *= 1 - 0.06 * dip;
  out.height *= 1 - 0.4 * dip;
  if (pad.kind === 'curl') {
    if (rt.state === 'flipping' || rt.state === 'sunk') {
      const e = msSince(simT, rt.since);
      const tiltMs = t.curlTiltMs, flipMs = t.curlFlipMs;
      const settled = rt.state === 'sunk';
      out.tilt = settled ? 1 : EASE_UI(clamp01(e / tiltMs));
      const fu = settled ? 1 : clamp01((e - tiltMs) / flipMs);
      out.flip = Math.cos(Math.PI * smooth(fu));
      out.height = lerp(0.45 * pad.r, 0.15 * pad.r, fu) * (1 + 0.6 * out.tilt * (1 - fu));
    } else {
      out.rock = curlRock(pad, tellS);
    }
  } else if (pad.kind === 'soggy' && (rt.state === 'sinking' || rt.state === 'sunk')) {
    const p = rt.state === 'sunk' ? 1 : EASE_FALL(clamp01(msSince(simT, rt.since) / t.soggySinkMs));
    out.sink = p;
    out.scale *= 1 - 0.22 * p;
    out.under = p;
  }
  return out;
}

/**
 * §4.2 soggy moving tell: a pair of bubbles, 420 ms period, the second offset by half a period, each visible
 * (grown past 10%) for ≥ 72% of its cycle, so at least one is always visible (polish 4).
 */
export const BUBBLE_PERIOD_S = 0.42;
export interface Bubble {
  /** Angle around the rim, radians (world frame). */
  angle: number;
  /** Distance from the centre as a fraction of r, plus how far it has risen outward (wu, 0 → 4). */
  dist: number;
  rise: number;
  /** Disc scale 0..1 (0 = not visible) and pop-ring progress 0..1 (0 = no ring). */
  scale: number;
  pop: number;
}

export function bubbleAt(pad: Pad, i: 0 | 1, tellS: number, out: Bubble): Bubble {
  const cyc = tellS / BUBBLE_PERIOD_S + pad.phase / TAU + i * 0.5;
  const n = Math.floor(cyc);
  const u = cyc - n;
  out.angle = pad.rot + Math.PI + (rand3(pad.id, n, i) - 0.5) * 2.4 + i * 0.9;
  out.dist = 0.9;
  out.rise = 4 * EASE_UI(Math.min(1, u / 0.75));
  if (u < 0.75) {
    out.scale = EASE_UI(Math.min(1, u / 0.3 + 0.12));
    out.pop = 0;
  } else {
    out.scale = 0;
    out.pop = (u - 0.75) / 0.25;
  }
  return out;
}

// ───────────── frog ─────────────

export interface FrogPose {
  x: number;
  y: number;
  /** Height above the surface, wu (shadow offset uses 3 + h on a pad). */
  h: number;
  /** Shadow height (wu) and alpha. */
  shadowH: number;
  shadowA: number;
  /** Uniform scale (air 1 + 0.025h; sinking → 0.7) and the across/along deformation. */
  scale: number;
  across: number;
  along: number;
  /** Body facing (world radians, 0 = east, π/2 = north). */
  facing: number;
  /** Hind legs: 0 folded, 1 open V. */
  legs: number;
  /** World point the eyes look at. */
  lookX: number;
  lookY: number;
  /** 0..1 how far the frog has gone under the water (sink tint). */
  under: number;
  /** Where the frog is in its hop: 'ground' | 'squash' | 'air' | 'fall' (for juice and tests). */
  stage: 'ground' | 'squash' | 'air' | 'fall';
}

export function createFrogPose(): FrogPose {
  return { x: 50, y: 0, h: 0, shadowH: 3, shadowA: 0.38, scale: 1, across: 1, along: 1, facing: Math.PI / 2, legs: 0, lookX: 50, lookY: 26, under: 0, stage: 'ground' };
}

/** On-pad base height (§5.2: frog on pad 3 wu). */
export const FROG_BASE_H = 3;
/** §6 air: h = 12·sin(πu). */
export const HOP_PEAK = 12;

/** Impact + settle deformation (§6 land): 1 during the 40 ms impact, then a 120 ms settle with one ≈4% overshoot. */
export function landDeform(ageMs: number): number {
  if (ageMs < 0) return 0;
  if (ageMs < 40) return 1;
  const u = (ageMs - 40) / 120;
  if (u >= 1) return 0;
  const c = Math.cos(1.5 * Math.PI * u) * (1 - u);
  return c < 0 ? c * 0.84 : c;
}

/** Visual (swayed) centre of a pad. Supplied by the renderer so the frog rides its pad's sway. */
export type PadPos = (id: number, out: Vec2) => Vec2;

const tmpA: Vec2 = { x: 0, y: 0 };
const tmpB: Vec2 = { x: 0, y: 0 };

/**
 * The frog's pose. Pure in (sim, simT, pos); timing from §4.4 via tuning, so retuned runs stay in step.
 * Polish 1: on the tick a hop starts the squash is already ≥ 50% (visible on the same rendered frame).
 */
export function frogPose(sim: SimState, simT: number, pos: PadPos, out: FrogPose): FrogPose {
  const f = sim.frog;
  const t = sim.tuning;
  const sqT = ticks(t.squashMs);
  const airT = ticks(t.airMs);
  pos(f.padId, tmpA);
  out.x = tmpA.x;
  out.y = tmpA.y;
  out.h = 0;
  out.scale = 1;
  out.across = 1;
  out.along = 1;
  out.legs = 0;
  out.under = 0;
  out.stage = 'ground';
  out.facing = restFacing(sim);
  // Eyes: the target while hopping, else the forward choice (polish 6).
  const lookId = f.phase === 'squash' || f.phase === 'air' ? f.targetId : forwardChoice(sim);
  if (lookId !== null && lookId !== f.padId) {
    pos(lookId, tmpB);
    out.lookX = tmpB.x;
    out.lookY = tmpB.y;
  } else {
    out.lookX = out.x + Math.cos(out.facing) * 20;
    out.lookY = out.y + Math.sin(out.facing) * 20;
  }

  if (f.phase === 'squash' || f.phase === 'air') {
    pos(f.targetId, tmpB);
    const dx = tmpB.x - tmpA.x, dy = tmpB.y - tmpA.y;
    out.facing = Math.atan2(dy, dx);
    const e = simT - f.hopTick;
    if (e < sqT) {
      // Squash: 1.18 across / 0.82 along, body already turned to the target (instant, §6).
      out.stage = 'squash';
      const a = 0.5 + 0.5 * smooth(e / (sqT * 0.4));
      out.across = 1 + 0.18 * a;
      out.along = 1 - 0.18 * a;
    } else {
      out.stage = 'air';
      const u = clamp01((e - sqT) / airT);
      const p = EASE_AIR(u);
      out.x = lerp(tmpA.x, tmpB.x, p);
      out.y = lerp(tmpA.y, tmpB.y, p);
      out.h = HOP_PEAK * Math.sin(Math.PI * u);
      out.scale = 1 + 0.025 * out.h;
      // Stretch along the hop at takeoff, easing out by the apex.
      const st = Math.max(0, 1 - u / 0.35);
      out.along = 1 + 0.12 * st;
      out.across = 1 - 0.08 * st;
      out.legs = smooth(u / 0.12) * (u < 0.7 ? 1 : 1 - smooth((u - 0.7) / 0.3));
    }
  } else if (f.landTick >= 0 && (f.phase === 'idle' || f.phase === 'won')) {
    const age = ((simT - f.landTick) * 1000) / TICK_HZ;
    const d = landDeform(age);
    out.across = 1 - 0.14 * d;
    out.along = 1 + 0.14 * d;
  }

  const hopping = f.phase === 'squash' || f.phase === 'air';
  const here = sim.river.pads[f.padId]!;
  const rt = sim.padStates[f.padId]!;
  if (!hopping && here.kind === 'soggy' && (rt.state === 'sinking' || rt.state === 'sunk')) {
    // Sinks with the pad, shrinking to 0.7 (§6 soggy landing).
    const p = rt.state === 'sunk' ? 1 : EASE_FALL(clamp01(msSince(simT, rt.since) / t.soggySinkMs));
    out.scale *= 1 - 0.3 * p;
    out.under = p;
    out.stage = 'fall';
  } else if (!hopping && here.kind === 'curl' && (rt.state === 'flipping' || rt.state === 'sunk' || f.phase === 'flung')) {
    // The pad tilts for curlTiltMs, then flips and throws the frog 10 wu outward across the fold axis,
    // where it splashes and goes under over 300 ms (§6 curl landing, water fall).
    const flipAt = rt.since + (ticks(t.curlTiltMs) * (rt.state === 'flipping' || rt.state === 'sunk' ? 1 : 0));
    const e = rt.state === 'flipping' || rt.state === 'sunk' ? msSince(simT, flipAt) : msSince(simT, f.since);
    const u = clamp01(e / 300);
    const dir = here.rot + Math.PI; // away from the lifting fold edge (local +x)
    const reach = here.r * 0.3 + (here.r + 10) * EASE_UI(u);
    out.x = tmpA.x + Math.cos(dir) * reach;
    out.y = tmpA.y + Math.sin(dir) * reach;
    out.h = e < 0 ? 0 : 9 * Math.sin(Math.PI * u);
    out.scale = 1 + 0.025 * out.h;
    out.legs = e > 0 && u < 1 ? 1 : 0;
    out.facing += 5 * EASE_UI(u);
    out.under = EASE_FALL(clamp01((e - 300) / 300));
    out.stage = e < 0 ? 'ground' : u < 1 ? 'air' : 'fall';
    if (e < 0) {
      // Tilt: the frog slides toward the lifting edge.
      const tu = clamp01(msSince(simT, rt.since) / t.curlTiltMs);
      out.x = tmpA.x + Math.cos(dir) * here.r * 0.3 * tu;
      out.y = tmpA.y + Math.sin(dir) * here.r * 0.3 * tu;
    }
  }

  out.shadowH = FROG_BASE_H + out.h;
  out.shadowA = 0.38 - 0.16 * (out.h / HOP_PEAK);
  return out;
}

/** Facing while standing: the direction of the last hop, or north before hop 1 (§7.1). */
function restFacing(sim: SimState): number {
  const tr = sim.trail;
  if (tr.length < 2) return Math.PI / 2;
  const a = tr[tr.length - 2]!, b = tr[tr.length - 1]!;
  if (a.x === b.x && a.y === b.y) return Math.PI / 2;
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/** The pad that answers ↑ right now (eyes rest on it, the title invite ring circles it), or null. */
export function forwardChoice(sim: SimState): number | null {
  for (const c of sim.choices) if (c.slot === 'F' || c.alsoAnswers.includes('F')) return c.padId;
  return null;
}
