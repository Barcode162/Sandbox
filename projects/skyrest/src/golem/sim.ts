// src/golem/sim.ts — owned by WO-004. Stone Guardian AI (experience.md §5): assembles (wake), approaches, picks
// an in-range telegraphed attack (windup → strike → recover), owns the slam shockwave / toss-landing hazards,
// staggers on poise break, kindles into phase 2 at 50 % (roar, faster, double slam, calls the pebbles),
// and crumbles on death (hit-stop + slow-mo + coin burst). Pure: no three/DOM, no allocation in steady state
// beyond the events the contract pushes. FROZEN signatures: createGolem, stepGolem.
import type { GolemAttack, GolemState, HazardState, Intent, SimState } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { GOLEM, golemCoinsForWave, type GolemAttackTuning } from '../tuning/golem.ts';
import { STEP_S } from '../core/fixed-step.ts';
import { clamp, dirX, dirZ, dist, facingOf, turnToward, wrapAngle } from '../core/math.ts';
import { rand } from '../core/rng.ts';
import { hurtHero } from '../hero/sim.ts';
import { clampToArena, collideStatic } from '../core/collide.ts';

/** Attack ids by index (ext.lastAttack stores the index; -1 = none yet). */
export const ATTACKS: readonly GolemAttack[] = ['slam', 'sweep', 'toss', 'doubleSlam'];

/** ext keys (fixed at creation so steps never add properties). */
export type GolemExt = ReturnType<typeof golemExt>;
/** Typed view of the golem's private scratch. */
export const gx = (g: GolemState) => g.ext as GolemExt;

function golemExt() {
  return {
    /** 1 = this wave reforms (retry / next wave: the shorter 1.2 s assembly). */
    reform: 0,
    /** Index into ATTACKS of the last attack started, -1 none. */
    lastAttack: -1,
    /** Steps since the last hero hit (poise refill). */
    sinceHit: 0,
    /** hitsTaken last step (detects new hits without touching hero combat). */
    seenHits: 0,
    /** Steps the first attack still waits (cleared by the first player hit). */
    firstWait: GOLEM.firstAttackFrames as number,
    /** Double slam: 0 = first fist, 1 = second. */
    slamIndex: 0,
    /** Steps of the phase-2 roar remaining. */
    roar: 0,
    /** Set by the roar; the minion sim spawns the pebbles and clears it. */
    minionCall: 0,
    /** Sweep: already resolved its hit this strike. */
    struck: 0,
    /** Poise broke during a telegraph/strike; stagger when the attack ends. */
    staggerPending: 0,
    /** Toss: the boulder's launch point (for the view's arc) and flight length. */
    tossFromX: 0,
    tossFromZ: 0,
    /** The windup length actually used by the current attack (P2 is shorter). */
    windupLen: 0,
    recoverLen: 0,
  };
}

export function createGolem(): GolemState {
  const p = ARENA.golemSpawn;
  return {
    pos: { x: p.x, z: p.z }, prevPos: { x: p.x, z: p.z },
    facing: ARENA.golemSpawnFacing, prevFacing: ARENA.golemSpawnFacing,
    action: 'dormant', actionFrame: 0, attack: null,
    hp: GOLEM.maxHp, maxHp: GOLEM.maxHp, poise: GOLEM.maxPoise, maxPoise: GOLEM.maxPoise,
    glow: 0.15, hitFlash: 0, cooldown: GOLEM.cooldownFrames, hitsTaken: 0,
    enraged: false, target: { x: p.x, z: p.z }, ext: golemExt(),
  };
}

/** Skip the assembly (test hooks' skipTitle): the Guardian stands ready, the first-attack grace still runs. */
export function wakeInstantly(g: GolemState): void {
  if (g.action !== 'dormant' && g.action !== 'wake') return;
  set(g, 'idle');
  g.glow = 0.35;
}

