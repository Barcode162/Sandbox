// src/world/foliage.ts — owned by WO-002. Trees (round, blossom, bush, cypress), grass tufts, flowers and the
// blossom petals (§4.4, §6). Canopies merge into two meshes (leaves, blossom) carrying a per-tree pivot so each
// tree still breathes, sways and dither-fades on its own; tufts, flowers and petals are instanced.
import * as THREE from 'three';
import { makeRng } from '../core/rng.ts';
import { AMBIENT, PALETTE, QUALITY, SCENERY, type TreeSpec } from '../tuning/world.ts';
import { ARENA } from '../tuning/arena.ts';
import { groundHeight, walkableRadius } from './ground.ts';
import { lumpy, merge, mixRGB, paint, pivot, place, rgbOf, transferNormals, type RGB } from './geo.ts';
import { noise2 } from './noise.ts';

const LEAF_LIT = rgbOf(PALETTE.leafLit), LEAF_MID = rgbOf(PALETTE.leafMid), GRASS_TIP = rgbOf(PALETTE.grassTip);
const BL_LIT = rgbOf(PALETTE.blossomLit), BL_MID = rgbOf(PALETTE.blossomMid), BL_SHADE = rgbOf(PALETTE.blossomShade), PETAL = rgbOf(PALETTE.petal);
const TRUNK = rgbOf(PALETTE.trunk), TRUNK_SHADE = rgbOf(PALETTE.trunkShade);
const div = (a: RGB, b: RGB): RGB => [a[0] / b[0], a[1] / b[1], a[2] / b[2]];

/** Base y of a tree (arena trees stand on the dome; others give y). */
export const treeBase = (t: TreeSpec) => t.y ?? groundHeight(t.x, t.z);

