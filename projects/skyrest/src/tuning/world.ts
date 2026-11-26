// src/tuning/world.ts — owned by WO-002. Palette tokens, light, fog, post, quality tiers, scenery layout and
// ambient-life numbers (design/experience.md §4.1, §4.2, §4.4, §6). Pure data: no three, no DOM.

/** §4.1 palette tokens (hex), sampled from the reference and tuned. Other slices read these by name. */
export const PALETTE = {
  skyZenith: 0x4f9be8, skyMid: 0x74b8f5, skyHorizon: 0xd3e4f6, fog: 0xcfe3f8,
  cloudLit: 0xfdfdfe, cloudShade: 0xc6d6ea, cloudDeep: 0xa9c6ea,
  grassTip: 0xd8eb7a, grassLit: 0xb8d855, grassMid: 0x9cc45a, grassShade: 0x5f9a48, soilLip: 0x8a6a4c,
  cliffLit: 0xa9a59d, cliffMid: 0x7d8190, cliffShade: 0x4b6797,
  stoneLit: 0xdcc4b2, stoneMid: 0xb7a195, stoneShade: 0x7f7c84, stoneDeep: 0x4f4b4e,
  boulderLit: 0xd0c6c0, boulderShade: 0x6f7a8a,
  moss: 0x9fc34f, mossShade: 0x5d8a3a,
  runeCore: 0xfff1b0, rune: 0xffb63c, runeEdge: 0xf08a24, runeHot: 0xff5a1e, eye: 0xffd27a,
  leafLit: 0x8cc04a, leafMid: 0x5f9a3a, leafShade: 0x2f5f2c, trunk: 0x6a4a35, trunkShade: 0x3e2c25,
  blossomLit: 0xf8d3dc, blossomMid: 0xf0a9be, blossomShade: 0xd07a97, petal: 0xffc8d6,
  templeWhite: 0xeef0f6, templeShade: 0xaeb9d6, templeTrim: 0x3d63b5, banner: 0x2f56b0, bannerTrim: 0xe9c766,
  emblem: 0x7fe3ff, portal: 0xa6ecff,
  wood: 0xb08a68, woodShade: 0x6b4f3c, rope: 0xc9b18a,
  fallWhite: 0xe8f6ff, fallStreak: 0x9fd0f7, mist: 0xf4faff,
  flWhite: 0xffffff, flYellow: 0xffd84a, flPink: 0xff9fc0, flBlue: 0x8fb8ff,
  // Short aliases kept for the other slices (golem/hero views read these).
  stone: 0xb7a195, grass: 0x9cc45a, grassDark: 0x5f9a48, blossom: 0xf0a9be, templeBlue: 0x3d63b5, cloud: 0xfdfdfe,
} as const;

/** §4.2 lights, fog and grade. sunDir is the TO-light direction (normalised at use). */
export const LIGHT = {
  sunColor: 0xfff1d6,
  sunIntensity: 2.3,
  sunDir: { x: 0.55, y: 1.0, z: -0.3 },
  skyColor: 0xcfe6ff,
  groundColor: 0x7a9a52,
  hemiIntensity: 1.15,
  fogColor: 0xcfe3f8,
  fogDensity: 0.0085,
  /** Warm rim on characters and trees. */
  rimColor: 0xfff4dc,
  rimStrength: 0.35,
  /** Shadow frustum (ortho, centred on the hero, texel-snapped). */
  shadowExtent: 34,
  shadowBias: -0.0004,
  shadowNormalBias: 0.025,
  shadowRadius: 3,
  /** Cloud shadows: the sun is multiplied by 0.85..1.0 noise scrolling at this speed (m/s, +x). */
  cloudShadowMin: 0.85,
  cloudShadowSpeed: 0.6,
  cloudShadowScale: 0.045,
} as const;

/** §4.2 tone, grade and bloom (High only; Low draws halos). */
export const POST = {
  exposure: 1.0,
  saturation: 1.1,
  shadowLift: 0.04,
  shadowLiftColor: 0x2a3a5a,
  vignetteOffset: 1.05,
  vignetteDarkness: 0.22,
  vignetteColor: 0x1a2440,
  bloomStrength: 0.55,
  bloomRadius: 0.45,
  /** Spec says 0.85; our lit whites (temple, clouds, a hit-flashed golem) reach ≈ 1.1 linear, so 1.2 keeps bloom on
   *  the emissive sources only (§13 "never mush"); every emissive is ≥ 1.3× (runes 2.4, emblem 2.0, portal 1.6). */
  bloomThreshold: 1.2,
  msaaSamples: 4,
} as const;

