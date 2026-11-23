// src/view/layers.ts — the GPU layers: nodes (one SDF point sprite per node, glyph by kind),
// sprites (ghosts, beads, comet, bursts, rings), thick lines (instanced screen-space quads) and dust.
// All layers are additive on true black with no depth test: a night sky, order-independent.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LineSegments,
  Mesh,
  Points,
  ShaderMaterial,
  Vector2,
} from 'three';

const additive = { transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending } as const;

/** Grows a Float32Array attribute buffer in powers of two. */
function grow(arr: Float32Array<ArrayBuffer>, need: number): Float32Array<ArrayBuffer> {
  if (arr.length >= need) return arr;
  let n = Math.max(64, arr.length);
  while (n < need) n *= 2;
  return new Float32Array(n);
}

// ── Nodes ─────────────────────────────────────────────────────────────────────────────
export const KIND_CODE = { concept: 0, variable: 1, file: 2, pathway: 3, note: 4, road: 5 } as const;
export const OP_CODE = { start: 0, read: 1, assign: 2, if: 3, while: 4, end: 5 } as const;

const NODE_VS = /* glsl */ `
attribute float aSize;   // world radius r
attribute vec3 aCore;
attribute vec3 aHalo;
attribute vec4 aMisc;    // x brightness, y scale, z halo scale, w selection ring
attribute vec2 aKind;    // x kind code, y op code
uniform float uPxScale;  // (viewport h / 2) / tan(vfov / 2), CSS px
uniform float uDpr;
varying vec3 vCore;
varying vec3 vHalo;
varying float vR;
varying float vSprite;
varying vec4 vMisc;
varying vec2 vKind;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depth = max(0.1, -mv.z);
  float kindV = floor(aKind.x + 0.5);
  float minR = kindV == 3.0 ? 4.5 : 3.0;
  float r = clamp(aSize * uPxScale / depth, minR, 18.0) * aMisc.y;
  float haloK = kindV == 2.0 ? 0.6 : 1.0;
  // The halo is visually spent by ~2.7r; a tighter sprite saves fill rate at 500 points.
  float ext = max(r * 2.7 * aMisc.z * haloK, aMisc.w > 0.0 ? max(r * 2.4, r + 7.0) + 2.0 : 0.0);
  vSprite = max(ext, r * 2.4) + 2.0;
  vR = r;
  vCore = aCore;
  vHalo = aHalo;
  vMisc = aMisc;
  vKind = aKind;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = vSprite * 2.0 * uDpr;
  if (aMisc.x <= 0.001) gl_PointSize = 0.0;
}`;

