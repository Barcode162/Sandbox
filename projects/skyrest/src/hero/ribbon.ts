// src/hero/ribbon.ts — owned by WO-003. Gradient ribbon (normal-blended, premultiplied; polish F-013): the slash crescent, the Gale Crescent wave and the
// finisher's ground crescent. Two rows of vertices (inner/outer) per sample; colour runs trail-deep → trail → white at
// the outer edge, alpha by per-sample weight. Emissive ×2.2 so bloom (High) picks it up; untonemapped.
import * as THREE from 'three';

const VERT = /* glsl */ `
attribute float aAlpha;
varying vec2 vUv;
varying float vAlpha;
void main() {
  vUv = uv;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uEdge;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
void main() {
  float v = vUv.y; // 0 = inner edge, 1 = leading (outer) edge
  vec3 c = mix(uDeep, uMid, smoothstep(0.0, 0.55, v));
  c = mix(c, uEdge, smoothstep(0.6, 0.92, v));
  // Opaque-ish band, soft on both edges. NORMAL blending, premultiplied: over yellow-green grass it stays cyan
  // (additive turned it lime). Values > 1 at the core let bloom (High) catch it.
  float a = smoothstep(0.0, 0.3, v) * (1.0 - smoothstep(0.93, 1.0, v)) * 0.9;
  a = clamp(a * vAlpha * uOpacity, 0.0, 1.0);
  vec3 col = c * mix(1.0, uIntensity, smoothstep(0.6, 0.95, v));
  gl_FragColor = vec4(col * a, a);
  #include <colorspace_fragment>
}`;

export const TRAIL_COLORS = { deep: 0x2a9df4, mid: 0x7fe9ff, edge: 0xe8fdff } as const;

export class Ribbon {
  readonly mesh: THREE.Mesh;
  readonly n: number;
  private readonly pos: Float32Array;
  private readonly alpha: Float32Array;
  private readonly geo: THREE.BufferGeometry;
  readonly material: THREE.ShaderMaterial;

  constructor(samples: number, intensity = 1.35) {
    this.n = samples;
    const n = samples;
    this.pos = new Float32Array(n * 2 * 3);
    this.alpha = new Float32Array(n * 2);
    const uv = new Float32Array(n * 2 * 2);
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      uv[i * 4] = i / (n - 1); uv[i * 4 + 1] = 0;
      uv[i * 4 + 2] = i / (n - 1); uv[i * 4 + 3] = 1;
      if (i < n - 1) {
        const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
        idx.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(idx);
    this.geo = g;
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        uDeep: { value: new THREE.Color(TRAIL_COLORS.deep) },
        uMid: { value: new THREE.Color(TRAIL_COLORS.mid) },
        uEdge: { value: new THREE.Color(TRAIL_COLORS.edge) },
        uIntensity: { value: intensity },
        uOpacity: { value: 1 },
      },
      transparent: true, premultipliedAlpha: true, depthWrite: false, blending: THREE.NormalBlending, side: THREE.DoubleSide, toneMapped: false,
    });
    this.mesh = new THREE.Mesh(g, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    this.mesh.visible = false;
  }

  set(i: number, ix: number, iy: number, iz: number, ox: number, oy: number, oz: number, a: number): void {
    const p = this.pos, k = i * 6;
    p[k] = ix; p[k + 1] = iy; p[k + 2] = iz;
    p[k + 3] = ox; p[k + 4] = oy; p[k + 5] = oz;
    this.alpha[i * 2] = a;
    this.alpha[i * 2 + 1] = a;
  }

  commit(visible: boolean): void {
    this.mesh.visible = visible;
    if (!visible) return;
    this.geo.attributes.position!.needsUpdate = true;
    this.geo.attributes.aAlpha!.needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}
