// src/hero/combat.ts — owned by WO-003. Resolves the hero's open hitbox (combo swing or Gale Crescent tick) against
// golem + minions: seeded damage + crit roll, stagger/perfect-dodge multipliers, poise, hit-flash, hit-stop, 'hit'
// events. Pure: no three/DOM. FROZEN signatures: resolveHeroAttacks, rollCrit (called by core/sim.ts).
import type { AttackKind, Intent, SimState, Vec2 } from '../contracts.ts';
import { HERO, msToFrames } from '../tuning/hero.ts';
import { GOLEM, MINION } from '../tuning/golem.ts';
import { chance, randRange } from '../core/rng.ts';
import { dirX, dirZ } from '../core/math.ts';
import { comboIndex, isHeroAttackActive, skillTick } from './sim.ts';

/** Target circle (centre, radius) within `reach` of its surface and inside the swing arc (arcDeg 360 = all round). */
export function inArc(s: SimState, target: Vec2, targetRadius: number, reach: number, arcDeg: number): boolean {
  const h = s.hero;
  const dx = target.x - h.pos.x, dz = target.z - h.pos.z;
  const d = Math.hypot(dx, dz);
  if (d > reach + targetRadius) return false;
  if (d < targetRadius || arcDeg >= 360) return true;
  // Accept if any part of the target circle is inside the arc (angular half-width widened by the target's size).
  const half = ((arcDeg / 2) * Math.PI) / 180 + Math.asin(Math.min(1, targetRadius / d));
  const cos = (dx * dirX(h.facing) + dz * dirZ(h.facing)) / d;
  return cos >= Math.cos(Math.min(Math.PI, half));
}

/** Seeded crit roll honouring flags.forceCrit (the roll is consumed either way so streams stay aligned). */
export function rollCrit(s: SimState): boolean {
  const c = chance(s, HERO.critChance);
  return s.flags.forceCrit < 0 ? c : s.flags.forceCrit > 0;
}

/** Hit-stop in steps for a landed hit (§5: 60/70/120 ms per combo hit, skill 60 ms; crit +40 ms). */
export function hitstopFrames(kind: AttackKind, crit: boolean): number {
  const ms = kind === 'combo1' ? HERO.combo[0]!.hitstopMs : kind === 'combo2' ? HERO.combo[1]!.hitstopMs : kind === 'combo3' ? HERO.combo[2]!.hitstopMs : HERO.skill.hitstopMs;
  return msToFrames(ms + (crit ? HERO.critHitstopMs : 0));
}

const KINDS = ['combo1', 'combo2', 'combo3'] as const;

export function resolveHeroAttacks(s: SimState, _intent: Readonly<Intent>): void {
  const h = s.hero;
  if (s.phase !== 'fight' || !isHeroAttackActive(h)) return;
  const ci = comboIndex(h.action);
  const tick = skillTick(h);
  if (tick >= 0) h.swingHits = 0; // each Gale Crescent tick may hit everything again
  const isSkill = ci < 0;
  const kind: AttackKind = isSkill ? 'skill' : KINDS[ci]!;
  const reach = isSkill ? HERO.skill.radius : HERO.reach;
  const arc = isSkill ? 360 : HERO.arcDeg;
  const dmgMin = isSkill ? HERO.skill.damageMin : HERO.combo[ci]!.damageMin;
  const dmgMax = isSkill ? HERO.skill.damageMax : HERO.combo[ci]!.damageMax;
  const poise = isSkill ? HERO.skill.poise : HERO.combo[ci]!.poise;
  let landed = false;

  const g = s.golem;
  const golemHittable = g.action !== 'dormant' && g.action !== 'dying' && g.action !== 'dead';
  if (golemHittable && !(h.swingHits & 1) && inArc(s, g.pos, GOLEM.radius, reach, arc)) {
    h.swingHits |= 1;
    const crit = rollCrit(s);
    const roll = randRange(s, dmgMin, dmgMax);
    const mult = (crit ? HERO.critMult : 1) * (g.action === 'stagger' ? HERO.staggerMult : 1) * (h.ext.perfectBonus ? HERO.perfectBonus : 1);
    const amount = s.flags.forceDamage > 0 ? s.flags.forceDamage : Math.round(roll * mult);
    g.hp = Math.max(0, g.hp - amount);
    g.poise -= poise; // the golem sim decides when ≤ 0 becomes a stagger (§5: never mid-telegraph)
    g.hitFlash = 6;
    g.hitsTaken++;
    s.hitstop = Math.max(s.hitstop, hitstopFrames(kind, crit));
    // Hit point: the golem's surface toward the hero.
    const dx = h.pos.x - g.pos.x, dz = h.pos.z - g.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    s.events.push({ type: 'hit', attacker: 'hero', target: 'golem', targetId: 0, amount, crit, kind, pos: { x: g.pos.x + (dx / d) * GOLEM.radius * 0.8, z: g.pos.z + (dz / d) * GOLEM.radius * 0.8 }, y: kind === 'combo3' ? 1.6 : 1.9 });
    landed = true;
  }
  for (let m = 0; m < s.minions.length; m++) {
    const mn = s.minions[m]!;
    const bit = 1 << (m + 1);
    if (mn.action === 'inactive' || mn.action === 'dead' || mn.action === 'spawn' || h.swingHits & bit) continue;
    if (!inArc(s, mn.pos, MINION.radius, reach, arc)) continue;
    h.swingHits |= bit;
    const crit = rollCrit(s);
    const roll = randRange(s, dmgMin, dmgMax);
    const amount = s.flags.forceDamage > 0 ? s.flags.forceDamage : Math.round(roll * (crit ? HERO.critMult : 1) * (h.ext.perfectBonus ? HERO.perfectBonus : 1));
    mn.hp = Math.max(0, mn.hp - amount);
    mn.hitFlash = 6;
    s.hitstop = Math.max(s.hitstop, hitstopFrames(kind, crit));
    s.events.push({ type: 'hit', attacker: 'hero', target: 'minion', targetId: mn.id, amount, crit, kind, pos: { x: mn.pos.x, z: mn.pos.z }, y: 0.5 });
    landed = true;
  }
  if (landed) h.ext.perfectBonus = 0;
}
