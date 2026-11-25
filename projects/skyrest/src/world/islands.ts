// src/world/islands.ts — owned by WO-002. Floating isles (§4.4): grass tops with a rolled soil lip, and rock
// undersides (strata, rock columns, hanging roots, vines). Every top merges into ONE grass mesh and every
// underside into ONE cliff mesh, so the arena, the temple isle, the spire and five distant isles cost 2 draws.
import * as THREE from 'three';
import { ARENA } from '../tuning/arena.ts';
import { PALETTE, SCENERY, type IsleSpec } from '../tuning/world.ts';
import { makeRng } from '../core/rng.ts';
import { arenaRimRadius, groundHeight } from './ground.ts';
import { noise2, noiseAngle } from './noise.ts';
import { lumpy, merge, mixRGB, paint, place, rgbOf, type RGB } from './geo.ts';

interface IsleDef {
  cx: number;
  cz: number;
  /** Rim radius of the grass top at angle θ (contracts convention θ = atan2(dx, −dz)). */
  rim: (theta: number) => number;
  /** Top height at world (x, z). */
  top: (x: number, z: number) => number;
  depth: number;
  strata: number;
  roots: number;
  vines: number;
  seed: number;
  rings: number;
  segs: number;
}

const GRASS_MID = rgbOf(PALETTE.grassMid), GRASS_LIT = rgbOf(PALETTE.grassLit), GRASS_SHADE = rgbOf(PALETTE.grassShade);
const SOIL = rgbOf(PALETTE.soilLip), CLIFF_LIT = rgbOf(PALETTE.cliffLit), CLIFF_MID = rgbOf(PALETTE.cliffMid), CLIFF_SHADE = rgbOf(PALETTE.cliffShade);
const LEAF_MID = rgbOf(PALETTE.leafMid), LEAF_SHADE = rgbOf(PALETTE.leafShade), MOSS = rgbOf(PALETTE.moss);
const WHITE: RGB = [1, 1, 1];

