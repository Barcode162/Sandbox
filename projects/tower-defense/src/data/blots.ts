// §6 Blots, transcribed exactly. FROZEN (WO-001). Inkmaw HP is a balance knob: see data/balance.ts.
import type { BlotDef, BlotKind } from '../contracts/types';
import { BALANCE } from './balance';

type Raw = Omit<BlotDef, 'rbe'>;
const none = [] as const;

const RAW: Record<BlotKind, Raw> = {
  dot: { kind: 'dot', name: 'Dot', shape: 'disc', lobes: 0, pips: 1, radius: 9, speed: 80, hp: 1, children: none, sheetsPerHp: 1, firstRound: 1, color: 'l1', immuneTo: none, paleEligible: false, popHz: 880, boss: false, shedAt: none, shed: null },
  drop: { kind: 'drop', name: 'Drop', shape: 'lobed', lobes: 3, pips: 2, radius: 10, speed: 104, hp: 1, children: [{ kind: 'dot', count: 1 }], sheetsPerHp: 1, firstRound: 3, color: 'l2', immuneTo: none, paleEligible: true, popHz: 784, boss: false, shedAt: none, shed: null },
  splat: { kind: 'splat', name: 'Splat', shape: 'lobed', lobes: 4, pips: 3, radius: 11, speed: 128, hp: 1, children: [{ kind: 'drop', count: 1 }], sheetsPerHp: 1, firstRound: 5, color: 'l3', immuneTo: none, paleEligible: true, popHz: 659, boss: false, shedAt: none, shed: null },
  splash: { kind: 'splash', name: 'Splash', shape: 'lobed', lobes: 5, pips: 4, radius: 12, speed: 160, hp: 1, children: [{ kind: 'splat', count: 1 }], sheetsPerHp: 1, firstRound: 8, color: 'l4', immuneTo: none, paleEligible: true, popHz: 587, boss: false, shedAt: none, shed: null },
  blotch: { kind: 'blotch', name: 'Blotch', shape: 'lobed', lobes: 6, pips: 5, radius: 13, speed: 184, hp: 1, children: [{ kind: 'splash', count: 1 }], sheetsPerHp: 1, firstRound: 11, color: 'l5', immuneTo: none, paleEligible: true, popHz: 523, boss: false, shedAt: none, shed: null },
  streak: { kind: 'streak', name: 'Streak', shape: 'comet', lobes: 0, pips: 0, radius: 11, speed: 272, hp: 1, children: [{ kind: 'splat', count: 2 }], sheetsPerHp: 1, firstRound: 9, color: 'streak', immuneTo: none, paleEligible: true, popHz: 698, boss: false, shedAt: none, shed: null },
  wax: { kind: 'wax', name: 'Wax', shape: 'hexagon', lobes: 0, pips: 0, radius: 14, speed: 88, hp: 1, children: [{ kind: 'splash', count: 2 }], sheetsPerHp: 1, firstRound: 10, color: 'wax', immuneTo: ['cut', 'wash'], paleEligible: false, popHz: 440, boss: false, shedAt: none, shed: null },
  knot: { kind: 'knot', name: 'Knot', shape: 'scribble', lobes: 0, pips: 0, radius: 17, speed: 72, hp: 12, children: [{ kind: 'wax', count: 2 }], sheetsPerHp: 1, firstRound: 15, color: 'knot', immuneTo: none, paleEligible: false, popHz: 330, boss: false, shedAt: none, shed: null },
  inkmaw: { kind: 'inkmaw', name: 'Inkmaw', shape: 'maw', lobes: 8, pips: 0, radius: 46, speed: 28, hp: BALANCE.inkmawHp, children: [{ kind: 'knot', count: 4 }], sheetsPerHp: 0, firstRound: 20, color: 'maw', immuneTo: none, paleEligible: false, popHz: 0, boss: true, shedAt: [0.75, 0.5, 0.25], shed: { kind: 'splash', count: 6 } },
};

function rbeOf(kind: BlotKind): number {
  const d = RAW[kind];
  return d.hp + d.children.reduce((n, c) => n + c.count * rbeOf(c.kind), 0);
}

export const BLOTS: Readonly<Record<BlotKind, BlotDef>> = Object.fromEntries(
  (Object.keys(RAW) as BlotKind[]).map((k) => [k, { ...RAW[k], rbe: rbeOf(k) }]),
) as Record<BlotKind, BlotDef>;

/** Chain order for colour/lobe ladders (§6). */
export const CHAIN: readonly BlotKind[] = ['dot', 'drop', 'splat', 'splash', 'blotch'];

/** §6 Pale modifier render constants. */
export const PALE = { fillAlpha: 0.4, dash: [3, 3] as const, hatchDeg: 45, hatchSpacing: 4 } as const;
/** §6 lobed-shape constants. */
export const LOBE = { amplitude: 0.14, phaseSpeed: 1.2, pipR: 1.6, pipRing: 0.45, pipAlpha: 0.35 } as const;
/** §6 rule 2: child k sits at s − 6k (clamped ≥ 0). */
export const CHILD_SPACING = 6;
/** §6 rule 5. */
export const BOSS_SLOW_CAP = 0.2;
