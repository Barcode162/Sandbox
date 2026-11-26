// src/fx/particles.ts — owned by WO-003. Pooled, ANALYTIC particles: each one is (birth time, origin, velocity,
// gravity, drag, life), so its position at sim time t is exact however many steps passed between renders
// (manual stepping, slow-mo); pause freezes them because the sim clock stops. Billboards stretch along velocity.
import * as THREE from 'three';

const VERT = /* glsl */ `
attribute vec3 iPos;
attribute vec3 iVel;
attribute vec4 iCol;
attribute float iSize;
uniform float uStretch;
varying vec4 vCol;
varying vec2 vUv;
void main() {
  vCol = iCol;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
  vec3 vv = (modelViewMatrix * vec4(iVel, 0.0)).xyz;
  float sp = length(vv.xy);
  vec2 dir = sp > 1e-4 ? vv.xy / sp : vec2(1.0, 0.0);
  float len = iSize + uStretch * sp;
  vec2 c = position.xy;
  mv.xy += dir * c.x * len + vec2(-dir.y, dir.x) * c.y * iSize;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
uniform float uGlow;
varying vec4 vCol;
varying vec2 vUv;
void main() {
  vec2 d = vUv * 2.0 - 1.0;
  float r = length(d);
  if (r > 1.0) discard;
  float a;
  vec3 c = vCol.rgb;
  if (uGlow > 0.5) {
    float core = 1.0 - smoothstep(0.0, 0.55, r);
    a = (1.0 - smoothstep(0.25, 1.0, r)) * vCol.a;
    c = mix(c, vec3(1.0), core * core) * 1.4;
  } else {
    a = (1.0 - smoothstep(0.35, 1.0, r)) * vCol.a;
    c *= 0.92 + 0.08 * (1.0 - r);
  }
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;

export interface Emit {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  /** m/s² down (negative = rises). */
  gravity: number;
  /** 1/s exponential drag on the launch velocity. */
  drag: number;
  life: number;
  size0: number;
  size1: number;
  r: number; g: number; b: number; a: number;
  /** Ground height to clamp at (−Infinity = none). */
  floor: number;
}

/** One instanced billboard pool. */
export class ParticlePool {
  readonly mesh: THREE.Mesh;
  private readonly cap: number;
  private limit: number;
  private next = 0;
  // Per-particle state (struct of arrays, no allocation).
  private readonly t0: Float64Array;
  private readonly life: Float32Array;
  private readonly st: Float32Array; // x y z vx vy vz g drag s0 s1 r g b a floor (15)
  private readonly iPos: Float32Array;
  private readonly iVel: Float32Array;
  private readonly iCol: Float32Array;
  private readonly iSize: Float32Array;
  private readonly geo: THREE.InstancedBufferGeometry;

  constructor(cap: number, glow: boolean, stretch: number) {
    this.cap = this.limit = cap;
    this.t0 = new Float64Array(cap).fill(-1e9);
    this.life = new Float32Array(cap);
    this.st = new Float32Array(cap * 15);
    this.iPos = new Float32Array(cap * 3);
    this.iVel = new Float32Array(cap * 3);
    this.iCol = new Float32Array(cap * 4);
    this.iSize = new Float32Array(cap);
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.attributes.position!);
    g.setAttribute('uv', base.attributes.uv!);
    const ia = (arr: Float32Array, n: number) => new THREE.InstancedBufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', ia(this.iPos, 3));
    g.setAttribute('iVel', ia(this.iVel, 3));
    g.setAttribute('iCol', ia(this.iCol, 4));
    g.setAttribute('iSize', ia(this.iSize, 1));
    g.instanceCount = 0;
    this.geo = g;
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uStretch: { value: stretch }, uGlow: { value: glow ? 1 : 0 } },
      transparent: true, depthWrite: false, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false,
    });
    this.mesh = new THREE.Mesh(g, m);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = glow ? 7 : 4;
  }

  /** Quality: cap the live count (Low = half). */
  setLimit(n: number): void {
    this.limit = Math.max(1, Math.min(this.cap, n));
  }

  emit(t: number, e: Emit): void {
    const i = this.next;
    this.next = (this.next + 1) % this.limit;
    this.t0[i] = t;
    this.life[i] = e.life;
    const s = this.st, k = i * 15;
    s[k] = e.x; s[k + 1] = e.y; s[k + 2] = e.z; s[k + 3] = e.vx; s[k + 4] = e.vy; s[k + 5] = e.vz;
    s[k + 6] = e.gravity; s[k + 7] = e.drag; s[k + 8] = e.size0; s[k + 9] = e.size1;
    s[k + 10] = e.r; s[k + 11] = e.g; s[k + 12] = e.b; s[k + 13] = e.a; s[k + 14] = e.floor;
  }

  clear(): void {
    this.t0.fill(-1e9);
    this.geo.instanceCount = 0;
  }

  /** Evaluate every live particle at sim time `now` (seconds). Returns the live count. */
  update(now: number): number {
    let n = 0;
    const s = this.st;
    for (let i = 0; i < this.limit; i++) {
      const age = now - this.t0[i]!;
      const life = this.life[i]!;
      if (age < 0 || age >= life) continue;
      const k = i * 15;
      const drag = s[k + 7]!, g = s[k + 6]!;
      const ed = drag > 0 ? Math.exp(-drag * age) : 1;
      const f = drag > 0 ? (1 - ed) / drag : age;
      let x = s[k]! + s[k + 3]! * f;
      let y = s[k + 1]! + s[k + 4]! * f - 0.5 * g * age * age;
      let z = s[k + 2]! + s[k + 5]! * f;
      let vx = s[k + 3]! * ed, vy = s[k + 4]! * ed - g * age, vz = s[k + 5]! * ed;
      const floor = s[k + 14]!;
      if (y < floor) {
        y = floor;
        vx *= 0.2; vy = 0; vz *= 0.2;
        x = x; z = z;
      }
      const u = age / life;
      const o3 = n * 3;
      this.iPos[o3] = x; this.iPos[o3 + 1] = y; this.iPos[o3 + 2] = z;
      this.iVel[o3] = vx; this.iVel[o3 + 1] = vy; this.iVel[o3 + 2] = vz;
      const o4 = n * 4;
      this.iCol[o4] = s[k + 10]!; this.iCol[o4 + 1] = s[k + 11]!; this.iCol[o4 + 2] = s[k + 12]!;
      // Fade in fast, out over the last 45 %.
      this.iCol[o4 + 3] = s[k + 13]! * Math.min(1, u * 12) * (u > 0.55 ? 1 - (u - 0.55) / 0.45 : 1);
      this.iSize[n] = s[k + 8]! + (s[k + 9]! - s[k + 8]!) * (1 - (1 - u) * (1 - u));
      n++;
    }
    this.geo.instanceCount = n;
    if (n > 0) {
      for (const name of ['iPos', 'iVel', 'iCol', 'iSize']) {
        const a = this.geo.attributes[name] as THREE.InstancedBufferAttribute;
        a.clearUpdateRanges();
        a.addUpdateRange(0, n * a.itemSize);
        a.needsUpdate = true;
      }
    }
    this.mesh.visible = n > 0;
    return n;
  }

  dispose(): void {
    this.geo.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Tumbling stone chips: an InstancedMesh with analytic ballistic paths and a ground stop. */
export class ChipPool {
  readonly mesh: THREE.InstancedMesh;
  private readonly cap: number;
  private limit: number;
  private next = 0;
  private readonly t0: Float64Array;
  private readonly st: Float32Array; // x y z vx vy vz spin life size floor axisx axisy axisz (13)
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly p = new THREE.Vector3();
  private readonly sc = new THREE.Vector3();
  private readonly ax = new THREE.Vector3();

  constructor(cap: number, material: THREE.Material) {
    this.cap = this.limit = cap;
    this.t0 = new Float64Array(cap).fill(-1e9);
    this.st = new Float32Array(cap * 13);
    const g = new THREE.DodecahedronGeometry(1, 0);
    this.mesh = new THREE.InstancedMesh(g, material, cap);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.count = 0;
  }

  setLimit(n: number): void {
    this.limit = Math.max(1, Math.min(this.cap, n));
  }

  emit(t: number, x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, life: number, floor: number, rnd: () => number): void {
    const i = this.next;
    this.next = (this.next + 1) % this.limit;
    this.t0[i] = t;
    const s = this.st, k = i * 13;
    s[k] = x; s[k + 1] = y; s[k + 2] = z; s[k + 3] = vx; s[k + 4] = vy; s[k + 5] = vz;
    s[k + 6] = 8 + rnd() * 14; s[k + 7] = life; s[k + 8] = size; s[k + 9] = floor;
    s[k + 10] = rnd() - 0.5; s[k + 11] = rnd() - 0.5; s[k + 12] = rnd() - 0.5;
  }

  clear(): void {
    this.t0.fill(-1e9);
    this.mesh.count = 0;
  }

  update(now: number): number {
    let n = 0;
    const s = this.st;
    for (let i = 0; i < this.limit; i++) {
      const age = now - this.t0[i]!;
      const k = i * 13;
      const life = s[k + 7]!;
      if (age < 0 || age >= life) continue;
      let y = s[k + 1]! + s[k + 4]! * age - 7 * age * age;
      let ta = age;
      const floor = s[k + 9]!;
      if (y < floor) {
        // Time of ground contact: stop there (a settled chip slides no further).
        const a = -7, b = s[k + 4]!, c = s[k + 1]! - floor;
        const disc = b * b - 4 * a * c;
        ta = disc > 0 ? (-b - Math.sqrt(disc)) / (2 * a) : age;
        y = floor;
      }
      this.p.set(s[k]! + s[k + 3]! * ta, y, s[k + 2]! + s[k + 5]! * ta);
      this.ax.set(s[k + 10]!, s[k + 11]!, s[k + 12]!).normalize();
      this.q.setFromAxisAngle(this.ax, s[k + 6]! * ta);
      const u = age / life;
      const sz = s[k + 8]! * (u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1);
      this.sc.set(sz, sz * 0.8, sz);
      this.m.compose(this.p, this.q, this.sc);
      this.mesh.setMatrixAt(n, this.m);
      n++;
    }
    this.mesh.count = n;
    if (n > 0) this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.visible = n > 0;
    return n;
  }
}
