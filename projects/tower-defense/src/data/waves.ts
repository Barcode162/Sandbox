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
  R(2, [['dot', 30, 0.6, 0]], 30, 782, 'a second tower'),
  R(3, [['dot', 20, 0.5, 0], ['drop', 10, 0.9, 4]], 40, 936, 'Drop: see the peel'),
  R(4, [['drop', 25, 0.6, 0], ['dot', 15, 0.4, 6]], 65, 1112, 'density'),
  R(5, [['drop', 30, 0.45, 0], ['splat', 6, 1.2, 8]], 78, 1325, 'Splat: stacking layers'),
  R(6, [['splat', 16, 0.7, 0], ['drop', 24, 0.4, 3]], 96, 1563, 'first upgrade'),
  R(7, [['splat', 20, 0.6, 0], ['drop', 8, 1.0, 6, true]], 76, 1831, 'Pale: Koi or Owl'),
  R(8, [['splash', 10, 0.9, 0], ['splat', 24, 0.4, 4]], 112, 2091, 'Splash: speed'),
  R(9, [['streak', 6, 1.5, 0], ['splash', 16, 0.6, 5]], 106, 2399, 'Streak: range and pierce'),
  R(10, [['wax', 4, 2.0, 0], ['splat', 30, 0.3, 2], ['drop', 40, 0.2, 8]], 206, 2713, 'Wax: Crush or Glare'),
  R(11, [['blotch', 12, 0.8, 0], ['splat', 12, 0.6, 6, true]], 96, 3139, 'Blotch; breather'),
  R(12, [['wax', 5, 1.6, 0], ['splash', 16, 0.45, 3]], 109, 3467, 'Wax in numbers'),
  R(13, [['streak', 14, 0.7, 0], ['blotch', 16, 0.6, 4]], 178, 3820, 'commit to a tier 3'),
  R(14, [['splash', 6, 1.0, 0, true], ['wax', 5, 1.4, 5], ['dot', 60, 0.08, 10]], 129, 4254, 'mixed answers'),
  R(15, [['knot', 2, 3.0, 0], ['blotch', 30, 0.3, 3]], 210, 4651, 'Knot: sustained damage'),
  R(16, [['blotch', 6, 0.8, 0, true], ['wax', 6, 1.0, 4], ['streak', 12, 0.5, 10]], 168, 5141, 'detection coverage'),
  R(17, [['knot', 5, 2.0, 0], ['splash', 60, 0.15, 2]], 390, 5601, 'AoE + single-target'),
  R(18, [['blotch', 90, 0.08, 0], ['dot', 240, 0.03, 2], ['wax', 10, 0.8, 4], ['streak', 12, 0.6, 8, true]], 864, 6295, 'The Storm (~300 on screen)'),
  R(19, [['knot', 10, 1.2, 0], ['blotch', 40, 0.2, 3, true], ['streak', 24, 0.3, 8]], 668, 7475, 'aftershock'),
  R(20, [['blotch', 60, 0.15, 0], ['knot', 6, 1.5, 6], ['inkmaw', 1, 0, 14]], 480, 8471, 'Inkmaw: boss damage'),
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
