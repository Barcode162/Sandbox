// §8 economy helpers — STUB (WO-002 implements). Signatures FROZEN by WO-001.
import type { SimState, Tower } from '../contracts/types';
import { ECONOMY } from '../data/economy';

/** Sell value: 70 % of everything spent, or 100 % for a fresh fold (§8). Rounded down. */
export function sellValue(_state: Readonly<SimState>, tower: Readonly<Tower>): number {
  // TODO(WO-002): confirm rounding + fresh-fold lifecycle in tests.
  return Math.floor(tower.spent * (tower.fresh ? ECONOMY.freshRefundRate : ECONOMY.sellRate));
}
