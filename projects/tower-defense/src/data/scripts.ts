// §8 reference win script and loss script. FROZEN (WO-001).
// Tower ids are 1-based placement order: T1, T2 = Terns, 3 = Koi, 4 = Owl, 5 = Frog.
// Commands for round r are issued during the intermission before r, then the bot starts the round.
import type { Command, RoundScript, TowerKind, UpgradePath } from '../contracts/types';

const place = (kind: TowerKind, x: number, y: number): Command => ({ type: 'place', kind, x, y });
const up = (towerId: number, path: UpgradePath): Command => ({ type: 'upgrade', towerId, path });
const A = 0, B = 1;

export const WIN_SCRIPT: RoundScript = {
  1: [place('tern', 340, 510), place('tern', 560, 300)],
  2: [up(1, A)],
  4: [place('koi', 280, 554)],
  6: [place('owl', 860, 360)],
  8: [up(1, A)],
  10: [place('frog', 760, 300)],
  12: [up(5, A)],
  13: [up(2, A)],
  14: [up(1, A)],
  15: [up(3, B), up(4, A)],
  16: [up(5, A)],
  17: [up(3, B), up(4, A)],
  18: [up(2, B)],
  19: [up(5, A)],
  20: [up(4, A), up(3, A)],
};
/** Spec: spend 8,340 vs 8,709 available; win with ≥ 40 seeds. */
export const WIN_SCRIPT_SPEND = 8340;
export const WIN_MIN_SEEDS = 40;

/** Spec: the same two Terns, never upgraded → game over by R12. */
export const LOSS_SCRIPT: RoundScript = { 1: [place('tern', 340, 510), place('tern', 560, 300)] };
export const LOSS_BY_ROUND = 12;

export const SCRIPTS = { win: WIN_SCRIPT, loss: LOSS_SCRIPT } as const;
export const SCRIPT_SEED = 1;
