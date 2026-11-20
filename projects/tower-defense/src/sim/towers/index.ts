// Tower systems — STUB (WO-003 implements). Signatures FROZEN by WO-001.
import type { SimContext } from '../../contracts/sim-context';
import type { Projectile, SimState, Tower, TowerKind, UpgradePath } from '../../contracts/types';
import { TOWERS, tiersValid } from '../../data/towers';

/** Recompute Owl aura buffs on every tower (best aura wins, never stacks). Called once per tick before updateTowers. */
export function updateAuras(_ctx: SimContext): void {
  // TODO(WO-003)
}

/** Turn (720°/s), pick targets (§7 Targeting), fire when cooldown ≤ 0; spawn projectiles / pulses / beams. */
export function updateTowers(_ctx: SimContext): void {
  // TODO(WO-003)
}

/** Move projectiles, collide via ctx.queryBlots, land stones (splash, skips), expire. */
export function updateProjectiles(_ctx: SimContext): void {
  // TODO(WO-003)
}

/** Allocate the projectile pool (capacity 2048) for a new sim. */
export function createProjectile(): Projectile {
  return {
    id: 0, kind: 'quill', towerId: 0, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, angle: 0, damage: 0, damageType: 'cut',
    pierceLeft: 0, travelled: 0, maxTravel: 0, detect: false, areaClass: false, multVs: {}, slowPct: 0, slowDur: 0,
    hitIds: new Int32Array(16), hitCount: 0, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, arcTicks: 0, splashRadius: 0,
    splashMax: 0, stun: 0, skipsLeft: 0,
  };
}

export type TierStatus = 'owned' | 'next' | 'sealed' | 'max' | 'locked';
export interface TierView { status: TierStatus; cost: number; affordable: boolean; shortBy: number }

/** Fold-card view of one tier box (§10.4). Pure; used by UI and by the sim's upgrade command. */
export function tierStatus(state: Readonly<SimState>, tower: Readonly<Tower>, path: UpgradePath, tier: 1 | 2 | 3): TierView {
  const def = TOWERS[tower.kind].paths[path][tier - 1];
  const cur = tower.tiers[path];
  const next: [number, number] = [tower.tiers[0], tower.tiers[1]];
  next[path] = tier;
  let status: TierStatus;
  if (tier <= cur) status = 'owned';
  else if (!tiersValid(next[0], next[1])) status = 'sealed';
  else if (tier === cur + 1) status = 'next';
  else status = 'locked';
  const shortBy = Math.max(0, def.cost - state.money);
  return { status, cost: def.cost, affordable: shortBy === 0, shortBy };
}

/** Base cost lookup for cards (§9). */
export function towerCost(kind: TowerKind): number {
  return TOWERS[kind].cost;
}
