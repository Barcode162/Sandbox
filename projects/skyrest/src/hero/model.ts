// src/hero/model.ts — owned by WO-003. Builds "Aster" (experience.md §4.5): chibi 1 : 1.3 head:body, 1.25 m,
// white anime hair of flat locks swept back and down (its own mesh), crystal sword, spring cape (shown at ×1.3, see HERO_SCALE). Every bone is ONE merged, vertex-coloured mesh on the
// shared SoftToon material (few draw calls), plus a screen-space ink outline (constant ~1.6 px).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { emissiveMaterial, glowSprite, toonMaterial } from '../render/materials.ts';
import { HIPS_Y, PIVOT_Y, SHOULDER_R } from './pose.ts';

export const HERO_COLORS = {
  blade: 0x8ff1f6, cape: 0x3a6ad5, capeShade: 0x22448f, lining: 0xeef2fa, hair: 0xfaf8f4, hairShade: 0xc4cbe0,
  tunic: 0x2c3550, skin: 0xffe1cc, boots: 0x3a2a22, gold: 0xe3b84a, eye: 0x1e2a4a, white: 0xf6f8fc, belt: 0x6a4a35,
  pants: 0x252c42, ink: 0x1f2a44,
} as const;
const C = HERO_COLORS;

const tmpC = new THREE.Color();
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);
const v3 = new THREE.Vector3();
const sc = new THREE.Vector3();

