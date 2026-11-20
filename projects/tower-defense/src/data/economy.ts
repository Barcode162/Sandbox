// §8 Economy, transcribed exactly. FROZEN (WO-001).
import type { EconomyDef } from '../contracts/types';
import { BALANCE } from './balance';

export const ECONOMY: EconomyDef = {
  startMoney: 650,
  startLives: 100,
  bonusBase: 100,
  bonusPerRound: BALANCE.bonusPerRound,
  sellRate: 0.7,
  freshRefundRate: 1.0,
  autoStartDelay: 1.5,
  rounds: 20,
};

export function roundBonus(r: number): number {
  return ECONOMY.bonusBase + ECONOMY.bonusPerRound * r;
}