const NODE_FS = /* glsl */ `
uniform float uDpr;
varying vec3 vCore;
varying vec3 vHalo;
varying float vR;
varying float vSprite;
varying vec4 vMisc;
varying vec2 vKind;
float fill(float sd) { return 1.0 - smoothstep(-0.6, 0.6, sd); }
float stroke(float sd, float w) { return 1.0 - smoothstep(w * 0.5 - 0.6, w * 0.5 + 0.6, abs(sd)); }
float sdTri(vec2 p, float s) {
  // equilateral triangle pointing +x, circumradius s
  p = vec2(-p.y, p.x);
  const float k = 1.7320508;
  p.x = abs(p.x) - s * 0.866;
  p.y = p.y + s * 0.5;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * s * 0.866, 0.0);
  return -length(p) * sign(p.y);
}
void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0 * vSprite;
  p.y = -p.y;
  float d = length(p);
  float R = vR;
  // Codes arrive as varyings: round before comparing (interpolation error broke glyphs, F-021).
  float kind = floor(vKind.x + 0.5);
  float core = 0.0;
  float glyph = 0.0;
  float haloK = 1.0;
  vec3 coreCol = vCore;
  if (kind == 1.0) {
    // variable: diamond core 0.9r + 1 px ring at 1.8r
    core = fill((abs(p.x) + abs(p.y)) * 0.7071 - 0.9 * R * 0.7071 * 1.25);
    core = max(core, stroke(d - 1.8 * R, 1.0) * 0.8);
  } else if (kind == 2.0) {
    // file: 1.5 px square outline (side 2r) with a dog-ear notch, centre dot
    float box = max(abs(p.x), abs(p.y)) - R;
    float notch = (p.x + p.y) - 1.25 * R;
    float outline = stroke(box, 1.5) * step(notch, 0.0);
    float ear = stroke(notch * 0.7071, 1.5) * step(box, 0.6);
    core = max(max(outline, ear), fill(d - 1.3));
    haloK = 0.6;
  } else if (kind == 3.0) {
    // pathway: glyph inside a ring
    float ringR = R * 1.5;
    core = stroke(d - ringR, 1.4);
    float op = floor(vKind.y + 0.5);
    float g = R * 0.95;
    if (op == 0.0) glyph = fill(sdTri(p + vec2(g * 0.12, 0.0), g * 0.72));
    else if (op == 1.0) glyph = max(stroke(d - g * 0.62, 1.3), fill(d - g * 0.24));
    else if (op == 2.0) glyph = fill(max(abs(abs(p.y) - g * 0.3) - 0.9, abs(p.x) - g * 0.62));
    else if (op == 3.0) glyph = stroke((abs(p.x) + abs(p.y)) * 0.7071 - g * 0.62, 1.4);
    else if (op == 4.0) {
      float a = atan(p.y, p.x);
      float arc = stroke(d - g * 0.62, 1.4) * step(0.52, abs(a - 1.5708) < 3.1416 ? abs(a - 1.5708) : 6.2832 - abs(a - 1.5708));
      vec2 tip = vec2(cos(2.1), sin(2.1)) * g * 0.62;
      glyph = max(arc, fill(sdTri((p - tip) * mat2(cos(0.53), -sin(0.53), sin(0.53), cos(0.53)), g * 0.3)));
    } else glyph = max(stroke(d - g * 0.66, 1.3), fill(d - g * 0.32));
    core = max(core, glyph);
    haloK = 0.7;
  } else {
    // Small stars stay crisp; close-up cores get a hot 0.4r centre with a soft falloff (F-027).
    core = fill(d - R);
    if (R > 6.0) {
      float t = max(0.0, d - 0.4 * R) / (0.35 * R);
      float soft = max(fill(d - 0.4 * R), exp(-t * t)) * step(d, R + 1.0);
      core = mix(core, soft, smoothstep(6.0, 12.0, R));
    }
  }
  // Gaussian-shaped falloff without exp/pow: (1 - x²)³ over the halo extent.
  float hx = clamp(d / (R * 2.7 * vMisc.z * haloK), 0.0, 1.0);
  float hq = 1.0 - hx * hx;
  float halo = hq * hq * hq * (kind == 3.0 ? 0.14 : 0.59); // +40% so the lens tint reads (F-019)
  float ring = vMisc.w > 0.0 ? stroke(d - max(R * 2.4, R + 7.0), 1.5) * vMisc.w : 0.0;
  float b = vMisc.x;
  vec3 col = coreCol * core * b + vHalo * halo * min(b, 1.4) + vec3(0.96, 0.97, 1.0) * ring;
  float a = clamp(max(max(core, halo), ring), 0.0, 1.0);
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, 1.0);
}`;

export class NodeLayer {
  readonly points: Points;
  private geo = new BufferGeometry();
  private pos = new Float32Array(0);
  private size = new Float32Array(0);
  private core = new Float32Array(0);
  private halo = new Float32Array(0);
  private misc = new Float32Array(0);
  private kind = new Float32Array(0);
  readonly material: ShaderMaterial;
  count = 0;

  constructor() {
    this.material = new ShaderMaterial({
      vertexShader: NODE_VS,
      fragmentShader: NODE_FS,
      uniforms: { uPxScale: { value: 500 }, uDpr: { value: 1 } },
      ...additive,
    });
    this.points = new Points(this.geo, this.material);
    this.points.frustumCulled = false;
    this.ensure(64);
  }

  private ensure(n: number): void {
    if (this.pos.length >= n * 3) return;
    this.pos = grow(this.pos, n * 3);
    const cap = this.pos.length / 3;
    this.size = new Float32Array(cap);
    this.core = new Float32Array(cap * 3);
    this.halo = new Float32Array(cap * 3);
    this.misc = new Float32Array(cap * 4);
    this.kind = new Float32Array(cap * 2);
    const set = (name: string, arr: Float32Array, k: number) => {
      const a = new BufferAttribute(arr, k);
      a.setUsage(DynamicDrawUsage);
      this.geo.setAttribute(name, a);
    };
    set('position', this.pos, 3);
    set('aSize', this.size, 1);
    set('aCore', this.core, 3);
    set('aHalo', this.halo, 3);
    set('aMisc', this.misc, 4);
    set('aKind', this.kind, 2);
  }

