// src/hero/model.ts — owned by WO-003. Builds "Aster" (experience.md §4.5): chibi 1 : 1.3 head:body, 1.25 m,
// swept flat hair locks + bangs, crystal sword, spring cape (shown at ×1.3, see HERO_SCALE). Every bone is ONE merged, vertex-coloured mesh on the
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
/** Repaint hair vertices: hair-shade on the underside, hair on top (head-local height). */
function hairShade(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = g.attributes.position!, col = g.attributes.color!;
  const lit = new THREE.Color(C.hair), shade = new THREE.Color(C.hairShade);
  for (let i = 0; i < pos.count; i++) {
    const k = Math.min(1, Math.max(0, (pos.getY(i) + 0.02) / 0.3));
    tmpC.copy(shade).lerp(lit, k);
    col.setXYZ(i, tmpC.r, tmpC.g, tmpC.b);
  }
  return g;
}
/** Cone whose BASE sits at the origin and that points +y. */
function spike(r: number, h: number): THREE.BufferGeometry {
  return new THREE.ConeGeometry(r, h, 9, 2).translate(0, h / 2, 0);
}

function headGeo(): THREE.BufferGeometry {
  const P: THREE.BufferGeometry[] = [];
  P.push(part(new THREE.SphereGeometry(0.27, 28, 20), C.skin));
  const hc: [number, number, number] = [0, 0.04, -0.045];
  P.push(hairShade(part(new THREE.SphereGeometry(0.28, 28, 20), C.hair, hc, undefined, [1.04, 1, 1.05])));
  // Swept anime hair (polish F-011): flat locks rooted toward the front/top of the skull, lying back along it and
  // flaring past the back silhouette, so from the chase camera you see layered shingles with pointed tips, never a
  // ball of radial spikes. Two tufts over the ears and a crown cowlick read at three-quarter angles.
  // [root dir xyz, lock axis xyz, length, root radius]
  const locks: [number, number, number, number, number, number, number, number][] = [
    [0, 1, 0.3, 0, 0.8, -0.6, 0.55, 0.15],
    [0.35, 0.9, 0.2, 0.42, 0.7, -0.6, 0.5, 0.14], [-0.35, 0.9, 0.2, -0.42, 0.7, -0.6, 0.5, 0.14],
    [0.62, 0.6, 0, 0.65, 0.45, -0.62, 0.42, 0.125], [-0.62, 0.6, 0, -0.65, 0.45, -0.62, 0.42, 0.125],
    [0, 0.6, -0.6, 0, 0.45, -0.9, 0.4, 0.125],
    [0.4, 0.2, -0.8, 0.55, 0.2, -0.8, 0.32, 0.105], [-0.4, 0.2, -0.8, -0.55, 0.2, -0.8, 0.32, 0.105],
    [0.85, 0.2, 0.1, 0.85, 0.4, -0.35, 0.2, 0.08], [-0.85, 0.2, 0.1, -0.85, 0.4, -0.35, 0.2, 0.08],
    [0.1, 1, -0.2, 0.2, 0.95, -0.25, 0.26, 0.075],
  ];
  for (const [x, y, z, ax, ay, az, h, r] of locks) {
    const d = v3.set(x, y, z).normalize();
    const bx = hc[0] + d.x * 0.2, by = hc[1] + d.y * 0.2, bz = hc[2] + d.z * 0.2;
    P.push(hairShade(part(spike(r, h), C.hair, [bx, by, bz], [ax, ay, az], [1, 1, 0.4])));
  }
  // Bangs over the forehead.
  for (const [x, h] of [[0, 0.15], [0.11, 0.13], [-0.11, 0.13]] as const) {
    P.push(part(spike(0.065, h), C.hair, [x, 0.2, 0.17], [x * 1.6, -0.75, 0.62]));
  }
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
  capeOuter: THREE.MeshLambertMaterial;
  capeInner: THREE.MeshLambertMaterial;
  bladeMat: THREE.MeshBasicMaterial;
  outline: THREE.ShaderMaterial;
  halo: THREE.Sprite;
  meshes: THREE.Mesh[];
}

/** Shared geometry, built once (the afterimage ghost reuses it). */
let GEO: { head: THREE.BufferGeometry; torso: THREE.BufferGeometry; arm: THREE.BufferGeometry; leg: THREE.BufferGeometry; hilt: THREE.BufferGeometry; blade: THREE.BufferGeometry } | null = null;
function geos() {
  return (GEO ??= { head: headGeo(), torso: torsoGeo(), arm: armGeo(), leg: legGeo(), hilt: hiltGeo(), blade: bladeGeo() });
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
  return { root, hop, pivot, squash, hips, head, armL, armR, legL, legR, sword, capeAnchor, capeGeo, body, capeOuter, capeInner, bladeMat, outline, halo, meshes };
}