/** Health fraction at which phase 2 begins for this wave. */
export const enrageThreshold = (wave: number) => (wave >= 2 ? GOLEM.enrageAtLaterWaves : GOLEM.enrageAt);
/** Assembly length for this golem. */
export const wakeLength = (g: GolemState) => (gx(g).reform ? GOLEM.reformFrames : GOLEM.wakeFrames);

function set(g: GolemState, a: GolemState['action']): void {
  g.action = a;
  g.actionFrame = 0;
}

const tuningOf = (a: GolemAttack | null): GolemAttackTuning => GOLEM.attacks[a ?? 'slam'];

/** Signed angle from the golem's facing to the hero (radians). */
function bearingToHero(s: SimState): number {
  const g = s.golem, h = s.hero;
  return wrapAngle(facingOf(h.pos.x - g.pos.x, h.pos.z - g.pos.z) - g.facing);
}

function inRange(s: SimState, a: GolemAttack, d: number): boolean {
  const t = GOLEM.attacks[a];
  if (d < t.minRange || d > t.maxRange) return false;
  const g = s.golem;
  const off = Math.abs(bearingToHero(s)) * (180 / Math.PI);
  if (a === 'doubleSlam') return g.enraged && off < 30;
  if (a === 'slam') return off < 30;
  if (a === 'sweep') return off >= GOLEM.flankDeg && off <= 100;
  return true; // toss: aims while winding up
}

/** Weighted pick among in-range attacks (×0.4 if it was the last one); -1 if none fits. Seeded. */
export function pickAttack(s: SimState, d: number): number {
  let total = 0;
  for (let i = 0; i < ATTACKS.length; i++) if (inRange(s, ATTACKS[i]!, d)) total += i === gx(s.golem).lastAttack ? GOLEM.repeatWeight : 1;
  if (total === 0) return -1;
  let r = rand(s) * total;
  for (let i = 0; i < ATTACKS.length; i++) {
    if (!inRange(s, ATTACKS[i]!, d)) continue;
    r -= i === gx(s.golem).lastAttack ? GOLEM.repeatWeight : 1;
    if (r <= 0) return i;
  }
  return ATTACKS.length - 1;
}

/** Slam centre: `ahead` m along the golem's facing. */
function aimAhead(g: GolemState, ahead: number): void {
  g.target.x = g.pos.x + dirX(g.facing) * ahead;
  g.target.z = g.pos.z + dirZ(g.facing) * ahead;
}

function telegraph(s: SimState, attack: GolemAttack, frames: number): void {
  const g = s.golem, t = GOLEM.attacks[attack];
  const centred = attack === 'sweep';
  s.events.push({
    type: 'telegraph', attack, pos: { x: centred ? g.pos.x : g.target.x, z: centred ? g.pos.z : g.target.z },
    radius: t.radius, facing: g.facing, arcDeg: t.arcDeg, frames,
  });
}

function startAttack(s: SimState, idx: number): void {
  const g = s.golem;
  const a = ATTACKS[idx]!;
  const t = GOLEM.attacks[a];
  const x = gx(g);
  set(g, 'windup');
  g.attack = a;
  x.lastAttack = idx;
  x.slamIndex = 0;
  x.struck = 0;
  x.windupLen = g.enraged ? t.windupP2 : t.windup;
  x.recoverLen = g.enraged ? t.recoverP2 : t.recover;
  if (a === 'slam' || a === 'doubleSlam') aimAhead(g, t.ahead);
  else if (a === 'sweep') {
    g.target.x = g.pos.x;
    g.target.z = g.pos.z;
  }
  // Toss telegraphs its landing decal at release (strike), when the target is known.
  if (a !== 'toss') telegraph(s, a, x.windupLen);
  s.events.push({ type: 'footstep', who: 'golem', pos: { x: g.pos.x, z: g.pos.z } });
}