  begin(n: number): void {
    this.ensure(n);
    this.count = 0;
  }

  push(x: number, y: number, z: number, r: number, core: readonly number[], halo: readonly number[], bright: number, scale: number, haloScale: number, ring: number, kind: number, op: number): void {
    const i = this.count++;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.size[i] = r;
    this.core.set(core, i * 3);
    this.halo.set(halo, i * 3);
    this.misc[i * 4] = bright;
    this.misc[i * 4 + 1] = scale;
    this.misc[i * 4 + 2] = haloScale;
    this.misc[i * 4 + 3] = ring;
    this.kind[i * 2] = kind;
    this.kind[i * 2 + 1] = op;
  }

  end(): void {
    for (const name of ['position', 'aSize', 'aCore', 'aHalo', 'aMisc', 'aKind']) {
      const a = this.geo.getAttribute(name) as BufferAttribute;
      a.needsUpdate = true;
    }
    this.geo.setDrawRange(0, this.count);
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}

// ── Sprites (screen-px sized) ─────────────────────────────────────────────────────────
export const SPRITE = { glow: 0, ring: 1, bead: 2, spark: 3 } as const;

const SPRITE_VS = /* glsl */ `
attribute vec4 aCol;   // rgb, alpha
attribute vec2 aShape; // x radius px, y shape code
uniform float uDpr;
varying vec4 vCol;
varying float vR;
varying float vShape;
varying float vSprite;
void main() {
  vCol = aCol;
  vR = aShape.x;
  vShape = floor(aShape.y + 0.5);
  vSprite = vShape == 0.0 || vShape == 3.0 ? vR * 3.0 + 2.0 : vR + 2.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aCol.a <= 0.001 ? 0.0 : vSprite * 2.0 * uDpr;
}`;

const SPRITE_FS = /* glsl */ `
varying vec4 vCol;
varying float vR;
varying float vShape;
varying float vSprite;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0 * vSprite;
  float d = length(p);
  float a = 0.0;
  if (vShape == 1.0) a = 1.0 - smoothstep(0.15, 1.1, abs(d - vR + 1.0));
  else if (vShape == 2.0) a = 1.0 - smoothstep(vR - 0.8, vR + 0.6, d);
  else {
    float core = 1.0 - smoothstep(vR - 0.7, vR + 0.7, d);
    float halo = exp(-pow(d / (vR * (vShape == 3.0 ? 1.8 : 1.3)), 2.0)) * 0.55;
    a = max(core, halo);
  }
  a *= vCol.a;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vCol.rgb * a, 1.0);
}`;

export class SpriteLayer {
  readonly points: Points;
  private geo = new BufferGeometry();
  private pos = new Float32Array(0);
  private col = new Float32Array(0);
  private shape = new Float32Array(0);
  readonly material: ShaderMaterial;
  count = 0;

  constructor() {
    this.material = new ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS, uniforms: { uDpr: { value: 1 } }, ...additive });
    this.points = new Points(this.geo, this.material);
    this.points.frustumCulled = false;
    this.ensure(64);
  }

  private ensure(n: number): void {
    if (this.pos.length >= n * 3) return;
    // Growing mid-batch keeps what was already pushed this frame (F-011).
    const [p0, c0, s0] = [this.pos, this.col, this.shape];
    this.pos = grow(this.pos, n * 3);
    const cap = this.pos.length / 3;
    this.col = new Float32Array(cap * 4);
    this.shape = new Float32Array(cap * 2);
    this.pos.set(p0);
    this.col.set(c0);
    this.shape.set(s0);
    for (const [name, arr, k] of [['position', this.pos, 3], ['aCol', this.col, 4], ['aShape', this.shape, 2]] as const) {
      const a = new BufferAttribute(arr, k);
      a.setUsage(DynamicDrawUsage);
      this.geo.setAttribute(name, a);
    }
  }

  begin(): void {
    this.count = 0;
  }

  push(x: number, y: number, z: number, radiusPx: number, rgb: readonly number[], alpha: number, shape: number): void {
    if (alpha <= 0.002) return;
    this.ensure(this.count + 1);
    const i = this.count++;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.col[i * 4] = rgb[0] ?? 1;
    this.col[i * 4 + 1] = rgb[1] ?? 1;
    this.col[i * 4 + 2] = rgb[2] ?? 1;
    this.col[i * 4 + 3] = alpha;
    this.shape[i * 2] = radiusPx;
    this.shape[i * 2 + 1] = shape;
  }

  end(): void {
    for (const name of ['position', 'aCol', 'aShape']) (this.geo.getAttribute(name) as BufferAttribute).needsUpdate = true;
    this.geo.setDrawRange(0, this.count);
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}