/** §4.2 quality table. */
export const QUALITY = {
  low: { pixelRatioCap: 1.25, shadowMapSize: 1024, bloom: false, grassTufts: 2000, flowers: 140, cloudPuffs: 36, petals: 24, particleCap: 200, blossomCards: 600 },
  high: { pixelRatioCap: 2, shadowMapSize: 2048, bloom: true, grassTufts: 5000, flowers: 260, cloudPuffs: 70, petals: 60, particleCap: 400, blossomCards: 1200 },
} as const;

/** §4.2 auto tier: frame time averaged over a window; drop pixel ratio, then tier. Never upgrade. */
export const AUTO_QUALITY = { windowMs: 2000, maxFrameMs: 22, pixelRatioStep: 0.25, pixelRatioFloor: 1.0 } as const;

/** Halo billboards standing in for bloom on Low (§4.2). */
export const HALO = { sizeScale: 1.6, opacity: 0.55, texSize: 64 } as const;

export interface Vec3 { x: number; y: number; z: number }
export interface TreeSpec { id: string; kind: 'round' | 'blossom' | 'bush' | 'cypress'; x: number; z: number; y?: number; canopyY: number; canopyR: number; puffs: number }
export interface BoulderSpec { x: number; z: number; y?: number; r: number }
export interface IsleSpec { x: number; y: number; z: number; r: number; depth: number; strata: number; roots: number; seed: number }
export interface FallSpec { x: number; y: number; z: number; width: number; dirX: number; dirZ: number; drop: number }