/** Fibonacci directions on the upper ~70 % of a sphere (puff placement). */
function puffDirs(n: number, seed: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const rnd = makeRng(seed);
  for (let i = 0; i < n; i++) {
    const y = 0.85 - (i / Math.max(1, n - 1)) * 1.15;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.39996 + rnd() * 0.5;
    out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return out;
}

export interface TreesBuild {
  trunks: THREE.BufferGeometry;
  leaves: THREE.BufferGeometry;
  blossom: THREE.BufferGeometry;
  /** Canopy spheres (centre + radius) in tree order, for the occlusion dither. */
  canopies: { x: number; y: number; z: number; r: number }[];
}

export function buildTrees(): TreesBuild {
  const trunks: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [], blossom: THREE.BufferGeometry[] = [];
  const canopies: TreesBuild['canopies'] = [];
  SCENERY.trees.forEach((t, ti) => {
    const rnd = makeRng(101 + ti * 7);
    const by = treeBase(t);
    const cy = by + t.canopyY, R = t.canopyR;
    canopies.push({ x: t.x, y: cy, z: t.z, r: R * 1.2 }); // the outer puffs reach ≈ 1.2–1.3 R
    if (t.kind === 'cypress') {
      const cone = lumpy(new THREE.IcosahedronGeometry(1, 3), 0.1, 2.2, ti);
      place(cone, t.x, by + t.canopyY * 0.55 + 0.3, t.z, 0, 0, 0, R, t.canopyY * 0.75, R);
      paint(cone, (_x, y) => div(mixRGB(LEAF_MID, LEAF_LIT, Math.min(1, Math.max(0, (y - by) / (t.canopyY * 1.2)))), LEAF_LIT));
      leaves.push(pivot(cone, t.x, cy, t.z, ti));
      const stub = new THREE.CylinderGeometry(0.1, 0.14, 0.6, 6);
      place(stub, t.x, by + 0.3, t.z);
      trunks.push(paint(stub, () => [1, 1, 1]));
      return;
    }
    // Trunk: tapered, leaning, with two forks reaching into the canopy and a flared root collar.
    const trunkTop = cy - R * 0.35;
    const lean = (rnd() - 0.5) * 0.25;
    const h = trunkTop - by;
    const scaleR = t.kind === 'bush' ? 0.7 : t.canopyR / 2.4 + 0.35;
    const main = new THREE.CylinderGeometry(0.18 * scaleR, 0.32 * scaleR, h, 9, 5);
    place(main, t.x + Math.sin(lean) * h * 0.5, by + h / 2, t.z, 0, 0, -lean);
    const pieces: THREE.BufferGeometry[] = [main];
    for (let k = 0; k < 2; k++) {
      const a = rnd() * Math.PI * 2 + k * Math.PI;
      const fl = R * 0.75;
      const fork = new THREE.CylinderGeometry(0.07 * scaleR, 0.15 * scaleR, fl, 6, 2);
      const tilt = 0.55 + rnd() * 0.25;
      const topX = t.x + Math.sin(lean) * h;
      place(fork, topX + Math.cos(a) * Math.sin(tilt) * fl * 0.5, trunkTop + Math.cos(tilt) * fl * 0.5 - 0.05, t.z + Math.sin(a) * Math.sin(tilt) * fl * 0.5,
        Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
      pieces.push(fork);
    }
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + rnd();
      const root = new THREE.ConeGeometry(0.16 * scaleR, 0.7 * scaleR, 5);
      place(root, t.x + Math.cos(a) * 0.25 * scaleR, by + 0.12, t.z + Math.sin(a) * 0.25 * scaleR, Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
      pieces.push(root);
    }
    for (const p of pieces)
      trunks.push(paint(p, (_x, y) => {
        const hy = (y - by) / Math.max(h, 0.1);
        // Vertex AO: 22 % darker in the lowest quarter, plus bark mottling.
        const ao = hy < 0.25 ? 0.78 + 0.88 * hy : 1;
        const a = mixRGB(TRUNK_SHADE, TRUNK, 0.65 + 0.35 * noise2(_x * 6, y * 3, ti));
        return div(a, TRUNK).map((v) => v * ao) as RGB;
      }));
    // Canopy: puffs (detail-2 icospheres, ±12 % noise, radii 0.45–0.7 × R) around a centre one.
    const isBlossom = t.kind === 'blossom';
    const dirs = puffDirs(t.puffs - 1, 300 + ti);
    const puffs: [number, number, number, number][] = [[0, 0.05 * R, 0, R * 0.7]];
    for (const [dx, dy, dz] of dirs) {
      const pr = R * (0.45 + rnd() * 0.25);
      const off = R - pr * 0.75;
      puffs.push([dx * off * 1.1, dy * off * 0.8, dz * off * 1.1, pr]);
    }
    const flat = t.kind === 'bush' ? 0.8 : 0.9;
    for (const [px, py, pz, pr] of puffs) {
      const g = lumpy(new THREE.IcosahedronGeometry(1, 3), 0.13, 2.4, ti * 5 + px);
      place(g, t.x + px, cy + py * flat, t.z + pz, 0, rnd() * 6, 0, pr, pr * flat, pr);
      transferNormals(g, t.x, cy - R * 0.25, t.z, 0.55);
      paint(g, (x, y, z) => {
        const hy = Math.min(1, Math.max(0, (y - (cy - R)) / (2 * R)));
        const n = 0.5 + 0.5 * noise2(x * 1.3, z * 1.3 + y, ti);
        if (isBlossom) {
          // Blossom clusters: blotchy petal-pink highlights over a mid-pink body, deeper toward the underside.
          const blot = 0.5 + 0.5 * noise2(x * 4.1, z * 4.1 + y * 3.7, ti + 9);
          let a = mixRGB(mixRGB(BL_SHADE, BL_MID, 0.4 + hy * 0.6), BL_LIT, Math.max(0, hy - 0.5) * 1.5 * n);
          a = mixRGB(a, PETAL, blot > 0.62 ? 0.45 : 0);
          return div(a, BL_LIT);
        }
        let a = mixRGB(LEAF_MID, LEAF_LIT, 0.35 + hy * 0.65);
        a = mixRGB(a, GRASS_TIP, Math.max(0, hy - 0.7) * 0.9 * n);
        return div(a, LEAF_LIT);
      });
      (isBlossom ? blossom : leaves).push(pivot(g, t.x, cy, t.z, ti));
    }
    if (isBlossom) {
      // Petal cards scattered on the canopy surface: the fluffy blossom silhouette.
      const n = QUALITY.high.blossomCards;
      const card = new THREE.CircleGeometry(0.055, 5);
      const cards: THREE.BufferGeometry[] = [];
      const crnd = makeRng(777);
      for (let i = 0; i < n; i++) {
        const [px, py, pz, pr] = puffs[Math.floor(crnd() * puffs.length)]!;
        const u = crnd() * 2 - 1, a = crnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
        const dx = s * Math.cos(a), dy = Math.max(-0.4, u), dz = s * Math.sin(a);
        const rr = pr * (0.97 + crnd() * 0.06);
        const c = card.clone();
        const x = t.x + px + dx * rr, y = cy + py * flat + dy * rr * flat, z = t.z + pz + dz * rr;
        place(c, x, y, z, crnd() * 6, crnd() * 6, crnd() * 6, 0.7 + crnd() * 0.5);
        const nm = c.getAttribute('normal');
        for (let k = 0; k < nm.count; k++) nm.setXYZ(k, dx, dy, dz);
        const shade = mixRGB(BL_MID, PETAL, crnd());
        const col = mixRGB(shade, BL_LIT, Math.max(0, dy) * 0.6);
        paint(c, () => div(col, BL_LIT));
        cards.push(pivot(c, t.x, cy, t.z, ti));
      }
      card.dispose();
      blossom.push(merge(cards));
    }
  });
  return { trunks: merge(trunks), leaves: merge(leaves), blossom: merge(blossom), canopies };
}

// ── Grass tufts ─────────────────────────────────────────────────────────────────────────────────────────
/** 3 crossed blades × 5 tris, unit height; colour root grass-shade → tip grass-tip. */
export function tuftGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const root = rgbOf(PALETTE.grassShade), mid = rgbOf(PALETTE.grassLit), tip = rgbOf(PALETTE.grassTip);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI + 0.3;
    const lean = 0.18 + b * 0.06;
    const w = [0.09, 0.075, 0.045];
    const ys = [0, 0.38, 0.72, 1];
    const pos: number[] = [];
    const pt = (side: number, j: number): [number, number, number] => {
      const y = ys[j]!;
      const half = j < 3 ? w[j]! * side : 0;
      const fwd = lean * y * y;
      return [Math.cos(a) * half + Math.sin(a) * fwd, y, -Math.sin(a) * half + Math.cos(a) * fwd];
    };
    const quad = (j: number) => {
      const p0 = pt(-1, j), p1 = pt(1, j), p2 = pt(-1, j + 1), p3 = pt(1, j + 1);
      pos.push(...p0, ...p1, ...p2, ...p1, ...p3, ...p2);
    };
    quad(0);
    quad(1);
    pos.push(...pt(-1, 2), ...pt(1, 2), ...pt(0, 3));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    // Normals point mostly up so blades light like the meadow they sit in.
    const nrm: number[] = [];
    for (let i = 0; i < pos.length / 3; i++) nrm.push(Math.sin(a) * 0.3, 0.9, Math.cos(a) * 0.3);
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    paint(g, (_x, y) => (y < 0.5 ? mixRGB(root, mid, y * 2) : mixRGB(mid, tip, (y - 0.5) * 2)));
    parts.push(g);
  }
  return merge(parts);
}

