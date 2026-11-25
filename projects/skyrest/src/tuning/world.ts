// src/tuning/world.ts — owned by WO-002. Palette, light, fog, post, density and scenery placement.
export const PALETTE = {
  skyTop: 0x3f8fe0,
  skyHorizon: 0xbfe4ff,
  grass: 0x8ccf4d,
  grassDark: 0x4f9a35,
  stone: 0x9a958c,
  blossom: 0xf6a9c8,
  templeWhite: 0xf1f0ea,
  templeBlue: 0x2a62c9,
  emblem: 0x63e2ff,
  cloud: 0xffffff,
  wood: 0x8a5a33,
  rune: 0xffa630,
} as const;

export const LIGHT = {
  sunColor: 0xfff1d6,
  sunIntensity: 2.6,
  sunDir: { x: -0.45, y: 1, z: 0.35 },
  skyColor: 0xcfe8ff,
  groundColor: 0x6f8f4a,
  hemiIntensity: 1.3,
  fogColor: 0xcfe6fb,
  fogNear: 30,
  fogFar: 140,
} as const;

/** Scenery anchors (world space). Temple island must project to the upper-right of the canonical frame. */
export const SCENERY = {
  templeIsland: { x: 24, y: 3.5, z: -44 },
  templeIslandRadius: 10,
  temple: { x: 26, y: 3.5, z: -47 },
  bridgeP2: { x: 17, y: 3.2, z: -34 },
} as const;

export const QUALITY = {
  low: { pixelRatioCap: 1.5, shadowMapSize: 1024, bloom: false, grassBlades: 1500, petals: 60 },
  high: { pixelRatioCap: 2, shadowMapSize: 2048, bloom: true, grassBlades: 6000, petals: 200 },
} as const;
