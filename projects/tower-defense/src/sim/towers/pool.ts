// Projectile pool helpers (WO-003). Board condition 4: a full pool drops the overflow
// deterministically (no throw) and counts every drop per sim, so the core can fold it into stateHash.
import type { Pool, Projectile, SimState } from '../../contracts/types';

const DROPS = new WeakMap<object, { n: number }>();

/** Projectiles dropped because the pool was full, for this sim's state (0 if never). */
export function projectileDrops(state: Readonly<SimState>): number {
  return DROPS.get(state)?.n ?? 0;
}

function countDrop(state: SimState): void {
  const d = DROPS.get(state);
  if (d) d.n++;
  else DROPS.set(state, { n: 1 });
}

/**
 * Claim the next free pooled projectile, reset to neutral values, or return null and count a drop when
 * the pool is full. Never allocates once the pool exists.
 */
export function spawnProjectile(state: SimState): Projectile | null {
  const pool = state.projectiles;
  if (pool.count >= pool.items.length) {
    countDrop(state);
    return null;
  }
  const p = pool.items[pool.count++];
  p.id = 0; p.towerId = 0; p.x = 0; p.y = 0; p.px = 0; p.py = 0; p.vx = 0; p.vy = 0; p.angle = 0;
  p.damage = 0; p.damageType = 'cut'; p.pierceLeft = 0; p.travelled = 0; p.maxTravel = 0;
  p.detect = false; p.areaClass = false; p.slowPct = 0; p.slowDur = 0; p.hitCount = 0;
  p.sx = 0; p.sy = 0; p.tx = 0; p.ty = 0; p.t = 0; p.arcTicks = 0; p.splashRadius = 0; p.splashMax = 0;
  p.stun = 0; p.skipsLeft = 0;
  return p;
}

/** Swap-remove index i from the dense pool (the object is kept for reuse). */
export function removeProjectile(pool: Pool<Projectile>, i: number): void {
  const last = pool.count - 1;
  if (i !== last) {
    const tmp = pool.items[i];
    pool.items[i] = pool.items[last];
    pool.items[last] = tmp;
  }
  pool.count = last;
}
