// src/hero/sim.ts — owned by WO-003. Hero movement, 3-hit combo, Gale Crescent skill, dodge roll with i-frames and
// perfect dodge, hurt knockback, death. Pure: no three/DOM. Numbers: tuning/hero.ts (experience.md §5).
// FROZEN signatures (other slices call them): createHero, stepHero, bufferHeroInput, hurtHero, isHeroAttackActive.
import type { AttackKind, HeroAction, HeroState, Intent, SimState, Vec2 } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { HERO } from '../tuning/hero.ts';
import { GOLEM } from '../tuning/golem.ts';
import { STEP_S } from '../core/fixed-step.ts';
import { dirX, dirZ, facingOf, turnToward } from '../core/math.ts';
import { collideStatic, pushOutOfCircle } from '../core/collide.ts';
import { stickToWorld } from '../core/intent.ts';

/** Keys of HeroState.ext (all created up front so steps never add properties). */
export const HERO_EXT = {
  /** Combo index (0..2) the next free attack starts from, while comboTimer > 0. */
  comboNext: 0,
  comboTimer: 0,
  skillBuffer: 0,
  /** Facing angle the current roll travels along (a neutral roll goes backward without turning). */
  rollFacing: 0,
  /** 1 while the current roll travels backward (view plays a back roll). */
  rollBack: 0,
  dodgeLock: 0,
  /** 1 once the current roll has produced a perfect dodge. */
  perfectUsed: 0,
  /** 1 = the next landed hit gets HERO.perfectBonus. */
  perfectBonus: 0,
  /** Knockback direction (unit) for the current flinch. */
  kbX: 0,
  kbZ: 0,
  /** Footfalls so far (stride / HERO.footstepM, floored). */
  steps: 0,
  /** Frames since the hero last pressed anything or moved (idle flourish after 6 s). */
  idleFrames: 0,
} as const;
export type HeroExtKey = keyof typeof HERO_EXT;

export function createHero(): HeroState {
  const p = ARENA.heroSpawn;
  return {
    pos: { x: p.x, z: p.z }, prevPos: { x: p.x, z: p.z }, vel: { x: 0, z: 0 },
    facing: ARENA.heroSpawnFacing, prevFacing: ARENA.heroSpawnFacing,
    action: 'idle', actionFrame: 0, attackBuffer: 0, dodgeBuffer: 0,
    hp: HERO.maxHp, maxHp: HERO.maxHp, iframes: 0, stride: 0, swingHits: 0, skillCooldown: 0, ext: { ...HERO_EXT },
  };
}

/** 0-based combo index for attack actions, or -1. */
export function comboIndex(a: HeroAction): number {
  return a === 'attack1' ? 0 : a === 'attack2' ? 1 : a === 'attack3' ? 2 : -1;
}

/** Skill tick index (0 or 1) whose hitbox is open on this frame, or -1. */
export function skillTick(h: HeroState): number {
  if (h.action !== 'skill') return -1;
  const k = HERO.skill;
  return h.actionFrame === k.startup ? 0 : h.actionFrame === k.startup + k.tickGap ? 1 : -1;
}

/** True while the current swing's hitbox is open (combo active window, or a skill tick frame). */
export function isHeroAttackActive(h: HeroState): boolean {
  if (h.action === 'skill') return skillTick(h) >= 0;
  const i = comboIndex(h.action);
  if (i < 0) return false;
  const c = HERO.combo[i]!;
  return h.actionFrame >= c.startup && h.actionFrame < c.startup + c.active;
}

/** True on frames where a roll is invulnerable (i-frames 40–300 ms into the roll). */
export function dodgeInvulnerable(h: HeroState): boolean {
  return h.action === 'dodge' && h.actionFrame >= HERO.dodge.iframeStart && h.actionFrame <= HERO.dodge.iframeEnd;
}