export interface Scatter { x: number; y: number; z: number; yaw: number; s: number; tint: number }

/** Deterministic tuft placement: denser near trunks/boulders (×1.6), thinner in the trampled centre (×0.4). */
export function scatterTufts(count: number, seed = 5): Scatter[] {
  const rnd = makeRng(seed);
  const obstacles = ARENA.colliders;
  const out: Scatter[] = [];
  let guard = 0;
  const ti = SCENERY.templeIsland;
  while (out.length < count && guard++ < count * 20) {
    const onTemple = rnd() < 0.12;
    let x: number, z: number, y: number;
    if (onTemple) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 8.5;
      x = ti.x + Math.sin(a) * r;
      z = ti.z - Math.cos(a) * r;
      y = ti.y;
      if (Math.hypot(x - SCENERY.temple.x, z - SCENERY.temple.z) < 6) continue;
    } else {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * (walkableRadius(a) + 0.8);
      x = Math.sin(a) * r;
      z = -Math.cos(a) * r;
      y = groundHeight(x, z);
      let w = 1;
      let blocked = false;
      for (const o of obstacles) {
        const d = Math.hypot(x - o.x, z - o.z);
        if (d < o.r * 0.9) blocked = true;
        else if (d < o.r + 1.8) w = 1.6;
      }
      if (blocked) continue;
      if (Math.hypot(x - 0, z - 2.5) < 5) w *= 0.4;
      // Clumpy meadow: noise thins some patches so the ground texture reads between tufts.
      w *= 0.55 + 0.45 * (noise2(x * 0.35, z * 0.35, 77) * 0.5 + 0.5) * 1.6;
      if (rnd() * 1.6 > w) continue;
    }
    out.push({ x, y: y - 0.03, z, yaw: rnd() * Math.PI * 2, s: 0.25 + rnd() * 0.2, tint: rnd() });
  }
  return out;
}

