// src/tuning/golem.ts — owned by WO-004. Stone Guardian + pebble minion numbers from design/experience.md §4.5/§5/§8.
// Frames are 60 Hz sim steps (spec ms × 0.06). Bracketed spec values (phase 2) are the `p2` fields.

/** One golem attack. `windup` is the telegraph: the decal fills to 100 % exactly on the strike's first frame. */
export interface GolemAttackTuning {
  windup: number;
  windupP2: number;
  /** Active frames (for the toss: the boulder's flight). */
  strike: number;
  recover: number;
  recoverP2: number;
  /** Decal radius (m). Slam/double slam: circle `ahead` m in front; sweep: arc around the golem; toss: at the target. */
  radius: number;
  /** Half-hearts dealt by the strike itself. */
  damage: number;
  /** Pick only when the hero is within [minRange, maxRange] (centre to centre, m). */
  minRange: number;
  maxRange: number;
  /** Slam centre distance ahead of the golem (m). */
  ahead: number;
  /** Arc of the decal (360 = circle). */
  arcDeg: number;
}

export const GOLEM = {
  /** §5 says 60,000 × 1.15^(wave−1); raised by CEO decision so a wave-1 fight lasts ~60–75 s for a decent player
   *  (the frame-perfect autopilot needs ~30 s; the spec number gave 12 s). */
  maxHp: 150000,
  hpWaveGrowth: 1.15,
  maxPoise: 100,
  /** Poise refills this long after the last hit (4 s). */
  poiseResetFrames: 240,
  /** Collider radius (§4.5 "collider r 1.5"). */
  radius: 1.5,
  /** m/s, P2 in brackets in the spec. */
  walkSpeed: 1.6,
  walkSpeedP2: 2.0,
  /** rad/s (90°/s, P2 120°/s). */
  turnRate: Math.PI / 2,
  turnRateP2: (Math.PI * 2) / 3,
  /** Stops walking inside this distance (just outside the slam reach). */
  closeEnough: 3.2,
  /** Intro assembly: 1,800 ms on the first intro, 1,200 ms when it reforms (retry / next wave). */
  wakeFrames: 108,
  reformFrames: 72,
  /** The first attack waits 4.5 s into the fight, or until the first player hit. */
  firstAttackFrames: 270,
  /** ≥ 600 ms between a recovery and the next attack. */
  cooldownFrames: 36,
  cooldownFramesP2: 24,
  /** "weight ×0.4 if used last". */
  repeatWeight: 0.4,
  /** Hero counts as "on a flank" for the sweep when |angle from the golem's facing| ≥ this. */
  flankDeg: 30,
  /** 2,000 ms kneel. */
  staggerFrames: 120,
  /** Phase 2 at ≤ 50 % (wave ≥ 2: 60 %). */
  enrageAt: 0.5,
  enrageAtLaterWaves: 0.6,
  /** The roar that announces phase 2 (no attacks during it). */
  roarFrames: 72,
  /** Killing blow: 220 ms hit-stop, then 600 ms at time-scale 0.35 (both counted in sim steps at 0.35). */
  deathHitstop: 5,
  deathTimeScale: 0.35,
  deathTimeScaleFrames: 18,
  /** Crumble → 'dead' after this many steps (boulders settled, sunk, gone). */
  dyingFrames: 240,
  attacks: {
    slam: { windup: 54, windupP2: 39, strike: 9, recover: 78, recoverP2: 60, radius: 2.2, damage: 2, minRange: 0, maxRange: 4.5, ahead: 2.4, arcDeg: 360 },
    sweep: { windup: 42, windupP2: 31, strike: 15, recover: 48, recoverP2: 39, radius: 4.0, damage: 2, minRange: 0, maxRange: 3.6, ahead: 0, arcDeg: 200 },
    toss: { windup: 48, windupP2: 48, strike: 54, recover: 42, recoverP2: 42, radius: 1.4, damage: 1, minRange: 6, maxRange: 99, ahead: 0, arcDeg: 360 },
    doubleSlam: { windup: 39, windupP2: 39, strike: 9, recover: 84, recoverP2: 84, radius: 2.2, damage: 2, minRange: 0, maxRange: 5, ahead: 2.4, arcDeg: 360 },
  } satisfies Record<string, GolemAttackTuning>,
  /** Double slam: the second fist lands 500 ms after the first. */
  doubleSlamGap: 30,
  /** Toss: hero position + velocity × 0.4 s; boulder apex 6 m. */
  tossLead: 0.4,
  tossApex: 6,
  /** Slam shockwave ring: 0 → 7 m in 450 ms, 0.7 m band, ½ heart. */
  shockwave: { frames: 27, r0: 0.4, r1: 7, band: 0.7, damage: 1 },
  /** Toss landing hazard (filled disc). */
  boulderHazard: { frames: 4, damage: 1 },
  /** Victory: 2,500 coins (+20 % per wave) as 40 coins. */
  coinsOnDeath: 2500,
  coinWaveGrowth: 1.2,
  coinCount: 40,
} as const;

export type GolemAttackName = keyof typeof GOLEM.attacks;

/** §4.5 pebble minions (phase 2 only). */
export const MINION = {
  count: 3,
  maxHp: 2500,
  radius: 0.5,
  /** Hop speed m/s. */
  speed: 2.2,
  /** Pops out 1.5–3 m from the golem over this many steps. */
  spawnFrames: 36,
  spawnMin: 1.5,
  spawnMax: 3.0,
  /** Starts the bump inside this distance (centre to centre). */
  reach: 1.15,
  /** 400 ms squash telegraph, then the bump. */
  windupFrames: 24,
  strikeFrames: 8,
  recoverFrames: 40,
  hurtFrames: 10,
  damage: 1,
  /** 3 coins worth this much in total. */
  coins: 30,
  coinCount: 3,
} as const;

/** Golem HP for a wave. */
export const golemHpForWave = (wave: number) => Math.round(GOLEM.maxHp * GOLEM.hpWaveGrowth ** (wave - 1));
/** Coins the golem drops on a wave. */
export const golemCoinsForWave = (wave: number) => Math.round(GOLEM.coinsOnDeath * GOLEM.coinWaveGrowth ** (wave - 1));