/** Total frames of an action before it returns to idle/run (0 = open-ended). */
function actionLength(a: HeroAction): number {
  const i = comboIndex(a);
  if (i >= 0) {
    const c = HERO.combo[i]!;
    return c.startup + c.active + c.recovery;
  }
  if (a === 'skill') return HERO.skill.startup + HERO.skill.tickGap + HERO.skill.recovery;
  if (a === 'dodge') return HERO.dodge.frames;
  if (a === 'hurt') return HERO.hurt.frames;
  return 0;
}

/** True once the current combo/skill swing is in its recovery (dodge may cancel it). */
function inRecovery(h: HeroState): boolean {
  const i = comboIndex(h.action);
  if (i >= 0) return h.actionFrame >= HERO.combo[i]!.startup + HERO.combo[i]!.active;
  if (h.action === 'skill') return h.actionFrame > HERO.skill.startup + HERO.skill.tickGap;
  return false;
}

function setAction(s: SimState, a: HeroAction): void {
  const h = s.hero;
  h.action = a;
  h.actionFrame = 0;
  const i = comboIndex(a);
  if (i >= 0) {
    h.swingHits = 0;
    s.events.push({ type: 'swing', combo: (i + 1) as 1 | 2 | 3, pos: { x: h.pos.x, z: h.pos.z }, facing: h.facing });
  } else if (a === 'skill') {
    h.swingHits = 0;
    h.skillCooldown = HERO.skill.cooldown;
    s.events.push({ type: 'skill', pos: { x: h.pos.x, z: h.pos.z }, facing: h.facing });
  } else if (a === 'dodge') {
    h.ext.perfectUsed = 0;
    s.events.push({ type: 'dodge', pos: { x: h.pos.x, z: h.pos.z }, facing: h.ext.rollFacing! });
  }
}

/** Latch attack/dodge/skill presses into the 200 ms input buffer (also called during hit-stop so no press is lost). */
export function bufferHeroInput(s: SimState, intent: Readonly<Intent>): void {
  if (intent.attack) s.hero.attackBuffer = HERO.inputBufferFrames;
  if (intent.dodge) s.hero.dodgeBuffer = HERO.inputBufferFrames;
  if (intent.skill) s.hero.ext.skillBuffer = HERO.inputBufferFrames;
}

const w = { x: 0, z: 0 };

/** easeOutQuad / easeOutCubic displacement fractions. */
const outQuad = (t: number) => 1 - (1 - t) * (1 - t);
const outCubic = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

