// §8 tuning knobs, in the order the spec allows them to move. Owned by WO-002 (the only data file
// a slice may edit). Never touch tower tables to balance (§8).
export const BALANCE = {
  /** Inkmaw HP (spec 2400; knob ±400). */
  inkmawHp: 2400,
  /** Multiplier on group counts for R16–R19 (knob ±20 %). Applied by the wave system, rounded. */
  lateCountMul: 1.0,
  /** End-of-round bonus slope (10·r; knob ±2). */
  bonusPerRound: 10,
} as const;