// ── Thick lines ───────────────────────────────────────────────────────────────────────
export const DASH = { solid: 0, dashed: 1, dotted: 2, fine: 3, dots: 4 } as const;
export const SHEEN = { none: 0, isa: 1, road: 2 } as const;

const LINE_VS = /* glsl */ `
// position.x: t (0|1), position.y: side (-1|1) — named 'position' so three.js draws it.
attribute vec3 iA;
attribute vec3 iB;
attribute vec4 iColA;   // rgb + alpha
attribute vec3 iColM;   // midpoint colour (lens-only lines)
attribute vec4 iStyle;  // x width px, y dash code, z draw from, w draw to
attribute vec3 iSheen;  // x kind, y phase (world u along the road), z world length
uniform vec2 uViewport;
varying float vT;
varying float vSide;
varying float vHalfW;
varying float vLenPx;
varying vec4 vColA;
varying vec3 vColM;
varying vec4 vStyle;
varying vec3 vSheen;
void main() {
  vec4 a = projectionMatrix * modelViewMatrix * vec4(iA, 1.0);
  vec4 b = projectionMatrix * modelViewMatrix * vec4(iB, 1.0);
  vec2 corner = position.xy;
  vT = corner.x;
  vColA = iColA;
  vColM = iColM;
  vStyle = iStyle;
  vSheen = iSheen;
  if (a.w <= 0.05 || b.w <= 0.05 || iColA.a <= 0.001) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec2 sa = a.xy / a.w * uViewport * 0.5;
  vec2 sb = b.xy / b.w * uViewport * 0.5;
  vec2 dv = sb - sa;
  float len = length(dv);
  vec2 dir = len > 0.0001 ? dv / len : vec2(1.0, 0.0);
  vec2 n = vec2(-dir.y, dir.x);
  vLenPx = len;
  vHalfW = iStyle.x * 0.5;
  float hw = max(vHalfW, 0.5) + 0.6; // tight AA margin: long faint lines are the fill cost
  vSide = corner.y * hw;
  vec4 p = mix(a, b, corner.x);
  p.xy += n * corner.y * hw * 2.0 / uViewport * p.w;
  gl_Position = p;
}`;

const LINE_FS = /* glsl */ `
uniform float uTime;
uniform float uSheen;
uniform float uRoad;
varying float vT;
varying float vSide;
varying float vHalfW;
varying float vLenPx;
varying vec4 vColA;
varying vec3 vColM;
varying vec4 vStyle;
varying vec3 vSheen;
void main() {
  if (vT < vStyle.z || vT > vStyle.w) discard;
  float w = max(vHalfW, 0.5);
  float aa = 1.0 - smoothstep(w - 0.6, w + 0.6, abs(vSide));
  aa *= min(1.0, vHalfW * 2.0);
  float s = vT * vLenPx;
  float dash = floor(vStyle.y + 0.5);
  float sheenKind = floor(vSheen.x + 0.5);
  if (dash == 1.0) aa *= step(mod(s, 10.0), 6.0);
  else if (dash == 2.0) aa *= 1.0 - smoothstep(0.6, 1.4, abs(mod(s, 4.0) - 1.0));
  else if (dash == 3.0) aa *= step(mod(s, 6.0), 3.0);
  else if (dash == 4.0) aa *= step(mod(s, 5.0), 2.2);
  float m = 1.0 - abs(vT * 2.0 - 1.0);
  vec3 col = mix(vColA.rgb, vColM, smoothstep(0.0, 1.0, m));
  float sheen = 0.0;
  if (uSheen > 0.5 && sheenKind == 1.0) {
    float head = mod(uTime / 4000.0, 1.0) * (vSheen.z + 6.0) - 3.0;
    sheen = 1.0 - smoothstep(0.0, 3.0, abs(vT * vSheen.z - head));
  } else if (uSheen > 0.5 && sheenKind == 2.0) {
    float head = mod(uTime * 0.03, uRoad);
    sheen = 1.0 - smoothstep(0.0, 3.0, abs(vSheen.y + vT * vSheen.z - head));
  }
  float alpha = vColA.a * aa * (1.0 + sheen * 3.0);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col * alpha, 1.0);
}`;

