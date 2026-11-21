// Deterministic state hash: FNV-1a over quantised state (every live blot, tower and projectile, the
// economy, the phase, hit-stop and the pool overflow counters of board condition 4).
import type { BlotKind, Phase, SimState, TargetMode, TowerKind } from '../contracts/types';
import { overflowOf } from './pool';

const KIND: Readonly<Record<BlotKind, number>> = { dot: 0, drop: 1, splat: 2, splash: 3, blotch: 4, streak: 5, wax: 6, knot: 7, inkmaw: 8 };
const TKIND: Readonly<Record<TowerKind, number>> = { tern: 0, frog: 1, koi: 2, owl: 3 };
const PHASE: Readonly<Record<Phase, number>> = { intermission: 0, round: 1, victory: 2, defeat: 3 };
const MODE: Readonly<Record<TargetMode, number>> = { first: 0, last: 1, strong: 2, close: 3 };

export function stateHash(s: Readonly<SimState>): string {
  let h = 0x811c9dc5;
  const mix = (n: number): void => {
    let v = Math.round(n * 1000) | 0;
    for (let i = 0; i < 4; i++) { h ^= v & 0xff; h = Math.imul(h, 0x01000193); v >>>= 8; }
  };
  mix(s.tick); mix(s.round); mix(PHASE[s.phase]); mix(s.lives); mix(s.money); mix(s.hitStop); mix(s.roundTick);
  mix(s.autoStart ? 1 : 0);
  mix(s.stats.pops); mix(s.stats.leaked); mix(s.stats.spent); mix(s.stats.earned);
  const o = overflowOf(s);
  mix(o.blots); mix(o.projectiles);
  const bs = s.blots.items;
  mix(s.blots.count);
  for (let i = 0; i < s.blots.count; i++) {
    const b = bs[i];
    mix(b.id); mix(b.alive ? 1 : 0); mix(KIND[b.kind]); mix(b.hp); mix(b.s); mix(b.pale ? 1 : 0);
    mix(b.slow); mix(b.slowTicks); mix(b.frozenTicks); mix(b.stunTicks); mix(b.immuneTo); mix(b.nextShed);
  }
  mix(s.towers.length);
  for (const t of s.towers) {
    mix(t.id); mix(TKIND[t.kind]); mix(t.x); mix(t.y); mix(t.tiers[0]); mix(t.tiers[1]); mix(MODE[t.target]);
    mix(t.angle); mix(t.cooldown); mix(t.spent); mix(t.pops); mix(t.shots); mix(t.targetId); mix(t.fresh ? 1 : 0);
  }
  const ps = s.projectiles.items;
  mix(s.projectiles.count);
  for (let i = 0; i < s.projectiles.count; i++) {
    const p = ps[i];
    mix(p.id); mix(p.x); mix(p.y); mix(p.pierceLeft);
  }
  if (s.boss) { mix(s.boss.blotId); mix(s.boss.hp); mix(s.boss.nextShed); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
