// §8 economy helpers. Signatures FROZEN by WO-001.
import type { SimState, Tower } from '../contracts/types';
import { ECONOMY } from '../data/economy';

/**
 * Sell value: 70 % of everything spent, or 100 % for a fresh fold (§8). Rounded down (interpretation c).
 * Fresh-fold lifecycle: a tower placed during an intermission is fresh until that round starts; a tower
 * placed mid-round is never fresh (sim/index.ts addTower and beginRound).
 */
export function sellValue(_state: Readonly<SimState>, tower: Readonly<Tower>): number {
  return Math.floor(tower.spent * (tower.fresh ? ECONOMY.freshRefundRate : ECONOMY.sellRate));
}
