// src/world/occlusion.ts — owned by WO-002. Pure geometry for the canopy/trunk occlusion fade (§4.3, F-022):
// no three, no DOM, so the unit tests run it in node.

export interface P3 { x: number; y: number; z: number }
/** A tree's trunk as a segment from its base (bx, by, bz) up to its canopy centre (x, y, z). */
export interface TrunkSeg extends P3 { bx: number; by: number; bz: number }

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Squared distance between the sight segment (o + s·dir, s ∈ [0, len], dir unit length) and a trunk segment.
 *  Closest points of two segments, clamped (Ericson, Real-Time Collision Detection §5.1.9). Allocation-free. */
export function segSegDist2(o: P3, dir: P3, len: number, c: TrunkSeg): number {
  const dx = c.x - c.bx, dy = c.y - c.by, dz = c.z - c.bz;
  const rx = o.x - c.bx, ry = o.y - c.by, rz = o.z - c.bz;
  const e = dx * dx + dy * dy + dz * dz;
  const b = dir.x * dx + dir.y * dy + dir.z * dz;
  const cc = dir.x * rx + dir.y * ry + dir.z * rz;
  const f = dx * rx + dy * ry + dz * rz;
  const denom = e - b * b; // |dir|² = 1
  let s = denom > 1e-9 ? clamp((b * f - cc * e) / denom, 0, len) : 0;
  let t = e > 1e-9 ? (b * s + f) / e : 0;
  if (t < 0) {
    t = 0;
    s = clamp(-cc, 0, len);
  } else if (t > 1) {
    t = 1;
    s = clamp(b - cc, 0, len);
  }
  const ex = o.x + dir.x * s - (c.bx + dx * t), ey = o.y + dir.y * s - (c.by + dy * t), ez = o.z + dir.z * s - (c.bz + dz * t);
  return ex * ex + ey * ey + ez * ez;
}
