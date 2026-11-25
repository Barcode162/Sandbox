// src/hero/sim.ts — owned by WO-003. Hero movement, 3-hit combo, dodge roll, hurt. Pure: no three/DOM.
// FROZEN signatures (other slices call them): createHero, stepHero, bufferHeroInput, hurtHero, isHeroAttackActive.
import type { AttackKind, HeroAction, HeroState, Intent, SimState, Vec2 } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { HERO } from '../tuning/hero.ts';
import { GOLEM } from '../tuning/golem.ts';
import { STEP_S } from '../core/fixed-step.ts';
import { dirX, dirZ, facingOf, turnToward } from '../core/math.ts';
import { collideStatic, pushOutOfCircle } from '../core/collide.ts';
import { stickToWorld } from '../core/intent.ts';

export function createHero(): HeroState {
  const p = ARENA.heroSpawn;
  return {
    pos: { x: p.x, z: p.z }, prevPos: { x: p.x, z: p.z }, vel: { x: 0, z: 0 },
    facing: ARENA.heroSpawnFacing, prevFacing: ARENA.heroSpawnFacing,
    action: 'idle', actionFrame: 0, attackBuffer: 0, dodgeBuffer: 0,
    hp: HERO.maxHp, maxHp: HERO.maxHp, iframes: 0, stride: 0, swingHits: 0, skillCooldown: 0, ext: {},
  };
}

/** 0-based combo index for attack actions, or -1. */
export function comboIndex(a: HeroAction): number {
  return a === 'attack1' ? 0 : a === 'attack2' ? 1 : a === 'attack3' ? 2 : -1;
}

/** True while the current swing's hitbox is open. */
export function isHeroAttackActive(h: HeroState): boolean {
  const i = comboIndex(h.action);
  if (i < 0) return false;
  const c = HERO.combo[i]!;
  return h.actionFrame >= c.startup && h.actionFrame < c.startup + c.active;
}

function setAction(s: SimState, a: HeroAction): void {
  const h = s.hero;
  h.action = a;
  h.actionFrame = 0;
  const i = comboIndex(a);
  if (i >= 0) {
    h.swingHits = 0;
    s.events.push({ type: 'swing', combo: (i + 1) as 1 | 2 | 3, pos: { x: h.pos.x, z: h.pos.z }, facing: h.facing });
  } else if (a === 'dodge') {
    h.iframes = Math.max(h.iframes, HERO.dodge.iframeEnd);
    s.events.push({ type: 'dodge', pos: { x: h.pos.x, z: h.pos.z }, facing: h.facing });
  }
}

/** Latch attack/dodge presses into the input buffer (also called during hit-stop so no press is lost). */
export function bufferHeroInput(s: SimState, intent: Readonly<Intent>): void {
  if (intent.attack) s.hero.attackBuffer = HERO.inputBufferFrames;
  if (intent.dodge) s.hero.dodgeBuffer = HERO.inputBufferFrames;
}

const w = { x: 0, z: 0 };