/** Flower head: 5 petals around a gold centre + a short stem (petals white so instance colour tints them). */
export function flowerGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const pet = new THREE.CircleGeometry(0.045, 6);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = pet.clone();
    place(p, Math.cos(a) * 0.045, 0.16, Math.sin(a) * 0.045, -Math.PI / 2 + 0.25, 0, 0, 1, 1.25, 1);
    parts.push(paint(p, () => [1, 1, 1]));
  }
  const c = new THREE.CircleGeometry(0.028, 6);
  place(c, 0, 0.165, 0, -Math.PI / 2);
  parts.push(paint(c, () => rgbOf(PALETTE.flYellow)));
  const stem = new THREE.PlaneGeometry(0.018, 0.16);
  place(stem, 0, 0.08, 0);
  parts.push(paint(stem, () => rgbOf(PALETTE.grassShade)));
  const g = merge(parts);
  // Up-facing normals: flowers light like the meadow.
  const n = g.getAttribute('normal');
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  pet.dispose();
  c.dispose();
  stem.dispose();
  return g;
}

/** Flower clumps of 3–7: 55 % white, 25 % yellow, 12 % pink, 8 % blue. */
export function scatterFlowers(count: number, seed = 9): (Scatter & { color: number })[] {
  const rnd = makeRng(seed);
  const out: (Scatter & { color: number })[] = [];
  while (out.length < count) {
    const a = rnd() * Math.PI * 2;
    const r = 2 + Math.sqrt(rnd()) * (walkableRadius(a) - 1.5);
    const cx = Math.sin(a) * r, cz = -Math.cos(a) * r;
    if (Math.hypot(cx, cz - 2.5) < 3.2) continue;
    const p = rnd();
    const color = p < 0.55 ? PALETTE.flWhite : p < 0.8 ? PALETTE.flYellow : p < 0.92 ? PALETTE.flPink : PALETTE.flBlue;
    const k = 3 + Math.floor(rnd() * 5);
    for (let i = 0; i < k && out.length < count; i++) {
      const x = cx + (rnd() - 0.5) * 1.1, z = cz + (rnd() - 0.5) * 1.1;
      if (ARENA.colliders.some((o) => Math.hypot(x - o.x, z - o.z) < o.r)) continue;
      out.push({ x, y: groundHeight(x, z) - 0.02, z, yaw: rnd() * 6.28, s: 0.8 + rnd() * 0.6, tint: rnd(), color });
    }
  }
  return out;
}

// ── Falling petals (§6): spiral down from B, carried across the arena by the wind, fade at 12 m ────────────
export interface PetalState { x0: number; y0: number; z0: number; phase: number; life: number; spin: number }

export function seedPetals(n: number): PetalState[] {
  const b = SCENERY.trees.find((t) => t.id === 'B')!;
  const rnd = makeRng(4242);
  const by = treeBase(b);
  const out: PetalState[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, r = rnd() * b.canopyR;
    out.push({ x0: b.x + Math.cos(a) * r, y0: by + b.canopyY - 0.4 + rnd() * 1.0, z0: b.z + Math.sin(a) * r, phase: rnd(), life: 0, spin: 0.6 + rnd() * 0.8 });
  }
  return out;
}

const WIND_X = 0.88, WIND_Z = -0.47;
/** Petal pose at time t (pure; the view writes it into an instance matrix). Returns scale (0 = hidden). */
export function petalPose(p: PetalState, t: number, out: { x: number; y: number; z: number; rx: number; ry: number; s: number }): void {
  const period = AMBIENT.petalFade / AMBIENT.petalWind;
  const age = ((t / period + p.phase) % 1) * period;
  const drift = age * AMBIENT.petalWind;
  const sw = AMBIENT.petalSpiral;
  out.x = p.x0 + WIND_X * drift + Math.cos(age * AMBIENT.petalSpin + p.phase * 6) * sw;
  out.z = p.z0 + WIND_Z * drift + Math.sin(age * AMBIENT.petalSpin + p.phase * 6) * sw;
  const g = groundHeight(out.x, out.z) + 0.03;
  out.y = Math.max(g, p.y0 - age * AMBIENT.petalFall);
  const landed = out.y <= g + 1e-3;
  out.rx = landed ? 1.45 : age * AMBIENT.petalSpin * p.spin;
  out.ry = age * 1.3 * p.spin;
  const fadeIn = Math.min(1, age / 0.5), fadeOut = Math.min(1, (period - age) / 1.5);
  out.s = Math.max(0, Math.min(fadeIn, fadeOut));
}
