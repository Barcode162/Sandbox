// src/world/rocks.ts — owned by WO-002. Mossy boulders (§4.4: dodecahedron detail 1, noise ±15 %, y-scale 0.75,
// sunk 25 %, mossy tops, vertex AO) plus small rim stones, all merged into one shadow-casting mesh.
import * as THREE from 'three';
import { makeRng } from '../core/rng.ts';
import { PALETTE, SCENERY } from '../tuning/world.ts';
import { arenaRimRadius, groundHeight } from './ground.ts';
import { lumpy, merge, mixRGB, paint, place, rgbOf, type RGB } from './geo.ts';
import { noise2 } from './noise.ts';

const LIT = rgbOf(PALETTE.boulderLit), STONE_MID = rgbOf(PALETTE.stoneMid), MOSS = rgbOf(PALETTE.moss), MOSS_SHADE = rgbOf(PALETTE.mossShade);
const div = (a: RGB): RGB => [a[0] / LIT[0], a[1] / LIT[1], a[2] / LIT[2]];

function boulder(x: number, z: number, baseY: number, r: number, seed: number, mossy = true): THREE.BufferGeometry {
  const g = lumpy(new THREE.DodecahedronGeometry(1, 1), 0.15, 1.3, seed);
  const h = r * 0.75;
  place(g, x, baseY + h * 0.75, z, 0, seed * 1.7, 0, r, h, r * (0.9 + (seed % 3) * 0.08));
  const bottom = baseY;
  return paint(g, (px, py, pz, _nx, ny) => {
    let a = mixRGB(STONE_MID, LIT, 0.55 + 0.45 * noise2(px * 2.2, py * 2.2 + pz, seed));
    const hy = (py - bottom) / (h * 1.75);
    if (hy < 0.25) a = a.map((v) => v * (0.78 + hy * 0.88)) as RGB; // vertex AO
    const mossK = mossy ? ny + 0.35 * noise2(px * 3, pz * 3, seed + 4) : -1;
    if (mossK > 0.62) a = mixRGB(MOSS_SHADE, MOSS, Math.min(1, (mossK - 0.62) * 4));
    return div(a);
  });
}

export function buildRocks(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  SCENERY.boulders.forEach((b, i) => {
    const y = b.y ?? groundHeight(b.x, b.z);
    parts.push(boulder(b.x, b.z, y, b.r, i + 1));
    // A companion pebble or two at the foot.
    const rnd = makeRng(500 + i);
    for (let k = 0; k < 2; k++) {
      const a = rnd() * 6.28, d = b.r * (1.05 + rnd() * 0.4);
      const px = b.x + Math.cos(a) * d, pz = b.z + Math.sin(a) * d;
      parts.push(boulder(px, pz, (b.y ?? groundHeight(px, pz)) - 0.04, b.r * (0.18 + rnd() * 0.15), 40 + i * 3 + k, false));
    }
  });
  // Stones along the arena rim (the reference's edge rocks), skipping the bridge mouth.
  const rnd = makeRng(88);
  for (let i = 0; i < 16; i++) {
    const th = (i / 16) * Math.PI * 2 + rnd() * 0.3;
    const R = arenaRimRadius(th) - 0.4 - rnd() * 0.6;
    const x = Math.sin(th) * R, z = -Math.cos(th) * R;
    if (Math.hypot(x - 6.5, z + 9) < 3) continue;
    parts.push(boulder(x, z, groundHeight(x, z) - 0.05, 0.25 + rnd() * 0.35, 60 + i));
  }
  return merge(parts);
}
