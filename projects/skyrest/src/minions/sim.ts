// src/minions/sim.ts — owned by WO-004. Pebble minions (experience.md §4.5, phase 2 only): the roar calls 3;
// each pops out 1.5–3 m from the Guardian, hops after the hero, squashes for 400 ms (telegraph) and bumps
// for ½ heart, flinches when struck, and pops into shards + 3 coins. Pure: no three/DOM.
// FROZEN signatures: createMinions, stepMinions.
import type { Intent, MinionState, SimState } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { GOLEM, MINION } from '../tuning/golem.ts';
import { STEP_S } from '../core/fixed-step.ts';
import { dirX, dirZ, facingOf, turnToward } from '../core/math.ts';
import { randRange } from '../core/rng.ts';
import { collideStatic, pushOutOfCircle } from '../core/collide.ts';
import { hurtHero } from '../hero/sim.ts';
import { gx } from '../golem/sim.ts';

export type MinionExt = ReturnType<typeof minionExt>;
/** Typed view of a minion's private scratch. */
export const mx = (m: MinionState) => m.ext as MinionExt;

function minionExt() {
  return { fromX: 0, fromZ: 0, toX: 0, toZ: 0, struck: 0, seenFlash: 0, lockout: 0 };
}

export function createMinions(): MinionState[] {
  const out: MinionState[] = [];
  for (let i = 0; i < ARENA.minionPool; i++) {
    out.push({ id: i, pos: { x: 0, z: 0 }, prevPos: { x: 0, z: 0 }, facing: 0, prevFacing: 0, action: 'inactive', actionFrame: 0, hp: 0, hitFlash: 0, ext: minionExt() });
  }
  return out;
}

function set(m: MinionState, a: MinionState['action']): void {
  m.action = a;
  m.actionFrame = 0;
}

/** Bring `count` pebbles out of the Guardian, spread around it (seeded). */
export function spawnMinions(s: SimState, count: number): void {
  const g = s.golem;
  let made = 0;
  for (let i = 0; i < s.minions.length && made < count; i++) {
    const m = s.minions[i]!;
    if (m.action !== 'inactive' && m.action !== 'dead') continue;
    // A fan in front of the Guardian so the hero sees them burst out.
    const ang = g.facing + (made - (count - 1) / 2) * 1.05 + randRange(s, -0.2, 0.2);
    const r = randRange(s, MINION.spawnMin, MINION.spawnMax) + GOLEM.radius * 0.4;
    mx(m).fromX = g.pos.x;
    mx(m).fromZ = g.pos.z;
    mx(m).toX = g.pos.x + dirX(ang) * r;
    mx(m).toZ = g.pos.z + dirZ(ang) * r;
    const to = { x: mx(m).toX, z: mx(m).toZ };
    collideStatic(to, MINION.radius);
    mx(m).toX = to.x;
    mx(m).toZ = to.z;
    m.pos.x = m.prevPos.x = g.pos.x;
    m.pos.z = m.prevPos.z = g.pos.z;
    m.facing = m.prevFacing = ang;
    m.hp = MINION.maxHp;
    m.hitFlash = 0;
    mx(m).struck = 0;
    mx(m).seenFlash = 0;
    mx(m).lockout = 0;
    set(m, 'spawn');
    s.events.push({ type: 'spawn', target: 'minion', targetId: m.id, pos: { x: mx(m).toX, z: mx(m).toZ } });
    made++;
  }
}

function pop(s: SimState, m: MinionState): void {
  set(m, 'dead');
  s.events.push({ type: 'death', target: 'minion', targetId: m.id, pos: { x: m.pos.x, z: m.pos.z } });
  s.events.push({ type: 'coins', amount: MINION.coins, pos: { x: m.pos.x, z: m.pos.z } });
  s.coins += MINION.coins;
}

