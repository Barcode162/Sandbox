// src/world/ground.ts — owned by WO-002, but PURE and called by the sim and every view (no three/DOM).
// FROZEN signatures: groundHeight, walkableRadius. experience.md §4.4:
//   rim  R(θ) = 15 + 1.4·n1(θ) + 0.6·n2(3θ)          (θ = atan2(x, −z), the contracts' facing convention)
//   top  y    = 0.12·(1 − r²/R²) − 0.25·edge + 0.1·noise(x/6, z/6)   (F-016: flat meadow, falloff only in the outer 2 m)
// The arena mesh is built from these same functions, so feet, colliders and grass always agree.
import { ARENA } from '../tuning/arena.ts';
import { noise2, noiseAngle } from './noise.ts';

const DOME = 0.12;
const BUMP = 0.1;
const EDGE_DROP = 0.25;
const EDGE_BAND = 2;
const SEED_RIM = 7;
const SEED_TOP = 11;

/** Visible rim radius of the arena's grass top at angle θ (before the 0.3 m soil-lip overhang). */
export function arenaRimRadius(theta: number): number {
  // n2(3θ): sampling the circle at 3× the frequency gives the finer lobes.
  return ARENA.radius + 1.4 * noiseAngle(theta, 1.2, SEED_RIM) + 0.6 * noiseAngle(theta, 3.6, SEED_RIM + 1);
}

/** Height of the arena's top surface at (x, z): gently domed, softly bumpy, continuous everywhere. */
export function groundHeight(x: number, z: number): number {
  const R = arenaRimRadius(Math.atan2(x, -z));
  const r = Math.sqrt(x * x + z * z);
  const q = 1 - (r * r) / (R * R);
  const e = Math.min(1, Math.max(0, (r - (R - EDGE_BAND)) / EDGE_BAND));
  return DOME * (q > 0 ? q : 0) - EDGE_DROP * e * e * (3 - 2 * e) + BUMP * noise2(x / 6, z / 6, SEED_TOP);
}

/** How far from the centre a body may walk at this angle (atan2(x, −z)): R(θ) − 1.0 (soft wall, no falls). */
export function walkableRadius(angle: number): number {
  return arenaRimRadius(angle) - 1.0;
}
