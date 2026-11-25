// src/tuning/arena.ts — FROZEN (WO-001): the shared ground truth every slice builds against
// (numbers from design/experience.md §4.4). Change = CEO decision.
// Per-slice numbers live in tuning/{world,camera,hero,golem,ui}.ts.

export interface Circle { x: number; z: number; r: number }

export const ARENA = {
  /** Nominal top-surface radius R (the visible edge varies with noise: world/ground.ts walkableRadius). */
  radius: 15,
  heroSpawn: { x: -0.6, z: 4.5 },
  heroSpawnFacing: 0, // north
  golemSpawn: { x: 0.4, z: 1.6 },
  golemSpawnFacing: Math.PI, // south, toward the hero
  minionPool: 6,
  hazardPool: 8,
  /** Bridge post pair P1 on the arena's NE lip (the bridge itself is scenery; soft wall here). */
  bridgeFoot: { x: 6.5, z: -9 },
  /** Solid circles on the arena (boulders, then tree trunks A, B, C, F, G). Sim pushes bodies out of them. */
  colliders: [
    { x: -2.8, z: 2.4, r: 0.75 }, { x: -3.4, z: 8.0, r: 0.6 }, { x: 4.6, z: -3.0, r: 0.55 },
    { x: -7, z: -6, r: 0.9 }, { x: 8.5, z: -6.5, r: 0.7 }, { x: -10, z: 4, r: 1.1 },
    { x: 10.5, z: 6, r: 0.8 }, { x: 3.0, z: -9.5, r: 0.5 }, { x: -1.5, z: -12, r: 0.6 },
    { x: -4.2, z: 0.5, r: 0.35 }, { x: -3.6, z: 6.0, r: 0.3 }, { x: 2.2, z: 6.9, r: 0.3 },
    { x: -8.5, z: -2.5, r: 0.35 }, { x: 7.8, z: 2.0, r: 0.35 },
  ] as readonly Circle[],
} as const;
