// src/golem/parts.ts — owned by WO-004. The Stone Guardian's 14 boulders (experience.md §4.5) as procedural
// geometry: displaced icospheres / rounded boxes with flattened rune faces, vertex colour (stone mottle, moss on
// top-facing surfaces, 22 % AO near the base), plus the original rune glyphs drawn on canvases.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE } from '../tuning/world.ts';

import { PARTS, type PartSpec, type RuneGlyph } from './parts-data.ts';
export { PARTS, type PartSpec, type RuneGlyph, type RuneGroup } from './parts-data.ts';

/** Deterministic smooth-ish 3D noise from a few seeded sines (cheap, build-time only). */
function noise3(x: number, y: number, z: number, seed: number): number {
  const s = seed * 1.618;
  return (
    Math.sin(x * 2.1 + s) * Math.sin(y * 2.7 + s * 1.3) * Math.sin(z * 2.3 + s * 0.7) * 0.5 +
    Math.sin(x * 4.3 - s * 0.9 + y * 1.7) * Math.sin(z * 3.9 + s * 1.1) * 0.3 +
    Math.sin((x + y + z) * 6.1 + s * 2.3) * 0.12
  );
}

const C = (hex: number) => new THREE.Color(hex);
// Warm grey: stone-mid dominant, lit and shade tones only as mottling (F-010).
const STONE_A = C(PALETTE.stoneMid).lerp(C(PALETTE.boulderLit), 0.5);
const STONE_B = C(PALETTE.stoneLit);
const STONE_C = C(PALETTE.stoneMid);
const MOSS = C(PALETTE.moss);
const MOSS_SHADE = C(PALETTE.mossShade);

/** One boulder: returns indexed geometry with normals + vertex colours; y range for AO is the part's own. */
export function partGeometry(p: PartSpec, detail = 2): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const [sx, sy, sz] = p.size;
  const fd = p.rune ? new THREE.Vector3(...p.rune.dir).normalize() : null;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    // Rounded box via a superellipsoid blend (head), else a lumpy sphere.
    if (p.boxy > 0) {
      const n = 2 + p.boxy * 6;
      const k = Math.pow(Math.abs(v.x) ** n + Math.abs(v.y) ** n + Math.abs(v.z) ** n, -1 / n);
      v.multiplyScalar(1 + (k - 1) * Math.min(1, p.boxy * 1.2));
    }
    const lump = 1 + 0.16 * noise3(v.x, v.y, v.z, p.seed) + 0.05 * noise3(v.x * 3, v.y * 3, v.z * 3, p.seed + 7);
    v.multiplyScalar(lump);
    v.set(v.x * sx, v.y * sy, v.z * sz);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  // Chipped faces: a few seeded planes shave flat facets off the lump, so it reads as split stone, not a ball.
  // The top facet is flattest (moss sits on it); the bottom is flattened where the part rests.
  const n = new THREE.Vector3();
  for (let k = 0; k < 5; k++) {
    if (k === 0) n.set(0, 1, 0);
    else if (k === 1) n.set(0, -1, 0);
    else n.set(noise3(k, 1, 2, p.seed) * 2, noise3(2, k, 1, p.seed + 1) * 1.2, noise3(1, 2, k, p.seed + 2) * 2).normalize();
    if (k > 1 && p.rune && n.dot(new THREE.Vector3(...p.rune.dir).normalize()) > 0.3) continue;
    const ext = Math.abs(n.x) * sx + Math.abs(n.y) * sy + Math.abs(n.z) * sz;
    const cut = ext * (k === 0 ? 0.8 : k === 1 ? 0.78 : 0.82);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const d = v.dot(n);
      if (d > cut) {
        v.addScaledVector(n, (cut - d) * 0.92);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
  }
  if (fd) g.userData.faceDist = flattenFace(pos, fd);
  // Chunky facets (F-010): each face's normal is 60 % its own flat normal + 40 % the smooth one, so chips read as
  // planes of split stone while the boulder still turns softly toward the light (pure flat went brown-black).
  g.computeVertexNormals();
  const flat = g.toNonIndexed();
  flat.userData = g.userData;
  const smooth = (flat.getAttribute('normal') as THREE.BufferAttribute).array.slice();
  flat.computeVertexNormals();
  const nrm = flat.getAttribute('normal') as THREE.BufferAttribute;
  const nv = new THREE.Vector3();
  for (let i = 0; i < nrm.count; i++) {
    nv.set(nrm.getX(i) * 0.6 + smooth[i * 3]! * 0.4, nrm.getY(i) * 0.6 + smooth[i * 3 + 1]! * 0.4, nrm.getZ(i) * 0.6 + smooth[i * 3 + 2]! * 0.4).normalize();
    nrm.setXYZ(i, nv.x, nv.y, nv.z);
  }
  paint(flat, p);
  return flat;
}