export function stepHero(s: SimState, intent: Readonly<Intent>): void {
  const h = s.hero;
  const x = h.ext;
  if (h.skillCooldown > 0 && --h.skillCooldown === 0) s.events.push({ type: 'skillReady' });
  if (s.phase !== 'fight') {
    h.vel.x = h.vel.z = 0;
    if (s.phase === 'victory' && h.action !== 'victory' && h.action !== 'dead') setAction(s, 'victory');
    else if (s.phase !== 'victory' && h.action !== 'idle' && h.action !== 'dead') setAction(s, 'idle');
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
  const moving = mag > 0.1;

  // Finished actions hand back control; a finished swing keeps the combo alive for 450 ms.
  const len = actionLength(h.action);
  if (len > 0 && h.actionFrame >= len) {
    const ci = comboIndex(h.action);
    if (ci >= 0) {
      x.comboNext = ci < 2 ? ci + 1 : 0;
      x.comboTimer = HERO.comboResetFrames;
    }
    if (h.action === 'dodge') x.dodgeLock = HERO.dodge.lockout;
    setAction(s, moving ? 'run' : 'idle');
  }

  const ci = comboIndex(h.action);
  const free = h.action === 'idle' || h.action === 'run';
  const canChain = ci >= 0 && ci < 2 && h.actionFrame >= HERO.combo[ci]!.cancel;
  if (h.dodgeBuffer > 0 && x.dodgeLock! <= 0 && (free || inRecovery(h))) {
    x.rollBack = moving ? 0 : 1;
    if (moving) h.facing = facingOf(mx, mz);
    x.rollFacing = moving ? h.facing : h.facing + Math.PI;
    h.dodgeBuffer = 0;
    h.attackBuffer = 0;
    x.skillBuffer = 0;
    x.comboTimer = 0;
    setAction(s, 'dodge');
  } else if (x.skillBuffer! > 0 && h.skillCooldown === 0 && (free || inRecovery(h))) {
    x.skillBuffer = 0;
    h.attackBuffer = 0;
    x.comboTimer = 0;
    if (moving) h.facing = facingOf(mx, mz);
    setAction(s, 'skill');
  } else if (h.attackBuffer > 0 && (free || canChain)) {
    h.attackBuffer = 0;
    const next = canChain ? ci + 1 : x.comboTimer! > 0 ? x.comboNext! : 0;
    x.comboTimer = 0;
    if (moving) h.facing = facingOf(mx, mz);
    else softLock(s);
    setAction(s, next === 1 ? 'attack2' : next === 2 ? 'attack3' : 'attack1');
  }

  const a = h.action;
  const f = h.actionFrame; // frames already spent in this action (before this step's increment)
  if (a === 'idle' || a === 'run') {
    let speed = 0;
    if (moving) {
      h.facing = turnToward(h.facing, facingOf(mx, mz), HERO.turnRate * STEP_S);
      speed = HERO.runSpeed * Math.min(1, mag);
      if (a === 'idle') setAction(s, 'run');
    } else if (a === 'run') setAction(s, 'idle');
    const tx = moving ? (mx / mag) * speed : 0;
    const tz = moving ? (mz / mag) * speed : 0;
    const k = (moving ? HERO.accel : HERO.decel) * STEP_S;
    const dx = tx - h.vel.x, dz = tz - h.vel.z;
    const dl = Math.hypot(dx, dz);
    // Accelerate along the velocity error (no per-axis clamp, so diagonals behave like straights).
    if (dl <= k) {
      h.vel.x = tx;
      h.vel.z = tz;
    } else {
      h.vel.x += (dx / dl) * k;
      h.vel.z += (dz / dl) * k;
    }
  } else if (a === 'dodge') {
    const n = HERO.dodge.frames;
    const d = HERO.dodge.distance * (outQuad(Math.min(1, (f + 1) / n)) - outQuad(f / n));
    h.vel.x = (dirX(x.rollFacing!) * d) / STEP_S;
    h.vel.z = (dirZ(x.rollFacing!) * d) / STEP_S;
  } else if (ci >= 0) {
    const c = HERO.combo[ci]!;
    if (f < c.startup && moving) h.facing = turnToward(h.facing, facingOf(mx, mz), HERO.turnRateStartup * STEP_S);
    const v = f < c.startup ? c.lunge / (c.startup * STEP_S) : 0;
    h.vel.x = dirX(h.facing) * v;
    h.vel.z = dirZ(h.facing) * v;
  } else if (a === 'skill') {
    h.vel.x = h.vel.z = 0;
  } else if (a === 'hurt') {
    const n = HERO.hurt.frames;
    const d = HERO.hurt.knockback * (outCubic(Math.min(1, (f + 1) / n)) - outCubic(f / n));
    h.vel.x = (x.kbX! * d) / STEP_S;
    h.vel.z = (x.kbZ! * d) / STEP_S;
  }
  h.pos.x += h.vel.x * STEP_S;
  h.pos.z += h.vel.z * STEP_S;
  const g = s.golem;
  if (g.action !== 'dead' && g.action !== 'dying') pushOutOfCircle(h.pos, HERO.radius, g.pos.x, g.pos.z, GOLEM.radius);
  collideStatic(h.pos, HERO.radius);
  if (a === 'run') {
    h.stride += Math.hypot(h.vel.x, h.vel.z) * STEP_S;
    const steps = Math.floor(h.stride / HERO.footstepM);
    if (steps !== x.steps) {
      x.steps = steps;
      s.events.push({ type: 'footstep', who: 'hero', pos: { x: h.pos.x, z: h.pos.z } });
    }
  }
  x.idleFrames = a === 'idle' ? x.idleFrames! + 1 : 0;

  if (h.attackBuffer > 0) h.attackBuffer--;
  if (h.dodgeBuffer > 0) h.dodgeBuffer--;
  if (x.skillBuffer! > 0) x.skillBuffer!--;
  if (x.comboTimer! > 0) x.comboTimer!--;
  if (x.dodgeLock! > 0) x.dodgeLock!--;
  if (h.iframes > 0) h.iframes--;
  h.actionFrame++;
  // Roll i-frames live in `iframes` too, so anything reading the contract field sees them.
  if (dodgeInvulnerable(h)) h.iframes = Math.max(h.iframes, HERO.dodge.iframeEnd - h.actionFrame + 1);
}

/** With no stick input, an attack turns toward the golem if it is close (soft lock). */
function softLock(s: SimState): void {
  const h = s.hero, g = s.golem;
  if (g.action === 'dead' || g.action === 'dying' || g.action === 'dormant') return;
  const dx = g.pos.x - h.pos.x, dz = g.pos.z - h.pos.z;
  if (dx * dx + dz * dz < 36) h.facing = facingOf(dx, dz);
}

/** Damage the hero (called by golem/minion sims). Returns false if the hero ignored it (i-frames, dead, flag).
 *  A blow that lands inside a roll's i-frames is a PERFECT DODGE: 120 ms at time-scale 0.5 and +20 % on the next hit. */
export function hurtHero(s: SimState, amount: number, from: Vec2, kind: AttackKind): boolean {
  const h = s.hero;
  if (s.phase !== 'fight' || h.action === 'dead') return false;
  if (dodgeInvulnerable(h)) {
    if (!h.ext.perfectUsed) {
      h.ext.perfectUsed = 1;
      h.ext.perfectBonus = 1;
      if (s.timeScale > HERO.perfect.timeScale || s.timeScaleFrames === 0) {
        s.timeScale = HERO.perfect.timeScale;
        s.timeScaleFrames = HERO.perfect.frames;
      }
      s.events.push({ type: 'perfectDodge', pos: { x: h.pos.x, z: h.pos.z } });
    }
    return false;
  }
  if (h.iframes > 0 || s.flags.heroInvulnerable) return false;
  h.hp = Math.max(0, h.hp - amount);
  s.events.push({ type: 'hit', attacker: kind === 'minion' ? 'minion' : 'golem', target: 'hero', targetId: 0, amount, crit: false, kind, pos: { x: h.pos.x, z: h.pos.z }, y: 1 });
  const dx = h.pos.x - from.x, dz = h.pos.z - from.z;
  const d = Math.hypot(dx, dz);
  h.ext.kbX = d > 1e-6 ? dx / d : -dirX(h.facing);
  h.ext.kbZ = d > 1e-6 ? dz / d : -dirZ(h.facing);
  h.vel.x = h.vel.z = 0;
  h.attackBuffer = h.dodgeBuffer = 0;
  h.ext.skillBuffer = 0;
  h.ext.comboTimer = 0;
  h.action = h.hp <= 0 ? 'dead' : 'hurt';
  h.actionFrame = 0;
  if (h.hp <= 0) {
    s.timeScale = Math.min(s.timeScale, HERO.death.timeScale);
    s.timeScaleFrames = Math.max(s.timeScaleFrames, HERO.death.frames);
    s.events.push({ type: 'death', target: 'hero', targetId: 0, pos: { x: h.pos.x, z: h.pos.z } });
  } else {
    h.iframes = HERO.hurt.graceFrames;
  }
  return true;
}
