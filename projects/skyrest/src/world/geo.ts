// src/world/geo.ts — owned by WO-002. Geometry helpers for the procedural world: every static piece is baked
// into world space with vertex colours and merged by material, so the whole world costs a few dozen draws.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { noise2 } from './noise.ts';

export type RGB = [number, number, number];
const tmpC = new THREE.Color();
export const rgbOf = (hex: number): RGB => {
  tmpC.setHex(hex, THREE.SRGBColorSpace);
  return [tmpC.r, tmpC.g, tmpC.b];
};
export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Non-indexed copy with position, normal, uv and color present (colour defaults to white). */
export function normalise(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = src.index ? src.toNonIndexed() : src.clone();
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  const n = g.getAttribute('position').count;
  if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  if (!g.getAttribute('color')) g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color', 'aPivot'].includes(k)) g.deleteAttribute(k);
  return g;
}

/** Concatenates normalised geometries (all attributes of the first are kept; missing aPivot → zeros). */
export function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const parts = list.map(normalise);
  const keys = ['position', 'normal', 'uv', 'color'];
  if (parts.some((p) => p.getAttribute('aPivot'))) keys.push('aPivot');
  const out = new THREE.BufferGeometry();
  for (const k of keys) {
    const size = k === 'uv' ? 2 : k === 'aPivot' ? 4 : 3;
    const total = parts.reduce((s, p) => s + p.getAttribute('position').count, 0);
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const p of parts) {
      const a = p.getAttribute(k) as THREE.BufferAttribute | undefined;
      const cnt = p.getAttribute('position').count;
      if (a) arr.set(a.array as Float32Array, o);
      o += cnt * size;
    }
    out.setAttribute(k, new THREE.Float32BufferAttribute(arr, size));
  }
  out.computeBoundingSphere();
  out.computeBoundingBox();
  for (const p of parts) p.dispose();
  return out;
}

/** Paints vertex colours from a callback over world position + normal. */
export function paint(g: THREE.BufferGeometry, fn: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => RGB): THREE.BufferGeometry {
  const p = g.getAttribute('position'), nrm = g.getAttribute('normal');
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const c = fn(p.getX(i), p.getY(i), p.getZ(i), nrm ? nrm.getX(i) : 0, nrm ? nrm.getY(i) : 1, nrm ? nrm.getZ(i) : 0);
    col[i * 3] = c[0];
    col[i * 3 + 1] = c[1];
    col[i * 3 + 2] = c[2];
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** Sets a constant aPivot (centre xyz + index) on every vertex (canopy breathing/sway/dither). */
export function pivot(g: THREE.BufferGeometry, x: number, y: number, z: number, index: number): THREE.BufferGeometry {
  const n = g.getAttribute('position').count;
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) a.set([x, y, z, index], i * 4);
  g.setAttribute('aPivot', new THREE.Float32BufferAttribute(a, 4));
  return g;
}

/** A lumpy smooth blob: polyhedron welded, displaced by noise along the normal, smooth normals. */
export function lumpy(base: THREE.BufferGeometry, amp: number, freq: number, seed: number): THREE.BufferGeometry {
  base.deleteAttribute('normal');
  const uv = base.getAttribute('uv');
  if (uv) base.deleteAttribute('uv');
  const g = mergeVertices(base, 1e-4);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    const k = 1 + amp * (noise2(x * freq + seed, z * freq - y * 0.7 * freq, seed) * 0.7 + noise2(y * freq * 2.1, x * freq * 2.1 + z, seed + 3) * 0.3);
    p.setXYZ(i, (x / len) * len * k, (y / len) * len * k, (z / len) * len * k);
  }
  g.computeVertexNormals();
  // Spherical UVs (canopy scallops).
  const uvs = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), len = Math.hypot(x, y, z) || 1;
    uvs[i * 2] = Math.atan2(z, x) / (Math.PI * 2) + 0.5;
    uvs[i * 2 + 1] = Math.acos(Math.max(-1, Math.min(1, y / len))) / Math.PI;
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  base.dispose();
  return g;
}

/** Applies a transform (position, Euler, scale) to a geometry in place. */
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
export function place(g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx): THREE.BufferGeometry {
  m4.compose(v.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), s.set(sx, sy, sz));
  g.applyMatrix4(m4);
  return g;
}

/** Bends normals toward the direction from `c` (centre-transferred normals: a cluster shades as one volume). */
export function transferNormals(g: THREE.BufferGeometry, cx: number, cy: number, cz: number, k: number): THREE.BufferGeometry {
  const p = g.getAttribute('position'), n = g.getAttribute('normal');
  for (let i = 0; i < p.count; i++) {
    let dx = p.getX(i) - cx, dy = p.getY(i) - cy, dz = p.getZ(i) - cz;
    const l = Math.hypot(dx, dy, dz) || 1;
    dx /= l;
    dy /= l;
    dz /= l;
    let nx = n.getX(i) * (1 - k) + dx * k, ny = n.getY(i) * (1 - k) + dy * k, nz = n.getZ(i) * (1 - k) + dz * k;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    n.setXYZ(i, nx, ny, nz);
  }
  return g;
}
