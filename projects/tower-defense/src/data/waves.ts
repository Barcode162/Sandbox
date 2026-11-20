// §8 wave table, transcribed exactly. FROZEN (WO-001). Late-round count knob lives in data/balance.ts.
import type { BlotKind, RoundDef, WaveGroup } from '../contracts/types';

/** Compact group: [kind, count, spacing s, delay s, pale?]. */
type G = [BlotKind, number, number, number, boolean?];
const g = ([kind, count, spacing, delay, pale]: G): WaveGroup => ({ kind, count, spacing, delay, pale: !!pale });
const R = (round: number, groups: G[], rbe: number, cashAtStart: number, note: string): RoundDef => ({
  round, groups: groups.map(g), rbe, cashAtStart, note,
});

export const ROUNDS: readonly RoundDef[] = [
  R(1, [['dot', 20, 0.8, 0]], 20, 650, 'place one Tern'),
  R(2, [['dot', 30, 0.6, 0]], 30, 780, 'a second tower'),
  R(3, [['dot', 20, 0.5, 0], ['drop', 10, 0.9, 4]], 40, 930, 'Drop: see the peel'),
  R(4, [['drop', 25, 0.6, 0], ['dot', 15, 0.4, 6]], 65, 1100, 'density'),
  R(5, [['drop', 30, 0.45, 0], ['splat', 6, 1.2, 8]], 78, 1305, 'Splat: stacking layers'),
  R(6, [['splat', 16, 0.7, 0], ['drop', 24, 0.4, 3]], 96, 1533, 'first upgrade'),
  R(7, [['splat', 20, 0.6, 0], ['drop', 8, 1.0, 6, true]], 76, 1789, 'Pale: Koi or Owl'),
  R(8, [['splash', 10, 0.9, 0], ['splat', 24, 0.4, 4]], 112, 2035, 'Splash: speed'),
  R(9, [['streak', 6, 1.5, 0], ['splash', 16, 0.6, 5]], 106, 2327, 'Streak: range and pierce'),
  R(10, [['wax', 4, 2.0, 0], ['splat', 30, 0.3, 2], ['drop', 40, 0.2, 8]], 206, 2623, 'Wax: Crush or Glare'),
  R(11, [['blotch', 12, 0.8, 0], ['splat', 12, 0.6, 6, true]], 96, 3029, 'Blotch; breather'),
  R(12, [['wax', 8, 1.2, 0], ['splash', 28, 0.35, 3]], 184, 3335, 'Wax in numbers'),
  R(13, [['streak', 14, 0.7, 0], ['blotch', 22, 0.45, 4]], 208, 3739, 'commit to a tier 3'),
  R(14, [['splash', 20, 0.5, 0, true], ['wax', 10, 1.0, 5], ['dot', 60, 0.08, 10]], 230, 4177, 'mixed answers'),
  R(15, [['knot', 2, 3.0, 0], ['blotch', 30, 0.3, 3]], 210, 4647, 'Knot: sustained damage'),
  R(16, [['blotch', 20, 0.4, 0, true], ['wax', 14, 0.7, 4], ['streak', 12, 0.5, 10]], 310, 5107, 'detection coverage'),
  R(17, [['knot', 5, 2.0, 0], ['splash', 60, 0.15, 2]], 390, 5677, 'AoE + single-target'),
  R(18, [['blotch', 150, 0.07, 0], ['dot', 120, 0.05, 2], ['wax', 20, 0.5, 4], ['streak', 12, 0.6, 8, true]], 1134, 6337, 'The Storm (~300 on screen)'),
  R(19, [['knot', 10, 1.2, 0], ['blotch', 40, 0.2, 3, true], ['streak', 24, 0.3, 8]], 668, 7751, 'aftershock'),
  R(20, [['blotch', 60, 0.15, 0], ['knot', 6, 1.5, 6], ['inkmaw', 1, 0, 14]], 480, 8709, 'Inkmaw: boss damage'),
];

/** §10.6: the boss warning fires this many seconds before the boss group's delay. */
export const BOSS_WARNING_LEAD_S = 2;
/** Rounds from which the Storm music state plays (§12). */
export const STORM_FROM_ROUND = 15;
/** R16–R19 are scaled by BALANCE.lateCountMul (§8 knob 2). */
export const LATE_KNOB_ROUNDS = [16, 17, 18, 19] as const;

/** §14 first-encounter banners (once per kind). Pale has its own line. */
export const FIRST_SEEN_LINES: Partial<Record<BlotKind | 'pale', string>> = {
  pale: 'Pale ink slips past plain eyes. Bring a lantern.',
  wax: 'Wax sheds blades and water.',
  inkmaw: 'Something large is spilling.',
};
