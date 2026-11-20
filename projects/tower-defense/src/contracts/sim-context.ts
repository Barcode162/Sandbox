// FROZEN internal contract between the sim core (WO-002, src/sim/*) and the tower systems
// (WO-003, src/sim/towers/*). The core owns blots, the grid, peel and money; towers own aiming,
// firing, projectiles and auras, and touch blots only through this context.
import type { Blot, DamageType, SimEvent, SimState, Tower } from './types';
import type { Rng } from '../sim/rng';
import type { MutVec } from '../sim/path';

export type HitResult = 'none' | 'damaged' | 'popped' | 'immune';

export interface SimContext {
  readonly state: SimState;
  readonly rng: Rng;
  /**
   * Live blots whose circle overlaps the query circle (centre distance ≤ r + blot.radius), from the
   * spatial grid rebuilt after movement this tick. Writes pool indices into `out`; returns the count
   * (≤ out.length). Indices are stable for the whole tick (dead blots are compacted at tick end).
   */
  queryBlots(x: number, y: number, r: number, out: Int32Array): number;
  /** Pool index → blot (shorthand for state.blots.items[i]). */
  blotAt(index: number): Blot;
  /**
   * Apply one hit under the §6 peel rules: immunity (type and immuneTo === sourceId), multipliers
   * are the caller's job (pass the final d), overflow to child 0, children at s − 6k, money,
   * tower.pops, hit-stop, boss sheds, and all resulting events. Never call on a dead blot.
   */
  hit(blot: Blot, damage: number, type: DamageType, sourceId: number, tower: Tower, dirX: number, dirY: number): HitResult;
  /** Strongest slow wins and refreshes (§7 Koi); boss capped at 20 % (§6 rule 5). */
  slow(blot: Blot, pct: number, ticks: number): void;
  /** Freeze (speed 0); Wax/Knot/Inkmaw get slowed instead (§7 Glacier Carp). */
  freeze(blot: Blot, ticks: number, fallbackSlowPct: number): void;
  /** Stun (speed 0); ignored on Knot and Inkmaw (§7 Boulder Toad, §6 rule 5). */
  stun(blot: Blot, ticks: number): void;
  /** May this tower target / its non-area projectiles collide with this blot? (Pale vs detect + aura buff.) */
  canSee(tower: Tower, blot: Blot): boolean;
  emit(e: SimEvent): void;
  /** Fresh id for a projectile, pulse or beam volley (used as the hit sourceId / child immuneTo). */
  nextSourceId(): number;
  pointAt(s: number, out: MutVec): MutVec;
  tangentAt(s: number, out: MutVec): MutVec;
}