/** Grid helper: rows × cols vertex grid (cols wraps) → indexed triangles. */
function wrapGrid(rows: number, cols: number, pos: Float32Array, col: Float32Array, uv: Float32Array): THREE.BufferGeometry {
  const idx: number[] = [];
  for (let r = 0; r < rows - 1; r++)
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Builds one isle: [grass top incl. lip drape, rock underside incl. roots + vines]. */
function buildIsle(d: IsleDef, contact: { x: number; z: number; r: number }[]): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const { cx, cz, segs } = d;
  // ── Top: polar grid, denser toward the rim, then a rounded grass lip that drapes over the edge.
  const radial: number[] = [];
  for (let j = 0; j <= d.rings; j++) radial.push(Math.pow(j / d.rings, 0.75));
  const lip = [[1.0 + 0.012, -0.05], [1.0 + 0.02, -0.16], [1.0 + 0.018, -0.3]] as const; // (r ×, y offset)
  const rows = radial.length + lip.length;
  const tp = new Float32Array(rows * (segs + 1) * 3), tc = new Float32Array(rows * (segs + 1) * 3), tu = new Float32Array(rows * (segs + 1) * 2);
  const edge: { x: number; y: number; z: number; r: number; th: number }[] = [];
  for (let c = 0; c <= segs; c++) {
    const th = (c / segs) * Math.PI * 2;
    const R = d.rim(th);
    const sx = Math.sin(th), sz = -Math.cos(th);
    const ex = cx + sx * R, ez = cz + sz * R;
    const ey = d.top(ex, ez);
    for (let j = 0; j < rows; j++) {
      let x: number, y: number, z: number;
      if (j < radial.length) {
        const rr = radial[j]! * R;
        x = cx + sx * rr;
        z = cz + sz * rr;
        y = d.top(x, z);
      } else {
        const [k, dy] = lip[j - radial.length]!;
        x = cx + sx * (R * k + 0.06);
        z = cz + sz * (R * k + 0.06);
        y = ey + dy;
      }
      const i = j * (segs + 1) + c;
      tp.set([x, y, z], i * 3);
      // Albedo: mottled lit/mid, contact darkening near trunks and boulders, the lip shades down to soil.
      let a = mixRGB(GRASS_MID, GRASS_LIT, 0.5 + 0.5 * noise2(x * 0.18, z * 0.18, d.seed));
      for (const o of contact) {
        const dd = Math.hypot(x - o.x, z - o.z);
        if (dd < o.r * 2.2) a = mixRGB(a, GRASS_SHADE, 0.35 * (1 - dd / (o.r * 2.2)));
      }
      if (j >= radial.length) a = mixRGB(GRASS_SHADE, SOIL, (j - radial.length) / (lip.length - 1) * 0.6);
      // The texture already carries grass-mid/lit: vertex colour is the ratio against the texture's mean.
      tc.set([a[0] / GRASS_MID[0] * 0.92, a[1] / GRASS_MID[1] * 0.92, a[2] / GRASS_MID[2] * 0.92], i * 3);
      tu.set([x / 7, z / 7], i * 2);
    }
    edge.push({ x: ex, y: ey - 0.3, z: ez, r: R, th });
  }
  const top = wrapGrid(rows, segs, tp, tc, tu);
  // Fan centre is degenerate (ring 0 has radius 0): fine, the whole ring collapses to the centre point.

  // ── Underside: strata bands, then a tapering rock cone with vertical column noise.
  const K = 30;
  const cp = new Float32Array((K + 1) * (segs + 1) * 3), cc = new Float32Array((K + 1) * (segs + 1) * 3), cu = new Float32Array((K + 1) * (segs + 1) * 2);
  for (let c = 0; c <= segs; c++) {
    const e = edge[c]!;
    const sx = Math.sin(e.th), sz = -Math.cos(e.th);
    const circ = e.r * Math.PI * 2;
    for (let k = 0; k <= K; k++) {
      const t = k / K;
      const yTop = e.y;
      const y = yTop - d.depth * Math.pow(t, 1.1);
      // Vertical cliff band for the first ~22 %, then taper to a ragged tip.
      const band = t < 0.22 ? 1 - t * 0.35 : 0.923 * Math.pow(1 - (t - 0.22) / 0.78, 0.85);
      const ledge = 1 - 0.035 * Math.abs(Math.sin(t * d.strata * Math.PI));
      const column = 1 + 0.07 * noise2(e.th * 7.5, t * 3.0, d.seed + 5) + 0.035 * noise2(e.th * 19, t * 9, d.seed + 6);
      const rr = Math.max(0.15, e.r * band * ledge * column);
      const x = cx + sx * rr + (k === K ? 0 : 0), z = cz + sz * rr;
      const i = k * (segs + 1) + c;
      cp.set([x, k === 0 ? yTop : y, z], i * 3);
      let a: RGB;
      if (k === 0) a = SOIL;
      else {
        const s = 0.5 + 0.5 * Math.sin(t * d.strata * Math.PI * 2 + noise2(e.th * 3, t * 4, d.seed) * 1.5);
        a = mixRGB(CLIFF_MID, CLIFF_LIT, s);
        a = mixRGB(a, CLIFF_SHADE, Math.min(1, t * 1.1) * 0.75);
        if (k === 1) a = mixRGB(a, SOIL, 0.55);
        // Moss in the upper strata.
        if (t < 0.25 && noise2(e.th * 9, t * 12, d.seed + 9) > 0.35) a = mixRGB(a, MOSS, 0.55);
      }
      cc.set([a[0] / CLIFF_LIT[0], a[1] / CLIFF_LIT[1], a[2] / CLIFF_LIT[2]].map((v) => Math.min(v, 1.6)), i * 3);
      cu.set([(c / segs) * circ / 9, y / 9], i * 2);
    }
  }
  const parts: THREE.BufferGeometry[] = [wrapGrid(K + 1, segs, cp, cc, cu)];
  const rnd = makeRng(d.seed * 13 + 1);
  // Hanging rock roots under the bulk.
  for (let i = 0; i < d.roots; i++) {
    const th = rnd() * Math.PI * 2, rf = 0.25 + rnd() * 0.35;
    const R = d.rim(th) * rf;
    const len = d.depth * (0.25 + rnd() * 0.25);
    const x = cx + Math.sin(th) * R, z = cz - Math.cos(th) * R;
    const topY = d.top(x, z) - d.depth * (0.35 + rf * 0.4);
    const cone = lumpy(new THREE.ConeGeometry(R * 0.28 + 0.6, len, 7, 4), 0.18, 0.9, d.seed + i);
    place(cone, x, topY - len * 0.5 + 1, z, Math.PI, rnd(), 0);
    paint(cone, (_x, y) => {
      const t = Math.min(1, Math.max(0, (topY - y) / len));
      const a = mixRGB(mixRGB(CLIFF_MID, CLIFF_LIT, 0.4), CLIFF_SHADE, 0.45 + t * 0.4);
      return [a[0] / CLIFF_LIT[0], a[1] / CLIFF_LIT[1], a[2] / CLIFF_LIT[2]];
    });
    parts.push(cone);
  }
  // Vines draped over the lip (thin green strips).
  for (let i = 0; i < d.vines; i++) {
    const e = edge[Math.floor(rnd() * segs)]!;
    const len = 1.2 + rnd() * 3.5;
    const v = new THREE.BoxGeometry(0.16, len, 0.08, 1, 4, 1);
    const sx = Math.sin(e.th), sz = -Math.cos(e.th);
    place(v, cx + sx * (e.r * 1.03 + 0.08), e.y - len / 2 + 0.2, cz + sz * (e.r * 1.03 + 0.08), 0, -e.th, 0);
    paint(v, (_x, y) => {
      const t = Math.min(1, Math.max(0, (e.y - y) / len));
      const a = mixRGB(LEAF_MID, LEAF_SHADE, t * 0.6);
      return [a[0] / CLIFF_LIT[0], a[1] / CLIFF_LIT[1], a[2] / CLIFF_LIT[2]];
    });
    parts.push(v);
  }
  void WHITE;
  return [top, merge(parts)];
}

