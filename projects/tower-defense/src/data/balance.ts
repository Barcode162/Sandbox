// §8 tuning knobs, in the order the spec allows them to move. Owned by WO-002 (the only data file
// a slice may edit). Never touch tower tables to balance (§8).
export const BALANCE = {
  /** Inkmaw HP (spec 2400; knob ±400). M-0002 balance pass: 1400 (CEO lifted the ±400 limit). */
  inkmawHp: 1400,
  /** Multiplier on group counts for R16–R19 (knob ±20 %). Applied by the wave system, rounded. */
  lateCountMul: 1.0,
  /** End-of-round bonus slope (10·r; knob ±2). M-0002 balance pass: 12. */
  bonusPerRound: 12,
  /** Multiplier on every tower interval, applied in resolveStats (CEO-granted ±15 %). M-0002 balance pass: 0.87 (+14.9 % fire rate). */
  towerIntervalMul: 0.87,
} as const;