/** Bake a primitive: transform, then paint one colour into a `color` attribute. */
function part(g: THREE.BufferGeometry, color: number, pos: [number, number, number] = [0, 0, 0], dir?: [number, number, number], scale: [number, number, number] = [1, 1, 1]): THREE.BufferGeometry {
  if (dir) q.setFromUnitVectors(up, v3.set(dir[0], dir[1], dir[2]).normalize());
  else q.identity();
  m4.compose(v3.set(pos[0], pos[1], pos[2]), q, sc.set(scale[0], scale[1], scale[2]));
  g.applyMatrix4(m4);
  tmpC.setHex(color);
  const n = g.attributes.position!.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(parts, false)!;
  for (const p of parts) p.dispose();
  g.computeBoundingSphere();
  return g;
}
/** Hair-cap centre (head-local): the skull of the hair sits a little up and back of the face sphere. */
const HC = new THREE.Vector3(0, 0.04, -0.045);
const HAIR_R = 0.285;
/** Unit direction from the hair centre: az 0 = straight back (−z), +90° = the hero's left (+x); el = elevation. */
function hairDir(azDeg: number, elDeg: number, out = new THREE.Vector3()): THREE.Vector3 {
  const a = THREE.MathUtils.degToRad(azDeg), e = THREE.MathUtils.degToRad(elDeg);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

/** One flat anime lock (F-011, round 2). It is a lens-section ribbon that hugs the skull along the great circle
 *  from (az0, el0) to (az1, el1), lifted `lift` m off the cap, then optionally falls `tail` m straight on toward
 *  down-and-back (the nape). Width peaks near the root and tapers to a point; the top face is hair white and the
 *  underside the cool hair shade, so even unlit from behind it reads as white hair over a shadowed layer. */
function hairLock(az0: number, el0: number, az1: number, el1: number, halfW: number, thick: number, lift: number, tail = 0): THREE.BufferGeometry {
  const s = hairDir(az0, el0), e = hairDir(az1, el1);
  const ang = s.angleTo(e);
  const axis = new THREE.Vector3().crossVectors(s, e).normalize();
  // Centre-line samples with their outward normal.
  const pts: THREE.Vector3[] = [], nrm: THREE.Vector3[] = [];
  const ARC = 14;
  for (let i = 0; i <= ARC; i++) {
    const d = s.clone().applyAxisAngle(axis, (ang * i) / ARC);
    const r = HAIR_R + lift * (1 - 0.35 * (i / ARC));
    pts.push(d.clone().multiplyScalar(r).add(HC));
    nrm.push(d);
  }
  if (tail > 0) {
    const last = pts[ARC]!, tan = last.clone().sub(pts[ARC - 1]!).normalize();
    const fall = tan.clone().lerp(new THREE.Vector3(0, -1, -0.25).normalize(), 0.7).normalize();
    const n0 = nrm[ARC]!;
    for (let k = 1; k <= 5; k++) {
      // Curls slightly outward at the end so the tip lies off the neck, not into it.
      pts.push(last.clone().addScaledVector(fall, (tail * k) / 5).addScaledVector(n0, 0.012 * k * k / 25));
      nrm.push(n0.clone());
    }
  }
  // Arc-length parameter t ∈ [0, 1].
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1]! + pts[i]!.distanceTo(pts[i - 1]!));
  const total = len[len.length - 1]!;
  const K = 7; // samples across the width
  const pos: number[] = [], col: number[] = [];
  const lit = new THREE.Color(C.hair), shade = new THREE.Color(C.hairShade), mid = lit.clone().lerp(shade, 0.35);
  const T = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3(), p = new THREE.Vector3();
  const rows: number = pts.length;
  for (let i = 0; i < rows; i++) {
    const t = len[i]! / total;
    T.subVectors(pts[Math.min(rows - 1, i + 1)]!, pts[Math.max(0, i - 1)]!).normalize();
    B.crossVectors(T, nrm[i]!).normalize();
    N.crossVectors(B, T).normalize();
    // Width: rounded root, widest at t≈0.3, pointed tip. Thickness thins toward the tip.
    const w = halfW * Math.min(1, 0.55 + t * 1.5) * Math.pow(1 - t, 0.85) * 1.15;
    const th = thick * (1 - 0.8 * t);
    // Ring: top face (K points, left→right) then underside (K points, right→left).
    for (let side = 0; side < 2; side++)
      for (let k = 0; k < K; k++) {
        const u = side === 0 ? -1 + (2 * k) / (K - 1) : 1 - (2 * k) / (K - 1);
        const bulge = Math.sqrt(Math.max(0, 1 - u * u));
        p.copy(pts[i]!).addScaledVector(B, u * w).addScaledVector(N, side === 0 ? th * bulge : -th * 0.25 * bulge);
        pos.push(p.x, p.y, p.z);
        // Top face white (a touch cooler at the edges and tip); the underside the cool shade.
        tmpC.copy(side === 0 ? lit : shade);
        if (side === 0) tmpC.lerp(mid, Math.min(1, Math.max(Math.abs(u) - 0.45, 0) * 1.8 + Math.max(0, t - 0.7)));
        col.push(tmpC.r, tmpC.g, tmpC.b);
      }
  }
  const RING = 2 * K;
  const idx: number[] = [];
  for (let i = 0; i < rows - 1; i++)
    for (let k = 0; k < RING; k++) {
      const a = i * RING + k, b = i * RING + ((k + 1) % RING), c = (i + 1) * RING + k, d = (i + 1) * RING + ((k + 1) % RING);
      // The ring runs counter-clockwise seen down +T, so (a, b, c) faces out of the lock.
      idx.push(a, b, c, b, d, c);
    }
  // Root cap, facing back along −T (the tip closes itself: width → 0).
  for (let k = 1; k < RING - 1; k++) idx.push(0, k + 1, k);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g.toNonIndexed();
}

/** The hair (its own mesh: a lighter, cooler toon shade than the body, so from behind it reads white, not grey).
 *  Built for the chase camera: every lock lies back along the skull and ends pointing DOWN-and-back; only the
 *  nape locks pass the skull outline, and they fall below it. Nothing radiates out of the top or the sides. */
