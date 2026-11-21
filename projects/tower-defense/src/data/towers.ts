// §7 Towers × 2 paths × 3 tiers, transcribed exactly. FROZEN (WO-001).
// Resolution rule: start from `base`, apply owned tiers in order A1,A2,A3,B1,B2,B3; `set` overrides, `add` adds.
import type { TierDef, TierEffect, TowerDef, TowerKind, TowerStats, UpgradePath } from '../contracts/types';
import { FOOTPRINT } from './map';
import { BALANCE } from './balance';

const DEFAULT: TowerStats = {
  attack: 'quill', range: 0, interval: 1, damage: 1, pierce: 1, damageType: 'cut', detect: false, multVs: {},
  projectileSpeed: 0, projectileLifeMul: 1.3, spreadDeg: [0],
  arcTime: 0, splashRadius: 0, splashMax: 0, stun: 0, skips: 0, skipDistance: 0, skipRadius: 0, skipMax: 0,
  pulseMax: 0, slowPct: 0, slowDur: 0, freezeEvery: 0, freezeDur: 0, frozenCrushBonus: 0, frostDecalRadius: 0,
  jetCount: 0, jetRotateDeg: 0, jetPierce: 0, jetRange: 0,
  beamToMaxRange: false, beamAfterimageMs: 0,
  auraRadius: 0, auraDetect: false, auraIntervalMul: 1, auraDamageAdd: 0, auraStripPale: false,
  areaClass: false,
};
const stats = (s: Partial<TowerStats>): TowerStats => ({ ...DEFAULT, ...s });

function tier(path: UpgradePath, t: 1 | 2 | 3, name: string, cost: number, effectLine: string, effect: TierEffect, visual: string): TierDef {
  return { path, tier: t, name, cost, effectLine, effect, visual };
}