function isleFromSpec(s: IsleSpec, vines: number, rimFn?: (th: number) => number): IsleDef {
  return {
    cx: s.x, cz: s.z, depth: s.depth, strata: s.strata, roots: s.roots, vines, seed: s.seed, rings: 8, segs: 40,
    rim: rimFn ?? ((th) => s.r * (1 + 0.12 * noiseAngle(th, 1.4, s.seed) + 0.05 * noiseAngle(th, 4, s.seed + 1))),
    top: (x, z) => {
      const r2 = ((x - s.x) ** 2 + (z - s.z) ** 2) / (s.r * s.r);
      return s.y + 0.4 * Math.max(0, 1 - r2) + 0.12 * noise2(x / 5, z / 5, s.seed);
    },
  };
}

/** Temple isle: radius 10 with a lobe reaching the bridge's far post P2. */
function templeRim(th: number): number {
  const t = SCENERY.templeIsland, p2 = SCENERY.bridgeP2;
  const toP2 = Math.atan2(p2.x - t.x, -(p2.z - t.z));
  let dth = Math.abs(th - toP2) % (Math.PI * 2);
  if (dth > Math.PI) dth = Math.PI * 2 - dth;
  const lobe = 3.4 * Math.exp(-(dth * dth) / 0.09);
  return SCENERY.templeIslandRadius * (1 + 0.07 * noiseAngle(th, 1.6, 51)) + lobe;
}

export interface IslandsBuild {
  tops: THREE.BufferGeometry;
  cliffs: THREE.BufferGeometry;
  /** The arena isle's own top (probe 'arena'). */
  arenaTop: THREE.BufferGeometry;
}

/** Builds every isle. `contact` = trunk/boulder circles that darken the grass around them. */
export function buildIslands(contact: { x: number; z: number; r: number }[]): IslandsBuild {
  const arena: IsleDef = {
    cx: 0, cz: 0, rim: arenaRimRadius, top: groundHeight, depth: SCENERY.arenaDepth, strata: 4, roots: 6, vines: 14, seed: 3, rings: 30, segs: 96,
  };
  const [aTop, aCliff] = buildIsle(arena, contact);
  const ti = SCENERY.templeIsland;
  const temple: IsleDef = {
    ...isleFromSpec({ x: ti.x, y: ti.y, z: ti.z, r: SCENERY.templeIslandRadius, depth: 34, strata: 3, roots: 4, seed: 51 }, 22, templeRim),
    top: (x, z) => ti.y + 0.06 * noise2(x / 4, z / 4, 51) + 0.25 * Math.max(0, 1 - ((x - ti.x) ** 2 + (z - ti.z) ** 2) / 140),
    rings: 10, segs: 64,
  };
  const [tTop, tCliff] = buildIsle(temple, contact);
  const sp = SCENERY.spire;
  const [sTop, sCliff] = buildIsle({ ...isleFromSpec(sp, 6), rings: 5, segs: 28 }, contact);
  const tops = [aTop.clone(), tTop, sTop];
  const cliffs = [aCliff, tCliff, sCliff];
  for (const s of SCENERY.distantIsles) {
    const [t, c] = buildIsle(isleFromSpec(s, 0), []);
    tops.push(t);
    cliffs.push(c);
  }
  void ARENA;
  return { tops: merge(tops), cliffs: merge(cliffs), arenaTop: aTop };
}
