// src/hero/combat.ts — owned by WO-003. Resolves the hero's open hitbox against golem + minions:
// damage roll (seeded crits), poise, hit-flash, hit-stop, 'hit' events. Pure: no three/DOM.
// FROZEN signature: resolveHeroAttacks (called by core/sim.ts after stepHero).
import type { Intent, SimState, Vec2 } from '../contracts.ts';
import { HERO } from '../tuning/hero.ts';
import { GOLEM, MINION } from '../tuning/golem.ts';
import { chance, randRange } from '../core/rng.ts';
import { dirX, dirZ } from '../core/math.ts';
import { comboIndex, isHeroAttackActive } from './sim.ts';

function inArc(s: SimState, target: Vec2, targetRadius: number, reach: number, arcDeg: number): boolean {
  const h = s.hero;
  const dx = target.x - h.pos.x, dz = target.z - h.pos.z;
  const d = Math.hypot(dx, dz);
  if (d > reach + targetRadius) return false;
  if (d < targetRadius) return true;
  const cos = (dx * dirX(h.facing) + dz * dirZ(h.facing)) / d;
  return cos >= Math.cos(((arcDeg / 2) * Math.PI) / 180);
}

/** Seeded crit roll honouring flags.forceCrit (the roll is consumed either way so streams stay aligned). */
export function rollCrit(s: SimState): boolean {
  const c = chance(s, HERO.critChance);
  return s.flags.forceCrit < 0 ? c : s.flags.forceCrit > 0;
}

export function resolveHeroAttacks(s: SimState, _intent: Readonly<Intent>): void {
  const h = s.hero;
  if (s.phase !== 'fight' || !isHeroAttackActive(h)) return;
  const i = comboIndex(h.action);
  const c = HERO.combo[i]!;
  const kind = (['combo1', 'combo2', 'combo3'] as const)[i]!;
  const g = s.golem;
  const golemHittable = g.action !== 'dormant' && g.action !== 'dying' && g.action !== 'dead';
  if (golemHittable && !(h.swingHits & 1) && inArc(s, g.pos, GOLEM.radius, c.reach, c.arcDeg)) {
    h.swingHits |= 1;
    const crit = rollCrit(s);
    const amount = s.flags.forceDamage > 0 ? s.flags.forceDamage : Math.round(c.damage * randRange(s, 1 - HERO.damageJitter, 1 + HERO.damageJitter) * (crit ? HERO.critMult : 1));
    g.hp = Math.max(0, g.hp - amount);
    g.poise -= c.poise;
    g.hitFlash = 6;
    g.hitsTaken++;
    s.hitstop = Math.max(s.hitstop, crit ? c.hitstop + 2 : c.hitstop);
    s.events.push({ type: 'hit', attacker: 'hero', target: 'golem', targetId: 0, amount, crit, kind, pos: { x: g.pos.x, z: g.pos.z }, y: 2.2 });
  }
  for (let m = 0; m < s.minions.length; m++) {
    const mn = s.minions[m]!;
    const bit = 1 << (m + 1);
    if (mn.action === 'inactive' || mn.action === 'dead' || mn.action === 'spawn' || h.swingHits & bit) continue;
    if (!inArc(s, mn.pos, MINION.radius, c.reach, c.arcDeg)) continue;
    h.swingHits |= bit;
    const crit = rollCrit(s);
    const amount = s.flags.forceDamage > 0 ? s.flags.forceDamage : Math.round(c.damage * (crit ? HERO.critMult : 1));
    mn.hp = Math.max(0, mn.hp - amount);
    mn.hitFlash = 6;
    s.hitstop = Math.max(s.hitstop, c.hitstop);
    s.events.push({ type: 'hit', attacker: 'hero', target: 'minion', targetId: mn.id, amount, crit, kind, pos: { x: mn.pos.x, z: mn.pos.z }, y: 0.8 });
  }
}
