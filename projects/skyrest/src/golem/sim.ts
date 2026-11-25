// src/golem/sim.ts — owned by WO-004. Stone Guardian AI: wake, approach, telegraphed attacks
// (windup → strike → recover), stagger on poise break, dying → dead with coin burst. Pure: no three/DOM.
// FROZEN signatures: createGolem, stepGolem.
import type { GolemAttack, GolemState, Intent, SimState } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { GOLEM } from '../tuning/golem.ts';
import { STEP_S } from '../core/fixed-step.ts';
import { dirX, dirZ, dist, facingOf, turnToward } from '../core/math.ts';
import { chance } from '../core/rng.ts';
import { hurtHero } from '../hero/sim.ts';
import { collideStatic } from '../core/collide.ts';

export function createGolem(): GolemState {
  const p = ARENA.golemSpawn;
  return {
    pos: { x: p.x, z: p.z }, prevPos: { x: p.x, z: p.z },
    facing: ARENA.golemSpawnFacing, prevFacing: ARENA.golemSpawnFacing,
    action: 'dormant', actionFrame: 0, attack: null,
    hp: GOLEM.maxHp, maxHp: GOLEM.maxHp, poise: GOLEM.maxPoise, maxPoise: GOLEM.maxPoise,
    glow: 0.3, hitFlash: 0, cooldown: GOLEM.cooldownFrames, hitsTaken: 0,
    enraged: false, target: { x: p.x, z: p.z }, ext: {},
  };
}

function set(g: GolemState, a: GolemState['action']): void {
  g.action = a;
  g.actionFrame = 0;
}

export function stepGolem(s: SimState, _intent: Readonly<Intent>): void {
  const g = s.golem;
  const h = s.hero;
  if (g.hitFlash > 0) g.hitFlash--;
  g.actionFrame++;
  if (g.action === 'dead') return;

  if (g.hp <= 0 && g.action !== 'dying') {
    set(g, 'dying');
    g.attack = null;
    s.events.push({ type: 'death', target: 'golem', targetId: 0, pos: { x: g.pos.x, z: g.pos.z } });
    s.events.push({ type: 'coins', amount: GOLEM.coinsOnDeath, pos: { x: g.pos.x, z: g.pos.z } });
    s.coins += GOLEM.coinsOnDeath;
    return;
  }
  if (g.action === 'dying') {
    g.glow = Math.max(0, g.glow - 0.02);
    if (g.actionFrame >= GOLEM.dyingFrames) set(g, 'dead');
    return;
  }
  if (g.action === 'dormant') {
    if (s.phase === 'fight') {
      set(g, 'wake');
      s.events.push({ type: 'wake' });
    }
    return;
  }
  if (g.action === 'wake') {
    g.glow = Math.min(1, g.actionFrame / GOLEM.wakeFrames);
    if (g.actionFrame >= GOLEM.wakeFrames) set(g, 'idle');
    return;
  }
  if (g.poise <= 0 && g.action !== 'stagger') {
    set(g, 'stagger');
    g.attack = null;
    g.poise = g.maxPoise;
    s.events.push({ type: 'stagger', target: 'golem', targetId: 0 });
    return;
  }
  if (g.action === 'stagger') {
    if (g.actionFrame >= GOLEM.staggerFrames) set(g, 'idle');
    return;
  }
  if (s.phase !== 'fight') return;

  const d = dist(g.pos, h.pos);
  if (g.action === 'idle' || g.action === 'walk') {
    g.glow += (0.35 - g.glow) * 0.05;
    g.facing = turnToward(g.facing, facingOf(h.pos.x - g.pos.x, h.pos.z - g.pos.z), GOLEM.turnRate * STEP_S);
    if (g.cooldown > 0) g.cooldown--;
    const atk: GolemAttack = chance(s, 0.5) ? 'slam' : 'sweep';
    if (!s.flags.golemPassive && g.cooldown === 0 && d < GOLEM.attacks[atk].range + 0.5) {
      set(g, 'windup');
      g.attack = atk;
      const t = GOLEM.attacks[atk];
      g.target.x = g.pos.x + dirX(g.facing) * 2.4;
      g.target.z = g.pos.z + dirZ(g.facing) * 2.4;
      s.events.push({ type: 'telegraph', attack: atk, pos: { x: g.target.x, z: g.target.z }, radius: t.radius, facing: g.facing, arcDeg: atk === 'sweep' ? 200 : 360, frames: t.windup });
    } else if (!s.flags.golemPassive && d > 2.6) {
      if (g.action !== 'walk') set(g, 'walk');
      g.pos.x += dirX(g.facing) * GOLEM.walkSpeed * STEP_S;
      g.pos.z += dirZ(g.facing) * GOLEM.walkSpeed * STEP_S;
      collideStatic(g.pos, GOLEM.radius);
    } else if (g.action !== 'idle') set(g, 'idle');
    return;
  }
  const t = GOLEM.attacks[g.attack ?? 'slam'];
  if (g.action === 'windup') {
    g.glow = Math.min(1, 0.35 + g.actionFrame / t.windup);
    if (g.actionFrame >= t.windup) {
      set(g, 'strike');
      const cx = g.target.x, cz = g.target.z;
      s.events.push({ type: 'impact', attack: g.attack ?? 'slam', pos: { x: cx, z: cz }, radius: t.radius });
      if (Math.hypot(h.pos.x - cx, h.pos.z - cz) < t.radius) hurtHero(s, t.damage, g.pos, g.attack ?? 'slam');
    }
  } else if (g.action === 'strike') {
    if (g.actionFrame >= t.strike) set(g, 'recover');
  } else if (g.action === 'recover') {
    g.glow += (0.35 - g.glow) * 0.08;
    if (g.actionFrame >= t.recover) {
      set(g, 'idle');
      g.attack = null;
      g.cooldown = GOLEM.cooldownFrames;
    }
  }
}