function hairGeo(): THREE.BufferGeometry {
  const P: THREE.BufferGeometry[] = [];
  // Cap: the shaded underlayer every lock lies on (cool white so gaps between locks read as hair in shadow).
  const cap = part(new THREE.SphereGeometry(HAIR_R, 32, 22), C.hair, [HC.x, HC.y, HC.z], undefined, [1.02, 1, 1.04]);
  {
    const pA = cap.attributes.position!, cA = cap.attributes.color!;
    const lit = new THREE.Color(C.hair), shade = new THREE.Color(C.hairShade);
    for (let i = 0; i < pA.count; i++) {
      tmpC.copy(shade).lerp(lit, Math.min(0.55, Math.max(0, (pA.getY(i) - HC.y + 0.05) / 0.3)));
      cA.setXYZ(i, tmpC.r, tmpC.g, tmpC.b);
    }
  }
  P.push(cap);
  // [az0, el0, az1, el1, halfWidth, thickness, lift, tail]
  const L: [number, number, number, number, number, number, number, number][] = [
    // Under layer: long locks from the front hairline over the crown to the nape (the back silhouette).
    [180, 58, 0, -38, 0.095, 0.035, 0.004, 0.14],
    [152, 56, 22, -40, 0.09, 0.034, 0.004, 0.08], [-152, 56, -22, -40, 0.09, 0.034, 0.004, 0.08],
    [138, 52, 40, -44, 0.08, 0.034, 0.006, 0.12], [-138, 52, -40, -44, 0.08, 0.034, 0.006, 0.12],
    [128, 50, 58, -42, 0.085, 0.032, 0.004, 0.06], [-128, 50, -58, -42, 0.085, 0.032, 0.004, 0.06],
    // Sides: over the ears, ending at the jaw pointing down-back (they never flare out past the cheek).
    [112, 40, 82, -40, 0.08, 0.03, 0.006, 0.07], [-112, 40, -82, -40, 0.08, 0.03, 0.006, 0.07],
    [140, 28, 112, -36, 0.06, 0.026, 0.008, 0.02], [-140, 28, -112, -36, 0.06, 0.026, 0.008, 0.02],
    // Top layer: shorter, thicker shingles from the crown that end mid-back (the layered read from behind).
    [170, 70, 12, 2, 0.08, 0.036, 0.016, 0], [-170, 70, -12, 2, 0.08, 0.036, 0.016, 0],
    [140, 64, 40, -8, 0.075, 0.034, 0.014, 0], [-140, 64, -40, -8, 0.075, 0.034, 0.014, 0],
    // Bangs: three flat locks over the forehead, ending above the eyes.
    [180, 62, 168, 18, 0.07, 0.028, 0.024, 0], [180, 62, 192, 18, 0.07, 0.028, 0.024, 0],
    [150, 56, 140, 12, 0.06, 0.026, 0.02, 0], [-150, 56, -140, 12, 0.06, 0.026, 0.02, 0],
  ];
  for (const [a0, e0, a1, e1, w, th, lift, tail] of L) P.push(hairLock(a0, e0, a1, e1, w, th, lift, tail));
  // Normalise attribute sets (the cap carries uv; locks don't).
  for (const g of P) for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
  const g = mergeGeometries(P.map((x) => (x.index ? x.toNonIndexed() : x)), false)!;
  for (const x of P) x.dispose();
  g.computeBoundingSphere();
  return g;
}

function headGeo(): THREE.BufferGeometry {
  const P: THREE.BufferGeometry[] = [];
  P.push(part(new THREE.SphereGeometry(0.27, 28, 20), C.skin));
  // Eyes 0.07 × 0.10 with a white highlight, a touch of blush.
  for (const s of [1, -1]) {
    P.push(part(new THREE.SphereGeometry(0.05, 12, 10), C.eye, [s * 0.095, -0.03, 0.238], undefined, [0.7, 1, 0.45]));
    P.push(part(new THREE.SphereGeometry(0.014, 8, 6), 0xffffff, [s * 0.082, -0.005, 0.258]));
    P.push(part(new THREE.SphereGeometry(0.03, 8, 6), 0xffb7a8, [s * 0.15, -0.1, 0.205], undefined, [1, 0.55, 0.4]));
  }
  return merge(P);
}