/** Carve a flat facet facing `dir` where the rune plane sits (so the glyph never clips into lumps). */
function flattenFace(pos: THREE.BufferAttribute, dir: THREE.Vector3): number {
  const v = new THREE.Vector3();
  let maxD = 0;
  for (let i = 0; i < pos.count; i++) maxD = Math.max(maxD, v.fromBufferAttribute(pos, i).dot(dir));
  const plane = maxD * 0.9;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.dot(dir);
    if (d > plane) {
      v.addScaledVector(dir, plane - d);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  return plane;
}

function paint(g: THREE.BufferGeometry, p: PartSpec): void {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const nor = g.getAttribute('normal') as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const h = p.size[1];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ny = nor.getY(i);
    const m = noise3(x * 2.2, y * 2.2, z * 2.2, p.seed + 3);
    c.copy(STONE_A).lerp(m > 0 ? STONE_B : STONE_C, Math.min(0.45, Math.abs(m) * 0.9));
    // Small dark pits.
    const pit = noise3(x * 7, y * 7, z * 7, p.seed + 9);
    if (pit > 0.42) c.multiplyScalar(0.82);
    // Moss on the top-facing surface, with a ragged edge.
    // Only on parts that carry moss (torso, shoulders), and only as a cap on the top ~0.12 m.
    const edge = 0.95 - p.moss * 0.75 + 0.22 * noise3(x * 3.1, y * 3.1, z * 3.1, p.seed + 5);
    if (p.moss > 0 && ny > edge && y > h - 0.12 - 0.3 * p.moss) c.copy(ny > edge + 0.12 ? MOSS : MOSS_SHADE).lerp(MOSS, Math.min(1, (ny - edge) * 4));
    // Vertex AO near the base (y_local < 0.25 h from the bottom → up to 22 % darker).
    const fromBottom = (y + h) / (2 * h);
    if (fromBottom < 0.25) c.multiplyScalar(1 - 0.22 * (1 - fromBottom / 0.25));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

/** Original glyph art: B = dark outline, R = glowing stroke, G = hot core line (the rune shader tints each). */
export function runeTexture(glyph: RuneGlyph): THREE.CanvasTexture {
  const n = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#000';
  x.fillRect(0, 0, n, n);
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const path = () => {
    x.beginPath();
    if (glyph === 'chevron') {
      // Chevron inside a diamond.
      x.moveTo(64, 14); x.lineTo(114, 64); x.lineTo(64, 114); x.lineTo(14, 64); x.closePath();
      x.moveTo(40, 74); x.lineTo(64, 50); x.lineTo(88, 74);
    } else if (glyph === 'ring') {
      // Broken ring + dot.
      x.arc(64, 64, 40, Math.PI * 0.15, Math.PI * 1.75);
      x.moveTo(70, 64); x.arc(64, 64, 6, 0, Math.PI * 2);
    } else if (glyph === 'bars') {
      for (const yy of [34, 64, 94]) { x.moveTo(26, yy); x.lineTo(102, yy); }
    } else if (glyph === 'crack') {
      x.moveTo(64, 8); x.lineTo(56, 40); x.lineTo(72, 58); x.lineTo(50, 88); x.lineTo(60, 120);
      x.moveTo(72, 58); x.lineTo(100, 70); x.moveTo(56, 40); x.lineTo(28, 30); x.moveTo(50, 88); x.lineTo(24, 100);
    } else {
      x.moveTo(20, 64); x.lineTo(108, 64);
    }
  };
  // Crisp, no blur (F-010): B = dark rune-edge outline, R = the glowing stroke, G = its hot core line.
  x.globalCompositeOperation = 'lighter';
  x.strokeStyle = '#00f';
  x.lineWidth = glyph === 'crack' ? 10 : 22;
  path();
  x.stroke();
  x.strokeStyle = '#f00';
  x.lineWidth = glyph === 'crack' ? 6 : 13;
  path();
  x.stroke();
  x.strokeStyle = '#0f0';
  x.lineWidth = glyph === 'crack' ? 2.5 : 4.5;
  path();
  x.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Rune surface: dark outline `uOutline`; stroke `uEdge` and core `uCore` × uIntensity (HDR for bloom). */
export function runeMaterial(tex: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: tex },
      uEdge: { value: new THREE.Color(PALETTE.rune) },
      uOutline: { value: new THREE.Color(PALETTE.runeEdge).multiplyScalar(0.55) },
      uCore: { value: new THREE.Color(PALETTE.runeCore) },
      uIntensity: { value: 2.4 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uEdge; uniform vec3 uCore; uniform vec3 uOutline; uniform float uIntensity; uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        float a = max(t.b, max(t.r, t.g));
        if (a < 0.02) discard;
        // The outline stays below the bloom threshold (a carved edge); only the stroke and its core glow.
        vec3 c = uOutline * t.b * (1.0 - t.r) + uEdge * uIntensity * t.r * (1.0 - t.g) + uCore * uIntensity * t.g;
        gl_FragColor = vec4(c, a * uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}
