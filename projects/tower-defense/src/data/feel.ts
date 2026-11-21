// §4 Motion, §10.5 caps and §11 Feel in numbers, transcribed. FROZEN (WO-001).
export const MOTION = { microMs: 90, uiMs: 160, foldMs: 220, sceneMs: 400, backOutS: 1.70158 } as const;

export const POP = {
  ringScale: 1.8, ringWidth: 2, ringMs: 160,
  fleckSize: [3, 5], fleckSpeed: [60, 140], fleckDrag: 4, fleckLifeMs: 300, fleckSpin: 6,
  childSquashFrom: 1.35, childSquashMs: 120,
} as const;

/** §10.5: flecks per pop by live-particle count; hard cap. */
export const PARTICLES = { cap: 600, tiers: [{ below: 200, perPop: 6 }, { below: 600, perPop: 2 }], above: 0 } as const;

export const HIT = { flashAlpha: 0.6, recoilPx: 2, recoilMs: 80 } as const;

/** Deterministic sim hit-stop, in ticks (§11). Nothing else stops. */
export const HIT_STOP = { knotPop: 2, bossShed: 4, bossDeath: 12 } as const;

/** Screen shake A px / τ ms (§11); scaled by the Shake setting, 0 under Reduce motion. */
export const SHAKE = {
  leak: { a: 4, tau: 120 }, bigLeak: { a: 8, tau: 200, seeds: 10 }, waxCrack: { a: 1, tau: 60 },
  bossShed: { a: 6, tau: 150 }, bossDeath: { a: 12, tau: 250 }, bossRumble: { a: 2, tau: 0 },
} as const;

export const FLOAT_TEXT = { windowMs: 250, size: 14, risePx: 18, lifeMs: 600, fadeMs: 200, bonusFlyMs: 500 } as const;
export const FIRE_FEEL = { ternRecoilPx: 2, ternRecoilMs: 60, frogSquash: [0.9, 1.1], frogSquashMs: 100, owlFlare: [6, 9], owlFlareMs: 90 } as const;
export const PLACE_FEEL = { scale: [0.6, 1.08, 1], ms: 220, flecks: 8, upgradeFlecks: 12 } as const;
/**
 * F-017: place/sell flecks must read on --paper grass: 4–6 px, a 1-px --ink-soft edge, 360 ms, 90–180 px/s,
 * leaving from the coaster rim (r 18) so they fly over grass rather than over the tower.
 */
export const PLACE_FLECK = { speed: [90, 180], size: [4, 6], lifeMs: 360, fromR: 18 } as const;

/**
 * §10.6 boss beats, render side.
 * - arrive (F-014): Inkmaw heaves out of the inkwell mouth, scaleY 0.85 → 1.05 → 1 over 400 ms
 *   (volume kept on x), with a spill ring and a splash at the mouth.
 * - shed (F-022): each of the 6 Splash launches from the boss centre to its path slot behind it over
 *   220 ms (backOut), arcing off the path to alternate sides and lifting 8 px off its shadow.
 * - death (F-023): the only big hit — flecks at 180–420 px/s for 650 ms, half --maw and half --knot,
 *   12 --paper scraps, and the 4 Knots scatter from the centre to their slots over 160 ms.
 */
export const BOSS_FEEL = {
  arrive: { ms: 400, squash: 0.85, overshoot: 1.05, peakAt: 0.45, ringMs: 320, flecks: 10 },
  shed: { launchMs: 220, liftPx: 8, arcPx: [12, 26] },
  death: {
    flecks: 80, speed: [180, 420], size: [4, 7], lifeMs: 650,
    scraps: 12, scrapSize: [7, 9], scrapSpeed: [120, 300], scrapLifeMs: 700,
    scatterMs: 160,
  },
} as const;
export const SPEEDS = [1, 2] as const;
/** Real-time cap on sim steps per render frame (spiral-of-death guard; deterministic because the sim is tick-keyed). */
export const MAX_STEPS_PER_FRAME = 16;
export const BANNER = { ms: 2200, inMs: 160, outMs: 220, y: 96, size: 28 } as const;