function torsoGeo(): THREE.BufferGeometry {
  const P: THREE.BufferGeometry[] = [];
  P.push(part(new THREE.CapsuleGeometry(0.13, 0.08, 6, 16), C.tunic, [0, 0.22, 0], undefined, [1, 1, 0.85]));
  P.push(part(new THREE.CylinderGeometry(0.125, 0.175, 0.14, 16), C.tunic, [0, 0.03, 0], undefined, [1, 1, 0.85]));
  P.push(part(new THREE.TorusGeometry(0.095, 0.035, 8, 18), C.white, [0, 0.38, 0], [0, 0, 1]));
  P.push(part(new THREE.CylinderGeometry(0.137, 0.137, 0.045, 16), C.belt, [0, 0.11, 0], undefined, [1, 1, 0.86]));
  P.push(part(new THREE.BoxGeometry(0.06, 0.045, 0.02), C.gold, [0, 0.11, 0.118]));
  for (const s of [1, -1]) P.push(part(new THREE.SphereGeometry(0.075, 12, 10), C.white, [s * 0.15, 0.33, -0.005], undefined, [1, 0.8, 1]));
  return merge(P);
}

function armGeo(): THREE.BufferGeometry {
  return merge([
    part(new THREE.CapsuleGeometry(0.06, 0.12, 4, 10), C.tunic, [0, -0.1, 0]),
    part(new THREE.TorusGeometry(0.058, 0.018, 6, 12), C.white, [0, -0.2, 0], [0, 0, 1]),
    part(new THREE.SphereGeometry(0.062, 12, 10), C.skin, [0, -0.255, 0]),
  ]);
}

function legGeo(): THREE.BufferGeometry {
  return merge([
    part(new THREE.CapsuleGeometry(0.068, 0.1, 4, 10), C.pants, [0, -0.1, 0]),
    part(new THREE.CylinderGeometry(0.082, 0.075, 0.08, 12), C.boots, [0, -0.215, 0]),
    part(new THREE.SphereGeometry(0.085, 14, 10), C.boots, [0, -0.29, 0.03], undefined, [1, 0.85, 1.4]),
  ]);
}

function hiltGeo(): THREE.BufferGeometry {
  return merge([
    part(new THREE.CylinderGeometry(0.022, 0.024, 0.15, 8), 0x2a2330, [0, 0.02, 0]),
    part(new THREE.SphereGeometry(0.032, 10, 8), C.gold, [0, -0.07, 0]),
    part(new THREE.BoxGeometry(0.21, 0.035, 0.05), C.gold, [0, 0.105, 0]),
    part(new THREE.SphereGeometry(0.022, 8, 6), 0x7fe3ff, [0, 0.105, 0.028]),
  ]);
}

