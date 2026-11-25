// src/world/ground.ts — owned by WO-002, but PURE and called by the sim and every view (no three/DOM).
// FROZEN signatures: groundHeight, walkableRadius. Scaffold: the spec's dome without the noise terms.
import { ARENA } from '../tuning/arena.ts';

/** Height of the arena's top surface at (x, z) (experience.md §4.4: gently domed). */
export function groundHeight(x: number, z: number): number {
  const R = ARENA.radius;
  const r2 = x * x + z * z;
  return 0.35 * Math.max(0, 1 - r2 / (R * R));
}

/** How far from the centre a body may walk at this angle (atan2(x, -z)): R(θ) − 1.0. */
export function walkableRadius(_angle: number): number {
  return ARENA.radius - 1.0 - 2.0; // scaffold: conservative constant until WO-002 adds the noise
}
