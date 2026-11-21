// Pool capacity and deterministic overflow (board condition 4).
// When a 2048 pool is full, the extra blot or projectile is dropped: no throw, no reallocation. Each
// drop is counted, and the counters are folded into stateHash, so two runs that drop differently can
// never hash the same.
import type { Projectile, SimState } from '../contracts/types';
import { projectileDrops } from './towers/pool';

export const BLOT_CAPACITY = 2048;
export const PROJECTILE_CAPACITY = 2048;

export interface PoolOverflow { blots: number; projectiles: number }

/** The sim's state object as built by createSim: the frozen SimState plus core bookkeeping. */
export interface CoreState extends SimState {
  readonly overflow: PoolOverflow;
}

/**
 * Drop counters for a state (zeros for a state that did not come from createSim). Projectile drops are the
 * sum of this module's acquireProjectile (bench) and WO-003's spawnProjectile (towers/pool.ts) counters.
 */
export function overflowOf(state: Readonly<SimState>): Readonly<PoolOverflow> {
  const o = (state as Partial<CoreState>).overflow;
  return { blots: o?.blots ?? 0, projectiles: (o?.projectiles ?? 0) + projectileDrops(state) };
}

/**
 * Take the next free projectile slot, or count a drop and return null when the pool is full.
 * Returns the reused object at index `count` (fields still hold the previous occupant's values; the
 * caller overwrites them). WO-003 should acquire projectiles through this.
 */
export function acquireProjectile(state: SimState): Projectile | null {
  const pool = state.projectiles;
  if (pool.count >= pool.items.length) {
    const o = (state as Partial<CoreState>).overflow;
    if (o) o.projectiles++;
    return null;
  }
  return pool.items[pool.count++];
}