/** Crystal blade: diamond cross-section, widening then tapering to a point (grip origin, +y). */
function bladeGeo(): THREE.BufferGeometry {
  const rings: [number, number, number][] = [[0.12, 0.03, 0.012], [0.2, 0.046, 0.015], [0.86, 0.05, 0.015], [1.04, 0, 0]]; // 0.9 m blade
  const pos: number[] = [];
  const ring = (y: number, w: number, t: number) => [[w, y, 0], [0, y, t], [-w, y, 0], [0, y, -t]];
  for (let r = 0; r < rings.length - 1; r++) {
    const a = ring(...rings[r]!), b = ring(...rings[r + 1]!);
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      pos.push(...a[k]!, ...a[k2]!, ...b[k]!, ...a[k2]!, ...b[k2]!, ...b[k]!);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Cape fabric texture: cape blue, a darker hem, and an ORIGINAL white upward-chevron sigil. */
function capeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, '#4673dc');
  grd.addColorStop(0.85, '#3a6ad5');
  grd.addColorStop(1, '#2d58bb');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#eef2fa';
  g.fillRect(0, 118, 128, 4); // hem trim
  // Sigil: a white diamond outline holding an upward chevron (canvas v runs top→bottom; uv flipY handles it).
  g.save();
  g.translate(64, 56);
  g.strokeStyle = '#f4f7ff';
  g.lineWidth = 5;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(0, -26); g.lineTo(22, 0); g.lineTo(0, 26); g.lineTo(-22, 0); g.closePath();
  g.stroke();
  g.fillStyle = '#f4f7ff';
  g.beginPath();
  g.moveTo(0, -13); g.lineTo(12, 6); g.lineTo(6, 6); g.lineTo(0, -3); g.lineTo(-6, 6); g.lineTo(-12, 6); g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(0, 3); g.lineTo(9, 15); g.lineTo(-9, 15); g.closePath();
  g.fill();
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const OUTLINE_VERT = /* glsl */ `
uniform float uWidth;
uniform vec2 uRes;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Pushed 4 cm away from the eye: inner creases (spike bases, limb joins) hide, true silhouettes stay.
  mv.xyz += normalize(mv.xyz) * 0.04;
  vec4 clip = projectionMatrix * mv;
  vec3 n = normalize(normalMatrix * normal);
  vec2 nd = (projectionMatrix * vec4(n, 0.0)).xy;
  float l = length(nd);
  nd = l > 1e-5 ? nd / l : vec2(0.0);
  clip.xy += nd * uWidth * 2.0 * clip.w / uRes;
  gl_Position = clip;
}`;
const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
void main() {
  gl_FragColor = vec4(uColor, uOpacity);
  #include <colorspace_fragment>
}`;

export function outlineMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: OUTLINE_VERT, fragmentShader: OUTLINE_FRAG, side: THREE.BackSide,
    uniforms: { uWidth: { value: 1.6 }, uRes: { value: new THREE.Vector2(1280, 720) }, uColor: { value: new THREE.Color(C.ink) }, uOpacity: { value: 1 } },
  });
}

export const CAPE_COLS = 6, CAPE_ROWS = 8;
/** Display scale (polish F-011: reads at the reference's ~150 px at 802×917). Sim radius is unchanged. */
export const HERO_SCALE = 1.3;

export interface HeroModel {
  root: THREE.Group;
  hop: THREE.Group;
  pivot: THREE.Group;
  squash: THREE.Group;
  hips: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  sword: THREE.Group;
  capeAnchor: THREE.Group;
  capeGeo: THREE.BufferGeometry;
  body: THREE.MeshLambertMaterial;
  /** The hair's own toon material: a pale cool shade so the unlit back of the head reads white (F-011). */
  hair: THREE.MeshLambertMaterial;
  capeOuter: THREE.MeshLambertMaterial;
  capeInner: THREE.MeshLambertMaterial;
  bladeMat: THREE.MeshBasicMaterial;
  outline: THREE.ShaderMaterial;
  halo: THREE.Sprite;
  meshes: THREE.Mesh[];
}

/** Shared geometry, built once (the afterimage ghost reuses it). */
let GEO: { head: THREE.BufferGeometry; hair: THREE.BufferGeometry; torso: THREE.BufferGeometry; arm: THREE.BufferGeometry; leg: THREE.BufferGeometry; hilt: THREE.BufferGeometry; blade: THREE.BufferGeometry } | null = null;
function geos() {
  return (GEO ??= { head: headGeo(), hair: hairGeo(), torso: torsoGeo(), arm: armGeo(), leg: legGeo(), hilt: hiltGeo(), blade: bladeGeo() });
}

export function capeGeometry(): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(0.55, 0.62, CAPE_COLS, CAPE_ROWS);
  (g.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
  (g.attributes.normal as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
  return g;
}

/** Build the rig. `ghost` = the perfect-dodge afterimage: same shapes, one additive cyan material, no outline. */
export function buildHero(ghost?: THREE.Material): HeroModel {
  const G = geos();
  const body = toonMaterial(0xffffff, { vertexColors: true, rim: true, shade: 0x8f9cc4 }) as THREE.MeshLambertMaterial;
  const hair = toonMaterial(0xffffff, { vertexColors: true, rim: true, shade: 0xc8d2ec }) as THREE.MeshLambertMaterial;
  const capeOuter = toonMaterial(0xffffff, { map: capeTexture(), rim: true, shade: 0x93a3c0 }) as THREE.MeshLambertMaterial;
  capeOuter.side = THREE.BackSide;
  const capeInner = toonMaterial(C.lining, { shade: 0xaab4cf }) as THREE.MeshLambertMaterial;
  capeInner.side = THREE.FrontSide;
  const bladeMat = emissiveMaterial(C.blade, 2.2);
  const outline = outlineMaterial();
  const meshes: THREE.Mesh[] = [];
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, ink = true) => {
    const me = new THREE.Mesh(g, ghost ?? m);
    me.castShadow = !ghost;
    parent.add(me);
    meshes.push(me);
    if (ink && !ghost) {
      const o = new THREE.Mesh(g, outline);
      o.renderOrder = -1;
      parent.add(o);
    }
    return me;
  };
  const root = new THREE.Group();
  root.name = ghost ? 'hero-ghost' : 'hero';
  root.scale.setScalar(HERO_SCALE);
  const hop = new THREE.Group();
  hop.position.y = PIVOT_Y;
  const pivot = new THREE.Group();
  pivot.rotation.order = 'YXZ';
  const squash = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = HIPS_Y - PIVOT_Y;
  root.add(hop);
  hop.add(pivot);
  pivot.add(squash);
  squash.add(hips);
  mesh(G.torso, body, hips);
  const head = new THREE.Group();
  head.position.set(0, 0.98 - HIPS_Y, 0);
  hips.add(head);
  mesh(G.head, body, head);
  mesh(G.hair, hair, head);
  const armL = new THREE.Group();
  armL.position.set(-SHOULDER_R.x, SHOULDER_R.y, SHOULDER_R.z);
  const armR = new THREE.Group();
  armR.position.set(SHOULDER_R.x, SHOULDER_R.y, SHOULDER_R.z);
  hips.add(armL, armR);
  mesh(G.arm, body, armL);
  mesh(G.arm, body, armR);
  const legL = new THREE.Group();
  legL.position.set(0.075, 0, 0);
  const legR = new THREE.Group();
  legR.position.set(-0.075, 0, 0);
  hips.add(legL, legR);
  mesh(G.leg, body, legL);
  mesh(G.leg, body, legR);
  const sword = new THREE.Group();
  hips.add(sword);
  mesh(G.hilt, body, sword);
  mesh(G.blade, bladeMat, sword, false);
  const halo = glowSprite(0x58b8ff, 0.9, 0.32); // bluer + fainter: additive cyan over grass read lime (F-013)
  halo.position.y = 0.6;
  halo.scale.set(0.7, 1.3, 1);
  if (!ghost) sword.add(halo);
  const capeAnchor = new THREE.Group();
  capeAnchor.position.set(0, 0.34, -0.1);
  hips.add(capeAnchor);
  const capeGeo = capeGeometry();
  const co = new THREE.Mesh(capeGeo, ghost ?? capeOuter);
  const ci = new THREE.Mesh(capeGeo, ghost ?? capeInner);
  co.castShadow = !ghost;
  co.frustumCulled = ci.frustumCulled = false;
  capeAnchor.add(co, ci);
  meshes.push(co, ci);
  return { root, hop, pivot, squash, hips, head, armL, armR, legL, legR, sword, capeAnchor, capeGeo, body, hair, capeOuter, capeInner, bladeMat, outline, halo, meshes };
}