function spawnHazard(s: SimState, kind: HazardState['kind'], x: number, z: number, frames: number, r0: number, r1: number, band: number, damage: number): void {
  for (let i = 0; i < s.hazards.length; i++) {
    const hz = s.hazards[i]!;
    if (hz.active) continue;
    hz.active = true;
    hz.kind = kind;
    hz.pos.x = x;
    hz.pos.z = z;
    hz.age = 0;
    hz.frames = frames;
    hz.r0 = r0;
    hz.r1 = r1;
    hz.band = band;
    hz.damage = damage;
    hz.spent = false;
    return;
  }
}

/** Advance every live hazard one step and hurt the hero once per hazard (roll i-frames beat it). */
export function stepHazards(s: SimState): void {
  const h = s.hero;
  for (let i = 0; i < s.hazards.length; i++) {
    const hz = s.hazards[i]!;
    if (!hz.active) continue;
    hz.age++;
    if (!hz.spent) {
      const r = hz.r0 + (hz.r1 - hz.r0) * Math.min(1, hz.age / hz.frames);
      const d = Math.hypot(h.pos.x - hz.pos.x, h.pos.z - hz.pos.z);
      const hit = hz.band > 0 ? Math.abs(d - r) <= hz.band * 0.5 : d <= r;
      if (hit && hurtHero(s, hz.damage, hz.pos, hz.kind === 'shockwave' ? 'shockwave' : 'toss')) hz.spent = true;
    }
    if (hz.age >= hz.frames) hz.active = false;
  }
}

/** The slam's fist lands: damage in the circle + a shockwave ring. */
function slamImpact(s: SimState, attack: GolemAttack): void {
  const g = s.golem, h = s.hero, t = tuningOf(attack);
  s.events.push({ type: 'impact', attack, pos: { x: g.target.x, z: g.target.z }, radius: t.radius });
  if (Math.hypot(h.pos.x - g.target.x, h.pos.z - g.target.z) <= t.radius) hurtHero(s, t.damage, g.target, attack);
  const w = GOLEM.shockwave;
  spawnHazard(s, 'shockwave', g.target.x, g.target.z, w.frames, w.r0, w.r1, w.band, w.damage);
}

function die(s: SimState): void {
  const g = s.golem;
  set(g, 'dying');
  g.attack = null;
  g.hitFlash = Math.max(g.hitFlash, 2);
  const amount = golemCoinsForWave(s.wave);
  s.events.push({ type: 'death', target: 'golem', targetId: 0, pos: { x: g.pos.x, z: g.pos.z } });
  s.events.push({ type: 'coins', amount, pos: { x: g.pos.x, z: g.pos.z } });
  s.coins += amount;
  s.hitstop = Math.max(s.hitstop, GOLEM.deathHitstop);
  s.timeScale = GOLEM.deathTimeScale;
  s.timeScaleFrames = GOLEM.deathTimeScaleFrames;
  for (let i = 0; i < s.hazards.length; i++) s.hazards[i]!.active = false;
}

