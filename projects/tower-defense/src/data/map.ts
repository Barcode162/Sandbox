// §5 "Spill Garden" and §4 world density, transcribed exactly. FROZEN (WO-001).
import type { Circle, Rect, TowerKind, Vec2 } from '../contracts/types';

export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;
/** Play field x 0–1080, below the 64-px HUD band (§4 Composition). */
export const FIELD: Rect = { x: 0, y: 0, w: 1080, h: 720 };
export const HUD_TOP = 64;

/** Path centreline; blots spawn at distance 0 (off-screen). */
export const PATH_POINTS: readonly Vec2[] = [
  { x: -40, y: 200 }, { x: 150, y: 200 }, { x: 230, y: 120 }, { x: 400, y: 120 }, { x: 460, y: 180 },
  { x: 460, y: 400 }, { x: 280, y: 400 }, { x: 220, y: 460 }, { x: 220, y: 600 }, { x: 560, y: 600 },
  { x: 640, y: 520 }, { x: 640, y: 300 }, { x: 760, y: 180 }, { x: 900, y: 180 }, { x: 960, y: 240 },
  { x: 960, y: 560 },
];
/** Spec value; the exact polyline length is 2570.538… (tests assert |Δ| < 0.1). Reaching it = leak. */
export const PATH_LENGTH_SPEC = 2570.5;

export const PATH_RIBBON_WIDTH = 44;
export const PATH_EDGE_WIDTH = 2;
export const PATH_STITCH_DASH = [6, 8] as const;
/** Rule 1: distance to centreline ≥ PATH_CLEARANCE + fr. */
export const PATH_CLEARANCE = 22;

export const FOOTPRINT: Readonly<Record<TowerKind, number>> = { tern: 16, owl: 16, koi: 18, frog: 20 };

/**
 * Rule 4 no-build circles. Interpretation (architecture §Decisions): the footprint must lie outside,
 * i.e. distance(centre) ≥ r + fr.
 */
export const NO_BUILD: readonly Circle[] = [
  { name: 'pond', x: 340, y: 260, r: 64 },
  { name: 'inkwell', x: 40, y: 200, r: 56 },
  { name: 'seedJar', x: 960, y: 612, r: 46 },
  { name: 'rockA', x: 560, y: 430, r: 28 },
  { name: 'rockB', x: 800, y: 480, r: 32 },
  { name: 'maple', x: 90, y: 580, r: 44 },
];

/** Best pockets (§5); the R1 star sits at the first (§10.2). */
export const BEST_SPOTS = { star: { x: 340, y: 510 }, pocket: { x: 350, y: 520 }, koi: { x: 280, y: 554 }, owl: { x: 860, y: 360 } } as const;

/** §4 World density (render-only RNG seed 7). */
export const DECOR = {
  seed: 7,
  grassTufts: 140,
  flowers: 22,
  flowerRadius: 5,
  maple: { x: 90, y: 580, leaves: 9, swayDeg: 2, swayPeriodS: 4 },
  pond: { x: 340, y: 260, w: 128, h: 104, rippleEveryS: 3, rippleR0: 8, rippleR1: 40, rippleDurS: 1.4, lilyPads: 2 },
  petals: { count: 6, speed: 12 },
  rocks: [{ x: 560, y: 430, r: 28 }, { x: 800, y: 480, r: 32 }],
  inkwell: { x: 40, y: 200 },
  seedJar: { x: 960, y: 612 },
  grainTile: 128,
  grainAlpha: 0.06,
} as const;

/**
 * §10.1 attract mode: own seed, preplaced towers, looping R6. The kill zone sits on the right loop
 * (F-013): the left loops stay unguarded, so the ink-filled top path is the threat under the title and
 * every peel happens right of the buttons ("type left third, play right two-thirds"). All four spots
 * pass canPlace. `prewarmSteps` (15.4 s of sim) puts the title's t 800 ms on Drops crossing the top path
 * (x 230–400) and its Idle 5 s frame inside the densest peel of the loop (7 pop rings at x > 560).
 */
export const ATTRACT = {
  seed: 11,
  round: 6,
  prewarmSteps: 924,
  towers: [
    { kind: 'tern', x: 720, y: 300, tiers: [2, 0] },
    { kind: 'frog', x: 860, y: 300, tiers: [0, 0] },
    { kind: 'koi', x: 700, y: 420, tiers: [0, 0] },
    { kind: 'owl', x: 860, y: 360, tiers: [0, 0] },
  ],
} as const satisfies { seed: number; round: number; prewarmSteps: number; towers: readonly { kind: TowerKind; x: number; y: number; tiers: readonly [number, number] }[] };