export const TOWERS: Readonly<Record<TowerKind, TowerDef>> = {
  tern: {
    kind: 'tern', name: 'Tern', hotkey: '1', cost: 200, footprint: FOOTPRINT.tern, hasTargeting: true, turnRateDeg: 720,
    blurb: 'Quick quills, cheap and loyal.',
    base: stats({ attack: 'quill', range: 150, interval: 0.95, damage: 1, pierce: 2, damageType: 'cut', projectileSpeed: 720, projectileLifeMul: 1.3, spreadDeg: [0] }),
    paths: [
      [
        tier(0, 1, 'Sharp Crease', 150, '+2 pierce', { add: { pierce: 2 } }, '--l5 crease stripe on both wingtips'),
        tier(0, 2, 'Twin Quill', 280, '2 quills, ±6°', { set: { spreadDeg: [-6, 6] } }, 'a second smaller wing pair behind the first'),
        tier(0, 3, 'Gale Tern', 950, '3-quill fan, fast', { set: { spreadDeg: [-10, 0, 10], interval: 0.5 }, add: { pierce: 1 } }, 'body #DCE8F0; forked tail with 3 ribbon streamers (12 px, flutter 6 Hz)'),
      ],
      [
        tier(1, 1, 'Long Sight', 120, '+45 range, faster quill', { set: { projectileSpeed: 900 }, add: { range: 45 } }, 'beak +8 px'),
        tier(1, 2, 'Keel Quill', 360, '+1 dmg, Crush', { set: { damageType: 'crush' }, add: { damage: 1 } }, '3-triangle head crest; quills drawn --ink, 12×5'),
        tier(1, 3, 'Harpoon Heron', 1150, 'lance 6 dmg, ×3 Wax/Knot', { set: { attack: 'lance', damage: 6, interval: 1.1, multVs: { wax: 3, knot: 3 } }, add: { pierce: 1, range: 35 } }, 're-silhouettes to a heron #B9C6CF, neck +14 px, 2 leg strokes; lance 18×4 with a --l5 tassel'),
      ],
    ],
  },
  frog: {
    kind: 'frog', name: 'Pondfrog', hotkey: '2', cost: 500, footprint: FOOTPRINT.frog, hasTargeting: true, turnRateDeg: 720,
    blurb: 'Lobs stones. Wax cracks.',
    base: stats({ attack: 'stone', range: 165, interval: 1.4, damage: 1, pierce: 0, damageType: 'crush', arcTime: 0.45, splashRadius: 40, splashMax: 14, skipDistance: 70, skipRadius: 32, skipMax: 10, areaClass: true }),
    paths: [
      [
        tier(0, 1, 'Wide Ripple', 250, '+16 splash, +10 blots', { add: { splashRadius: 16, splashMax: 10 } }, 'throat sac disc r 6; stone r 8'),
        tier(0, 2, 'Heavy Stone', 450, '+1 dmg', { add: { damage: 1 } }, '3 --moss-deep back spots; stones --ink-soft'),
        tier(0, 3, 'Boulder Toad', 1400, '4 dmg, r 72, stun', { set: { damage: 4, splashRadius: 72, splashMax: 40, stun: 0.3 } }, 're-silhouettes to a toad 38×30 #7A7A3E with 9 wart dots; boulder r 12; crack decal ring on landing (400 ms)'),
      ],
      [
        tier(1, 1, 'Quick Tongue', 200, 'faster throws', { set: { interval: 1.05 } }, '--l5 tongue flick 10 px for 80 ms on each shot'),
        tier(1, 2, 'Skip Stone', 480, 'stone skips once', { set: { skips: 1 } }, 'flat ellipse stones; a ripple ring on each landing'),
        tier(1, 3, 'Bullfrog Barrage', 1250, 'rapid, 2 skips', { set: { interval: 0.55, skips: 2, splashMax: 20 } }, '3 dark chevrons down the back; throat inflates 1.3× on each shot (120 ms)'),
      ],
    ],
  },
  koi: {
    kind: 'koi', name: 'Mist Koi', hotkey: '3', cost: 300, footprint: FOOTPRINT.koi, hasTargeting: false, turnRateDeg: 0,
    blurb: 'Mist touches everything near.',
    base: stats({ attack: 'pulse', range: 85, interval: 1.2, damage: 1, pierce: 0, damageType: 'wash', pulseMax: 8, areaClass: true }),
    paths: [
      [
        tier(0, 1, 'Cold Spring', 160, 'slows 40 % for 1 s', { set: { slowPct: 0.4, slowDur: 1.0 } }, 'fins --water; pulse ring dashed 4/4'),
        tier(0, 2, 'Deep Chill', 360, 'slow 60 %, +20 reach', { set: { slowPct: 0.6, slowDur: 1.5 }, add: { range: 20 } }, '6 ice-crystal ticks around the puddle'),
        tier(0, 3, 'Glacier Carp', 1000, 'every 3rd pulse freezes', { set: { freezeEvery: 3, freezeDur: 1.2, frozenCrushBonus: 1, frostDecalRadius: 105 } }, 'koi #E6F2F5, faceted crystal fins; frost hexagon r 105 on the ground at 20 %'),
      ],
      [
        tier(1, 1, 'Swift Tail', 180, 'faster pulses', { set: { interval: 0.85 } }, 'tail fin doubled, faster sway (±6° over 1 s)'),
        tier(1, 2, 'Monsoon', 450, '+1 dmg, +12 blots', { add: { damage: 1, pulseMax: 12 } }, 'a 3-circle paper cloud above it with 4 falling streaks'),
        tier(1, 3, 'Typhoon Koi', 1250, '8 rotating jets', { set: { attack: 'jets', interval: 0.3, jetCount: 8, jetRotateDeg: 11.25, jetPierce: 3, jetRange: 150, projectileSpeed: 500 } }, 're-silhouettes to a dragon-carp ×1.25, #E0B04A scales, 2 long whisker curves, a spinning ring of 8 droplets'),
      ],
    ],
  },
  owl: {
    kind: 'owl', name: 'Lantern Owl', hotkey: '4', cost: 350, footprint: FOOTPRINT.owl, hasTargeting: true, turnRateDeg: 720,
    blurb: 'Sees pale ink from afar.',
    base: stats({ attack: 'beam', range: 260, interval: 1.6, damage: 2, pierce: 1, damageType: 'glare', detect: true, beamAfterimageMs: 0 }),
    paths: [
      [
        tier(0, 1, 'Keen Glare', 250, '+2 dmg', { add: { damage: 2 } }, 'amber #E08A1E eye rings'),
        tier(0, 2, 'Piercing Beam', 500, 'beam pierces 3, +60', { set: { pierce: 3, beamToMaxRange: true }, add: { range: 60 } }, 'ear tufts +6 px; beam 4 px'),
        tier(0, 3, 'Eclipse Owl', 1500, '18 dmg, ×2 Knot/boss', { set: { damage: 18, interval: 1.2, range: 400, multVs: { knot: 2, inkmaw: 2 }, beamAfterimageMs: 200 } }, 're-silhouettes to a horned owl #3A3560, gold eyes, crescent monocle; beam leaves a 200 ms afterimage'),
      ],
      [
        tier(1, 1, 'Paper Lamp', 200, 'detection aura 170', { set: { auraRadius: 170, auraDetect: true } }, 'a lantern hangs from the beak; a --glow disc r 170 at 6 %'),
        tier(1, 2, 'Warm Light', 420, 'aura: rate ×0.85', { set: { auraIntervalMul: 0.85 } }, 'larger lantern with 2 tassels'),
        tier(1, 3, 'Beacon Owl', 1200, 'aura ×0.75, +1, unpale', { set: { auraIntervalMul: 0.75, auraDamageAdd: 1, auraStripPale: true } }, 'a tall floating lantern above the owl with 8 rays rotating 6°/s'),
      ],
    ],
  },
};

export const TOWER_ORDER: readonly TowerKind[] = ['tern', 'frog', 'koi', 'owl'];

/** §7 crosspath rule: valid iff max(a,b) ≤ 3 and min(a,b) ≤ 1. */
export function tiersValid(a: number, b: number): boolean {
  return Math.max(a, b) <= 3 && Math.min(a, b) <= 1 && a >= 0 && b >= 0;
}

/** Pure stat resolution (§7). Shared by sim and UI; allocation is fine (called on buy, not per tick). */
export function resolveStats(kind: TowerKind, tiers: readonly [number, number]): TowerStats {
  const def = TOWERS[kind];
  const out: TowerStats = { ...def.base, multVs: { ...def.base.multVs } };
  for (const p of [0, 1] as const) {
    for (let t = 0; t < tiers[p]; t++) {
      const e = def.paths[p][t].effect;
      if (e.set) Object.assign(out, e.set);
      if (e.add) for (const [k, v] of Object.entries(e.add)) (out as unknown as Record<string, number>)[k] += v as number;
    }
  }
  out.interval *= BALANCE.towerIntervalMul; // balance pass (data/balance.ts); tables above stay as §7 states them
  return out;
}