export function stepHero(s: SimState, intent: Readonly<Intent>): void {
  const h = s.hero;
  if (s.phase !== 'fight') {
    h.vel.x = h.vel.z = 0;
    if (s.phase === 'victory' && h.action !== 'victory' && h.action !== 'dead') setAction(s, 'victory');
    h.actionFrame++;
    return;
  }
  if (h.action === 'dead') {
    h.actionFrame++;
    return;
  }
  bufferHeroInput(s, intent);

  // Stick → world, rotated by the camera yaw sampled with the intent.
  stickToWorld(intent, w);
  const mx = w.x, mz = w.z;
  const mag = Math.hypot(mx, mz);
  const ci = comboIndex(h.action);
  const canCancel = ci >= 0 && h.actionFrame >= HERO.combo[ci]!.cancel;
  const actionDone =
    (ci >= 0 && h.actionFrame >= HERO.combo[ci]!.startup + HERO.combo[ci]!.active + HERO.combo[ci]!.recovery) ||
    (h.action === 'dodge' && h.actionFrame >= HERO.dodge.frames) ||
    (h.action === 'hurt' && h.actionFrame >= HERO.hurt.frames);
  if (actionDone) setAction(s, mag > 0.1 ? 'run' : 'idle');

  const nowFree = h.action === 'idle' || h.action === 'run';
  if (h.dodgeBuffer > 0 && (nowFree || ci >= 0)) {
    if (mag > 0.1) h.facing = facingOf(mx, mz);
    h.dodgeBuffer = 0;
    h.attackBuffer = 0;
    setAction(s, 'dodge');
  } else if (h.attackBuffer > 0 && (nowFree || canCancel)) {
    h.attackBuffer = 0;
    if (mag > 0.1) h.facing = facingOf(mx, mz);
    else softLock(s);
    setAction(s, ci === 0 && canCancel ? 'attack2' : ci === 1 && canCancel ? 'attack3' : 'attack1');
  }

  let speed = 0;
  const a = h.action;
  if (a === 'idle' || a === 'run') {
    if (mag > 0.1) {
      h.facing = turnToward(h.facing, facingOf(mx, mz), HERO.turnRate * STEP_S);
      speed = HERO.runSpeed * Math.min(1, mag);
      if (a === 'idle') setAction(s, 'run');
    } else if (a === 'run') setAction(s, 'idle');
    const tx = mag > 0.1 ? (mx / mag) * speed : 0;
    const tz = mag > 0.1 ? (mz / mag) * speed : 0;
    const k = (mag > 0.1 ? HERO.accel : HERO.decel) * STEP_S;
    h.vel.x += Math.max(-k, Math.min(k, tx - h.vel.x));
    h.vel.z += Math.max(-k, Math.min(k, tz - h.vel.z));
  } else if (a === 'dodge') {
    const v = HERO.dodge.distance / (HERO.dodge.frames * STEP_S);
    h.vel.x = dirX(h.facing) * v;
    h.vel.z = dirZ(h.facing) * v;
  } else if (comboIndex(a) >= 0) {
    const c = HERO.combo[comboIndex(a)]!;
    const v = h.actionFrame < c.startup + c.active ? c.lunge / ((c.startup + c.active) * STEP_S) : 0;
    h.vel.x = dirX(h.facing) * v;
    h.vel.z = dirZ(h.facing) * v;
  } else {
    h.vel.x *= 0.8;
    h.vel.z *= 0.8;
  }
  h.pos.x += h.vel.x * STEP_S;
  h.pos.z += h.vel.z * STEP_S;
  if (s.golem.action !== 'dead') pushOutOfCircle(h.pos, HERO.radius, s.golem.pos.x, s.golem.pos.z, GOLEM.radius);
  collideStatic(h.pos, HERO.radius);
  h.stride += Math.hypot(h.vel.x, h.vel.z) * STEP_S;

  if (h.attackBuffer > 0) h.attackBuffer--;
  if (h.dodgeBuffer > 0) h.dodgeBuffer--;
  if (h.iframes > 0) h.iframes--;
  h.actionFrame++;
}

/** With no stick input, an attack turns toward the golem if it is close (soft lock). */
function softLock(s: SimState): void {
  const h = s.hero, g = s.golem;
  if (g.action === 'dead' || g.action === 'dying' || g.action === 'dormant') return;
  const dx = g.pos.x - h.pos.x, dz = g.pos.z - h.pos.z;
  if (dx * dx + dz * dz < 25) h.facing = facingOf(dx, dz);
}

/** Damage the hero (called by golem/minion sims). Returns false if the hero ignored it (i-frames, dead, flag). */
export function hurtHero(s: SimState, amount: number, from: Vec2, kind: AttackKind): boolean {
  const h = s.hero;
  if (h.iframes > 0 || h.action === 'dead' || s.flags.heroInvulnerable || s.phase !== 'fight') return false;
  h.hp = Math.max(0, h.hp - amount);
  s.events.push({ type: 'hit', attacker: kind === 'minion' ? 'minion' : 'golem', target: 'hero', targetId: 0, amount, crit: false, kind, pos: { x: h.pos.x, z: h.pos.z }, y: 1 });
  const dx = h.pos.x - from.x, dz = h.pos.z - from.z;
  const d = Math.hypot(dx, dz) || 1;
  h.vel.x = (dx / d) * HERO.hurt.knockback * 4;
  h.vel.z = (dz / d) * HERO.hurt.knockback * 4;
  if (h.hp <= 0) {
    h.action = 'dead';
    h.actionFrame = 0;
    s.events.push({ type: 'death', target: 'hero', targetId: 0, pos: { x: h.pos.x, z: h.pos.z } });
  } else {
    h.action = 'hurt';
    h.actionFrame = 0;
    h.iframes = HERO.hurt.graceFrames;
  }
  return true;
}