export function stepGolem(s: SimState, _intent: Readonly<Intent>): void {
  const g = s.golem;
  const h = s.hero;
  const x = gx(g);
  if (g.hitFlash > 0) g.hitFlash--;
  g.actionFrame++;
  if (g.action === 'dead') return;

  if (g.hp <= 0 && g.action !== 'dying') {
    die(s);
    return;
  }
  if (g.action === 'dying') {
    g.glow = Math.max(0, g.glow - 0.04);
    if (g.actionFrame >= GOLEM.dyingFrames) set(g, 'dead');
    return;
  }
  stepHazards(s);

  // New hero hits: poise bookkeeping, first-attack grace ends.
  if (g.hitsTaken !== x.seenHits) {
    x.seenHits = g.hitsTaken;
    x.sinceHit = 0;
    x.firstWait = 0;
  } else if (++x.sinceHit >= GOLEM.poiseResetFrames && g.poise < g.maxPoise && g.action !== 'stagger') g.poise = g.maxPoise;

  if (g.action === 'dormant') {
    g.glow = 0.15;
    // The mound lifts as soon as the intro starts (the camera glides in while it assembles).
    if (s.phase === 'fight' || s.phase === 'intro') {
      set(g, 'wake');
      s.events.push({ type: 'wake' });
    }
    return;
  }
  if (g.action === 'wake') {
    g.poise = g.maxPoise; // no stagger while it is still assembling
    g.glow = Math.min(0.35, (0.35 * g.actionFrame) / wakeLength(g));
    if (g.actionFrame >= wakeLength(g)) set(g, 'idle');
    return;
  }
  if (s.phase !== 'fight') {
    // Victory/defeat: the Guardian settles, still breathing.
    if (g.action === 'walk' || g.action === 'windup') set(g, 'idle');
    g.attack = g.action === 'idle' ? null : g.attack;
    if (g.action === 'strike' || g.action === 'recover') {
      if (g.actionFrame >= 30) set(g, 'idle');
    }
    if (g.action === 'stagger' && g.actionFrame >= GOLEM.staggerFrames) set(g, 'idle');
    return;
  }
  if (x.firstWait > 0) x.firstWait--;

  const calm = g.action === 'idle' || g.action === 'walk' || g.action === 'recover' || g.action === 'stagger';
  // Phase 2: the Guardian kindles (only between attacks, so a telegraph is never silently cancelled).
  if (!g.enraged && calm && g.hp <= g.maxHp * enrageThreshold(s.wave)) {
    g.enraged = true;
    set(g, 'idle');
    g.attack = null;
    x.roar = GOLEM.roarFrames;
    x.staggerPending = 0;
    g.poise = g.maxPoise;
    g.cooldown = GOLEM.cooldownFramesP2;
    s.events.push({ type: 'enrage' });
    return;
  }
  // Poise break → stagger (deferred to the end of a telegraphed attack: hits never interrupt a telegraph).
  if (g.poise <= 0 && g.action !== 'stagger') {
    if (g.action === 'windup' || g.action === 'strike') x.staggerPending = 1;
    else {
      set(g, 'stagger');
      g.attack = null;
      g.poise = g.maxPoise;
      x.staggerPending = 0;
      x.roar = 0;
      s.events.push({ type: 'stagger', target: 'golem', targetId: 0 });
      return;
    }
  }
  if (g.action === 'stagger') {
    g.glow = 0.3;
    if (g.actionFrame >= GOLEM.staggerFrames) {
      set(g, 'idle');
      g.cooldown = Math.max(g.cooldown, 12);
    }
    return;
  }

  const restGlow = g.enraged ? 0.6 : 0.35;
  if (x.roar > 0) {
    x.roar--;
    g.glow = Math.min(1, g.glow + 0.05);
    if (x.roar === GOLEM.roarFrames - 24) x.minionCall = 1;
    return;
  }

  const d = dist(g.pos, h.pos);
  if (g.action === 'idle' || g.action === 'walk') {
    g.glow += (restGlow - g.glow) * 0.06;
    const turn = (g.enraged ? GOLEM.turnRateP2 : GOLEM.turnRate) * STEP_S;
    g.facing = turnToward(g.facing, facingOf(h.pos.x - g.pos.x, h.pos.z - g.pos.z), turn);
    if (g.cooldown > 0) g.cooldown--;
    const ready = !s.flags.golemPassive && g.cooldown === 0 && x.firstWait === 0 && h.action !== 'dead';
    const pick = ready ? pickAttack(s, d) : -1;
    if (pick >= 0) {
      startAttack(s, pick);
      return;
    }
    const wantWalk = !s.flags.golemPassive && d > GOLEM.closeEnough && h.action !== 'dead';
    if (wantWalk) {
      if (g.action !== 'walk') set(g, 'walk');
      const sp = (g.enraged ? GOLEM.walkSpeedP2 : GOLEM.walkSpeed) * STEP_S;
      g.pos.x += dirX(g.facing) * sp;
      g.pos.z += dirZ(g.facing) * sp;
      collideStatic(g.pos, GOLEM.radius);
      // A footstep every ~0.55 s of walking (the view stomps on these, audio thuds).
      if (g.actionFrame % 33 === 0) s.events.push({ type: 'footstep', who: 'golem', pos: { x: g.pos.x, z: g.pos.z } });
    } else if (g.action !== 'idle') set(g, 'idle');
    return;
  }

  const a = g.attack ?? 'slam';
  const t = tuningOf(a);
  if (g.action === 'windup') {
    g.glow = Math.min(1, restGlow + ((1 - restGlow) * g.actionFrame) / x.windupLen);
    if (a === 'toss') g.facing = turnToward(g.facing, facingOf(h.pos.x - g.pos.x, h.pos.z - g.pos.z), GOLEM.turnRateP2 * STEP_S);
    if (g.actionFrame < x.windupLen) return;
    set(g, 'strike');
    x.struck = 0;
    if (a === 'slam' || a === 'doubleSlam') slamImpact(s, a);
    else if (a === 'sweep') {
      s.events.push({ type: 'impact', attack: 'sweep', pos: { x: g.pos.x, z: g.pos.z }, radius: t.radius });
    } else {
      // Toss: release toward where the hero is heading.
      x.tossFromX = g.pos.x + dirX(g.facing) * 0.4;
      x.tossFromZ = g.pos.z + dirZ(g.facing) * 0.4;
      g.target.x = h.pos.x + h.vel.x * GOLEM.tossLead;
      g.target.z = h.pos.z + h.vel.z * GOLEM.tossLead;
      clampToArena(g.target, 0.5);
      s.events.push({ type: 'toss', from: { x: x.tossFromX, z: x.tossFromZ }, to: { x: g.target.x, z: g.target.z }, frames: t.strike });
      telegraph(s, 'toss', t.strike);
    }
  }
  if (g.action === 'strike') {
    if (a === 'sweep' && !x.struck) {
      const dx = h.pos.x - g.pos.x, dz = h.pos.z - g.pos.z;
      const off = Math.abs(wrapAngle(facingOf(dx, dz) - g.facing));
      if (Math.hypot(dx, dz) <= t.radius && off <= ((t.arcDeg / 2) * Math.PI) / 180 && hurtHero(s, t.damage, g.pos, 'sweep')) x.struck = 1;
    }
    if (g.actionFrame < t.strike) return;
    if (a === 'toss') {
      s.events.push({ type: 'impact', attack: 'toss', pos: { x: g.target.x, z: g.target.z }, radius: t.radius });
      spawnHazard(s, 'boulder', g.target.x, g.target.z, GOLEM.boulderHazard.frames, t.radius, t.radius, 0, GOLEM.boulderHazard.damage);
    }
    if (a === 'doubleSlam' && x.slamIndex === 0) {
      // Second fist: re-aim up to 40° toward the hero, telegraph the 500 ms gap.
      x.slamIndex = 1;
      const want = facingOf(h.pos.x - g.pos.x, h.pos.z - g.pos.z);
      g.facing = turnToward(g.facing, want, (40 * Math.PI) / 180);
      aimAhead(g, t.ahead);
      set(g, 'windup');
      x.windupLen = GOLEM.doubleSlamGap;
      telegraph(s, 'doubleSlam', GOLEM.doubleSlamGap);
      return;
    }
    set(g, 'recover');
    return;
  }
  if (g.action === 'recover') {
    g.glow += (restGlow - g.glow) * 0.08;
    if (g.actionFrame >= x.recoverLen) {
      set(g, 'idle');
      g.attack = null;
      g.cooldown = g.enraged ? GOLEM.cooldownFramesP2 : GOLEM.cooldownFrames;
      if (x.staggerPending) g.poise = Math.min(g.poise, 0);
    }
  }
}

/** Golem HP fraction clamped 0..1 (UI). */
export const golemHpFrac = (g: GolemState) => clamp(g.hp / g.maxHp, 0, 1);