export function stepMinions(s: SimState, _intent: Readonly<Intent>): void {
  const g = s.golem;
  if (gx(g).minionCall) {
    gx(g).minionCall = 0;
    spawnMinions(s, MINION.count);
  }
  const h = s.hero;
  const golemGone = g.action === 'dying' || g.action === 'dead';
  for (let i = 0; i < s.minions.length; i++) {
    const m = s.minions[i]!;
    if (m.action === 'inactive') continue;
    m.actionFrame++;
    if (m.action === 'dead') continue;
    if (m.hitFlash > 0) m.hitFlash--;
    if (m.hp <= 0 || golemGone) {
      pop(s, m);
      continue;
    }
    if (m.action === 'spawn') {
      const t = Math.min(1, m.actionFrame / MINION.spawnFrames);
      m.pos.x = mx(m).fromX + (mx(m).toX - mx(m).fromX) * t;
      m.pos.z = mx(m).fromZ + (mx(m).toZ - mx(m).fromZ) * t;
      if (t >= 1) set(m, 'chase');
      continue;
    }
    // A fresh hero hit (combat sets hitFlash = 6) makes it flinch back.
    if (m.hitFlash > mx(m).seenFlash && m.hitFlash >= 5) {
      set(m, 'hurt');
      mx(m).struck = 0;
    }
    mx(m).seenFlash = m.hitFlash;
    if (s.phase !== 'fight') continue;

    const dx = h.pos.x - m.pos.x, dz = h.pos.z - m.pos.z;
    const d = Math.hypot(dx, dz);
    if (m.action === 'hurt') {
      const k = (1 - m.actionFrame / MINION.hurtFrames) * 3 * STEP_S;
      if (d > 1e-6) {
        m.pos.x -= (dx / d) * k;
        m.pos.z -= (dz / d) * k;
      }
      if (m.actionFrame >= MINION.hurtFrames) set(m, 'chase');
    } else if (m.action === 'chase') {
      // After a bump it backs off for a moment (lockout) before it may squash again.
      m.facing = turnToward(m.facing, facingOf(dx, dz), 8 * STEP_S);
      if (mx(m).lockout > 0) mx(m).lockout--;
      if (d <= MINION.reach && mx(m).lockout === 0 && h.action !== 'dead') set(m, 'windup');
      else if (h.action !== 'dead' && d > MINION.reach * 0.8) {
        const sp = MINION.speed * STEP_S * (mx(m).lockout > 0 ? 0.35 : 1);
        m.pos.x += dirX(m.facing) * sp;
        m.pos.z += dirZ(m.facing) * sp;
      }
    } else if (m.action === 'windup') {
      m.facing = turnToward(m.facing, facingOf(dx, dz), 4 * STEP_S);
      if (m.actionFrame >= MINION.windupFrames) {
        set(m, 'strike');
        mx(m).struck = 0;
      }
    } else if (m.action === 'strike') {
      // The bump: a short lunge; one hurt per strike.
      const sp = 3.5 * STEP_S;
      m.pos.x += dirX(m.facing) * sp;
      m.pos.z += dirZ(m.facing) * sp;
      if (!mx(m).struck && d <= MINION.reach + 0.35 && hurtHero(s, MINION.damage, m.pos, 'minion')) mx(m).struck = 1;
      if (m.actionFrame >= MINION.strikeFrames) {
        set(m, 'chase');
        mx(m).lockout = MINION.recoverFrames;
      }
    }
    if (g.action !== 'dead') pushOutOfCircle(m.pos, MINION.radius, g.pos.x, g.pos.z, GOLEM.radius);
    for (let j = 0; j < s.minions.length; j++) {
      if (j === i) continue;
      const o = s.minions[j]!;
      if (o.action === 'inactive' || o.action === 'dead') continue;
      pushOutOfCircle(m.pos, MINION.radius, o.pos.x, o.pos.z, MINION.radius);
    }
    collideStatic(m.pos, MINION.radius);
  }
}
