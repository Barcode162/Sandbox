// tests/unit/support/view.ts — the default camera of experience.md §8, for checking authored
// layouts the way a viewer sees them: fit the layout's bounding sphere, vfov 45°, elevation +12°.
// Projected coordinates are in world units at the target's depth, so spacings read like world sizes.
import type { Vec3 } from '../../../src/core/types.ts';

export const ELEVATION_DEG = 12;
const VFOV_DEG = 45;

/** World radius the renderer gives a node (src/view/renderer.ts `worldR`): 1.6 + 0.45·√degree. */
export const nodeRadius = (degree: number): number => 1.6 + 0.45 * Math.sqrt(degree);
/** One ~14 px label line at the default fit (≈ 2 px per world unit at 1440 × 900). */
export const LABEL_CLEARANCE = 7;

/** Screen-plane coordinates for every point, seen from the default camera (+z side, raised 12°). */
export function defaultView(points: Record<string, Vec3>): Record<string, { x: number; y: number }> {
  const all = Object.values(points);
  const c = all.reduce((s, p) => ({ x: s.x + p.x / all.length, y: s.y + p.y / all.length, z: s.z + p.z / all.length }), { x: 0, y: 0, z: 0 });
  const R = Math.max(...all.map((p) => Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z)));
  const d = R / Math.sin(((VFOV_DEG / 2) * Math.PI) / 180);
  const e = (ELEVATION_DEG * Math.PI) / 180;
  const out: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(points)) {
    const x = p.x - c.x, y = p.y - c.y, z = p.z - c.z;
    // Camera basis: right = +x, up = (0, cos e, −sin e), toward the camera = (0, sin e, cos e).
    const up = y * Math.cos(e) - z * Math.sin(e);
    const toward = y * Math.sin(e) + z * Math.cos(e);
    const k = d / (d - toward);
    out[id] = { x: x * k, y: up * k };
  }
  return out;
}

/** Orthographic screen-up coordinate (cheap approximation used while authoring a cluster). */
export const screenUp = (p: Vec3): number => p.y * Math.cos((ELEVATION_DEG * Math.PI) / 180) - p.z * Math.sin((ELEVATION_DEG * Math.PI) / 180);
