// src/tuning/camera.ts — owned by WO-002: PRESETS (framing numbers, experience.md §4.3) decide screenshot parity.
// Follow/kick/shake/orbit behaviour lives in tuning/follow.ts (WO-003). FROZEN signature: framingFor (pure).
// Model: camera = target + R(yaw)·(0, up, back); it looks along pitch −p (NOT at the hero).
// Yaw here uses the contracts' facing convention: spec "base yaw −14°" ⇒ yawDeg +14 (camera looks NE).

export interface Framing { aspect: number; vfovDeg: number; pitchDeg: number; back: number; up: number; yawDeg: number }

/** Sorted by aspect (w/h). Linear interpolation between neighbours; clamped at the ends. */
/** Retuned at the join (CEO, against reference.jpg): higher and further back with a steeper look so the meadow
 *  shows between hero and golem and the characters read at the reference's size (hero ≈ 11 %, golem ≈ 27 % of
 *  frame height). Solved numerically for hero/golem/temple screen positions; a steeper pitch pushes the temple
 *  out of the top edge (the horizon sits at sy ≈ 0.5 − tan p / (2 tan(fov/2))), so the look-down comes from a higher camera and a wider lens (66° at the reference aspect), not more pitch. */
export const PRESETS: readonly Framing[] = [
  { aspect: 0.46, vfovDeg: 70, pitchDeg: 17, back: 7.0, up: 7.0, yawDeg: 12 }, // phone portrait
  { aspect: 0.875, vfovDeg: 66, pitchDeg: 25, back: 6.0, up: 8.0, yawDeg: -3 }, // the reference frame
  { aspect: 1.78, vfovDeg: 48, pitchDeg: 20, back: 11.5, up: 9.5, yawDeg: 6 }, // desktop / landscape
  { aspect: 2.16, vfovDeg: 44, pitchDeg: 21, back: 11.5, up: 9.0, yawDeg: 6 }, // phone landscape
];

export const CLIP = { near: 0.1, far: 600 } as const;

/** Interpolated framing for a viewport aspect, written into `out` (no allocation). */
export function framingFor(aspect: number, out: Framing): Framing {
  const P = PRESETS;
  let a = P[0]!, b = P[P.length - 1]!;
  if (aspect <= a.aspect) b = a;
  else if (aspect >= b.aspect) a = b;
  else
    for (let i = 0; i < P.length - 1; i++)
      if (aspect >= P[i]!.aspect && aspect <= P[i + 1]!.aspect) {
        a = P[i]!;
        b = P[i + 1]!;
        break;
      }
  const t = b.aspect === a.aspect ? 0 : (aspect - a.aspect) / (b.aspect - a.aspect);
  out.aspect = aspect;
  out.vfovDeg = a.vfovDeg + (b.vfovDeg - a.vfovDeg) * t;
  out.pitchDeg = a.pitchDeg + (b.pitchDeg - a.pitchDeg) * t;
  out.back = a.back + (b.back - a.back) * t;
  out.up = a.up + (b.up - a.up) * t;
  out.yawDeg = a.yawDeg + (b.yawDeg - a.yawDeg) * t;
  return out;
}