/** §4.4 world layout (m). */
export const SCENERY = {
  templeIsland: { x: 24, y: 3.5, z: -44 },
  templeIslandRadius: 10,
  temple: { x: 26, y: 3.5, z: -47 },
  /** Facing of the temple facade (contracts convention): SSW, toward the bridge and the arena. */
  templeFacing: Math.PI - 0.5,
  bridgeP2: { x: 17, y: 3.2, z: -34 },
  bridgeP1Y: 0.1,
  arenaDepth: 22,
  arenaOverhang: 0.3,
  trees: [
    { id: 'A', kind: 'round', x: -4.2, z: 0.5, canopyY: 4.0, canopyR: 2.4, puffs: 7 },
    { id: 'B', kind: 'blossom', x: -3.6, z: 6.0, canopyY: 2.6, canopyR: 1.8, puffs: 5 },
    { id: 'C', kind: 'bush', x: 2.2, z: 6.9, canopyY: 1.5, canopyR: 1.6, puffs: 4 },
    { id: 'F', kind: 'round', x: -8.5, z: -2.5, canopyY: 4.2, canopyR: 2.6, puffs: 7 },
    { id: 'G', kind: 'round', x: 7.8, z: 2.0, canopyY: 3.4, canopyR: 2.0, puffs: 5 },
    { id: 'far1', kind: 'round', x: -6, z: -11, canopyY: 2.6, canopyR: 1.4, puffs: 4 },
    { id: 'far2', kind: 'round', x: 5, z: -12, canopyY: 2.6, canopyR: 1.4, puffs: 4 },
    // Temple isle: three round trees and the spire's two cypress cones.
    { id: 'T1', kind: 'round', x: 19.5, z: -40.5, y: 3.5, canopyY: 2.2, canopyR: 1.3, puffs: 4 },
    { id: 'T2', kind: 'round', x: 31.5, z: -44.5, y: 3.5, canopyY: 2.4, canopyR: 1.4, puffs: 4 },
    { id: 'T3', kind: 'bush', x: 21, z: -48.5, y: 3.5, canopyY: 1.4, canopyR: 1.1, puffs: 4 },
    { id: 'S1', kind: 'cypress', x: 18.0, z: -63.6, y: 9, canopyY: 2.6, canopyR: 0.75, puffs: 1 },
    { id: 'S2', kind: 'cypress', x: 20.0, z: -64.8, y: 9, canopyY: 2.1, canopyR: 0.6, puffs: 1 },
  ] as readonly TreeSpec[],
  boulders: [
    { x: -2.8, z: 2.4, r: 0.75 }, { x: -3.4, z: 8.0, r: 0.6 }, { x: 4.6, z: -3.0, r: 0.55 },
    { x: -7, z: -6, r: 0.9 }, { x: 8.5, z: -6.5, r: 0.7 }, { x: -10, z: 4, r: 1.1 },
    { x: 10.5, z: 6, r: 0.8 }, { x: 3.0, z: -9.5, r: 0.5 }, { x: -1.5, z: -12, r: 0.6 },
    // Temple isle scatter.
    { x: 18.5, z: -45, y: 3.5, r: 0.7 }, { x: 30.5, z: -40, y: 3.5, r: 0.55 },
  ] as readonly BoulderSpec[],
  /** Spec puts it at (10, 8, −58); moved behind-left of the temple so it reads beside it in F2, as in the reference. */
  spire: { x: 19, y: 9, z: -64, r: 3, depth: 26, strata: 4, roots: 2, seed: 31 } as IsleSpec,
  distantIsles: [
    { x: -60, y: -4, z: -90, r: 8, depth: 20, strata: 3, roots: 3, seed: 41 },
    { x: -35, y: 6, z: -130, r: 6, depth: 18, strata: 3, roots: 2, seed: 42 },
    { x: 70, y: -8, z: -110, r: 9, depth: 22, strata: 3, roots: 3, seed: 43 },
    { x: 110, y: 2, z: -40, r: 7, depth: 20, strata: 3, roots: 2, seed: 44 },
    { x: -90, y: -10, z: 20, r: 4, depth: 14, strata: 2, roots: 2, seed: 45 },
  ] as readonly IsleSpec[],
  /** Waterfalls: top point, width, outward direction, drop to the cloud sea. */
  falls: [
    // W1/W2 pour off the temple isle's camera-facing lip, so the cliff sits behind them (the reference's read).
    { x: 15.0, y: 3.3, z: -39.6, width: 2.4, dirX: -0.9, dirZ: 0.44, drop: 30 },
    { x: 31.5, y: 3.3, z: -37.4, width: 3.0, dirX: 0.75, dirZ: 0.66, drop: 30 },
    { x: 18.6, y: 8.5, z: -61.4, width: 1.2, dirX: -0.4, dirZ: 1, drop: 36 },
    { x: -3, y: -0.2, z: -15.4, width: 1.0, dirX: -0.15, dirZ: -1, drop: 26 },
  ] as readonly FallSpec[],
  cloudSea: { y: -24, radius: 400, scroll: 0.004, puffMinY: -20, puffMaxY: -12, ringMin: 30, ringMax: 180, drift: 0.4, cumulus: 8, cumulusDist: 300 },
} as const;

/** §4.4 bridge. */
export const BRIDGE = { planks: 84, plankW: 1.4, plankH: 0.08, plankD: 0.26, sag: 0.7, railH: 0.9, railSag: 0.35, postPairs: 5, jitterDeg: 3 } as const;

/** §4.4 temple. */
export const TEMPLE = { steps: 3, stepH: 0.4, facadeW: 8, facadeH: 7, towerH: 9, portalW: 1.6, portalH: 3.0, emblemR: 0.55, emblemSpinDeg: 6, banners: 4, bannerW: 0.9, bannerH: 3.2 } as const;

/** §6 ambient life. */
export const AMBIENT = {
  grassBend: 0.07, grassGust: 0.05, gustSpeed: 3, gustPeriod: 5.5, gustDarken: 0.06,
  canopyBreath: 0.015, canopyBreathHz: 0.25, canopySwayDeg: 1.2, canopySwayHz: 0.4,
  petalFall: 0.35, petalSpiral: 0.3, petalSpin: 2, petalWind: 0.9, petalFade: 12,
  fallScroll1: 1.4, fallScroll2: 0.9, mistHz: 0.5,
  bannerAmp: 0.12,
  birdFlocks: 3, birdsPerFlock: 4, birdRadius: 18, birdSpeed: 0.35, birdFlapHz: 5,
  portalShimmer: 0.2, portalHz: 0.7, motes: 20,
  canopyDitherOpacity: 0.35, canopyDitherInMs: 180, canopyDitherOutMs: 300,
} as const;
