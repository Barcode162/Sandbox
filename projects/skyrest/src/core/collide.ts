// src/core/collide.ts — FROZEN (WO-001). Pure ground-plane collision shared by hero, golem and minions.
import type { Vec2 } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { walkableRadius } from '../world/ground.ts';

/** Keep a body of `radius` inside the walkable edge (soft walls are a view/feel concern; sim is hard). */
export function clampToArena(p: Vec2, radius: number): void {
  const d = Math.hypot(p.x, p.z);
  if (d < 1e-6) return;
  const r = walkableRadius(Math.atan2(p.x, -p.z)) - radius;
  if (d > r) {
    p.x *= r / d;
    p.z *= r / d;
  }
}

/** Push p out of circle (cx, cz, r + radius). Returns true if it moved. */
export function pushOutOfCircle(p: Vec2, radius: number, cx: number, cz: number, r: number): boolean {
  const dx = p.x - cx, dz = p.z - cz;
  const min = r + radius;
  const d2 = dx * dx + dz * dz;
  if (d2 >= min * min) return false;
  const d = Math.sqrt(d2);
  const nx = d > 1e-6 ? dx / d : 0, nz = d > 1e-6 ? dz / d : 1;
  p.x = cx + nx * min;
  p.z = cz + nz * min;
  return true;
}

/** Push p out of every static collider in ARENA.colliders, then clamp to the arena. */
export function collideStatic(p: Vec2, radius: number): void {
  const cs = ARENA.colliders;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i]!;
    pushOutOfCircle(p, radius, c.x, c.z, c.r);
  }
  clampToArena(p, radius);
}