export interface LineSpec {
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  rgb: readonly number[];
  mid?: readonly number[];
  alpha: number;
  width: number;
  dash: number;
  from?: number;
  to?: number;
  sheen?: number;
  phase?: number;
  len?: number;
}

export class LineLayer {
  readonly mesh: Mesh;
  private geo = new InstancedBufferGeometry();
  private iA = new Float32Array(0);
  private iB = new Float32Array(0);
  private iColA = new Float32Array(0);
  private iColM = new Float32Array(0);
  private iStyle = new Float32Array(0);
  private iSheen = new Float32Array(0);
  readonly material: ShaderMaterial;
  count = 0;

  constructor() {
    this.geo.setAttribute('position', new BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
    this.material = new ShaderMaterial({
      vertexShader: LINE_VS,
      fragmentShader: LINE_FS,
      uniforms: { uViewport: { value: new Vector2(1, 1) }, uTime: { value: 0 }, uSheen: { value: 1 }, uRoad: { value: 400 } },
      ...additive,
    });
    this.mesh = new Mesh(this.geo, this.material);
    this.mesh.frustumCulled = false;
    this.ensure(64);
  }

  private ensure(n: number): void {
    if (this.iA.length >= n * 3) return;
    // Growing mid-batch keeps what was already pushed this frame (F-011).
    const old = [this.iA, this.iB, this.iColA, this.iColM, this.iStyle, this.iSheen] as const;
    this.iA = grow(this.iA, n * 3);
    const cap = this.iA.length / 3;
    this.iB = new Float32Array(cap * 3);
    this.iColA = new Float32Array(cap * 4);
    this.iColM = new Float32Array(cap * 3);
    this.iStyle = new Float32Array(cap * 4);
    this.iSheen = new Float32Array(cap * 3);
    [this.iA, this.iB, this.iColA, this.iColM, this.iStyle, this.iSheen].forEach((a, i) => a.set(old[i]!));
    for (const [name, arr, k] of [['iA', this.iA, 3], ['iB', this.iB, 3], ['iColA', this.iColA, 4], ['iColM', this.iColM, 3], ['iStyle', this.iStyle, 4], ['iSheen', this.iSheen, 3]] as const) {
      const a = new InstancedBufferAttribute(arr, k);
      a.setUsage(DynamicDrawUsage);
      this.geo.setAttribute(name, a);
    }
    // three.js caches the instance limit at first bind; clear it so grown buffers draw in full.
    (this.geo as unknown as { _maxInstanceCount?: number })._maxInstanceCount = undefined;
  }

  begin(): void {
    this.count = 0;
  }

  push(l: LineSpec): void {
    if (l.alpha <= 0.002) return;
    this.ensure(this.count + 1);
    const i = this.count++;
    this.iA[i * 3] = l.ax; this.iA[i * 3 + 1] = l.ay; this.iA[i * 3 + 2] = l.az;
    this.iB[i * 3] = l.bx; this.iB[i * 3 + 1] = l.by; this.iB[i * 3 + 2] = l.bz;
    this.iColA[i * 4] = l.rgb[0] ?? 1; this.iColA[i * 4 + 1] = l.rgb[1] ?? 1; this.iColA[i * 4 + 2] = l.rgb[2] ?? 1; this.iColA[i * 4 + 3] = l.alpha;
    const m = l.mid ?? l.rgb;
    this.iColM[i * 3] = m[0] ?? 1; this.iColM[i * 3 + 1] = m[1] ?? 1; this.iColM[i * 3 + 2] = m[2] ?? 1;
    this.iStyle[i * 4] = l.width; this.iStyle[i * 4 + 1] = l.dash; this.iStyle[i * 4 + 2] = l.from ?? 0; this.iStyle[i * 4 + 3] = l.to ?? 1;
    this.iSheen[i * 3] = l.sheen ?? 0; this.iSheen[i * 3 + 1] = l.phase ?? -1; this.iSheen[i * 3 + 2] = l.len ?? 1;
  }

  end(): void {
    for (const name of ['iA', 'iB', 'iColA', 'iColM', 'iStyle', 'iSheen']) (this.geo.getAttribute(name) as InstancedBufferAttribute).needsUpdate = true;
    this.geo.instanceCount = this.count;
    this.mesh.visible = this.count > 0;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}

// ── Dust: 1,200 faint points on a 900 u sphere, parallax only ─────────────────────────
const DUST_VS = /* glsl */ `
attribute vec2 aDust; // x size px, y alpha
uniform float uDpr;
uniform float uFade;
varying float vA;
void main() {
  vA = aDust.y * uFade;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (aDust.x + 1.0) * uDpr;
}`;
const DUST_FS = /* glsl */ `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.3, 1.0, d)) * vA;
  gl_FragColor = vec4(vec3(0.91, 0.93, 0.96) * a, 1.0);
}`;

export function createDust(seed = 7): Points {
  const n = 1200;
  const pos = new Float32Array(n * 3);
  const attr = new Float32Array(n * 2);
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const rr = Math.sqrt(1 - u * u);
    const R = 900 * (0.85 + 0.15 * rnd());
    pos[i * 3] = Math.cos(th) * rr * R;
    pos[i * 3 + 1] = u * R;
    pos[i * 3 + 2] = Math.sin(th) * rr * R;
    attr[i * 2] = 0.6 + 0.4 * rnd();
    attr[i * 2 + 1] = 0.05 + 0.1 * rnd();
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aDust', new BufferAttribute(attr, 2));
  const mat = new ShaderMaterial({ vertexShader: DUST_VS, fragmentShader: DUST_FS, uniforms: { uDpr: { value: 1 }, uFade: { value: 1 } }, ...additive });
  const p = new Points(geo, mat);
  p.frustumCulled = false;
  return p;
}

// ── Lite lines: native 1 px GL_LINES for dense scenes (LOD) ──────────────────────────
const LITE_VS = /* glsl */ `
attribute vec3 aCol; // premultiplied rgb
varying vec3 vCol;
void main() {
  vCol = aCol;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const LITE_FS = /* glsl */ `
varying vec3 vCol;
void main() { gl_FragColor = vec4(vCol, 1.0); }`;

export class LiteLineLayer {
  readonly lines: LineSegments;
  private geo = new BufferGeometry();
  private pos = new Float32Array(0) as Float32Array<ArrayBuffer>;
  private col = new Float32Array(0) as Float32Array<ArrayBuffer>;
  count = 0;

  constructor() {
    const mat = new ShaderMaterial({ vertexShader: LITE_VS, fragmentShader: LITE_FS, ...additive });
    this.lines = new LineSegments(this.geo, mat);
    this.lines.frustumCulled = false;
    this.ensure(64);
  }

  private ensure(n: number): void {
    if (this.pos.length >= n * 6) return;
    const keepP = this.pos;
    const keepC = this.col;
    this.pos = grow(this.pos, n * 6);
    this.col = new Float32Array(this.pos.length);
    this.pos.set(keepP);
    this.col.set(keepC);
    for (const [name, arr] of [['position', this.pos], ['aCol', this.col]] as const) {
      const a = new BufferAttribute(arr, 3);
      a.setUsage(DynamicDrawUsage);
      this.geo.setAttribute(name, a);
    }
  }

  begin(): void {
    this.count = 0;
  }

  push(l: LineSpec): void {
    this.ensure(this.count + 1);
    const i = this.count++ * 6;
    this.pos[i] = l.ax; this.pos[i + 1] = l.ay; this.pos[i + 2] = l.az;
    this.pos[i + 3] = l.bx; this.pos[i + 4] = l.by; this.pos[i + 5] = l.bz;
    const a = Math.min(1, l.alpha);
    for (let k = 0; k < 2; k++) {
      this.col[i + k * 3] = (l.rgb[0] ?? 1) * a;
      this.col[i + k * 3 + 1] = (l.rgb[1] ?? 1) * a;
      this.col[i + k * 3 + 2] = (l.rgb[2] ?? 1) * a;
    }
  }

  end(): void {
    for (const name of ['position', 'aCol']) (this.geo.getAttribute(name) as BufferAttribute).needsUpdate = true;
    this.geo.setDrawRange(0, this.count * 2);
    this.lines.visible = this.count > 0;
  }

  dispose(): void {
    this.geo.dispose();
    (this.lines.material as ShaderMaterial).dispose();
  }
}
