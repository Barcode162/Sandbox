// src/render/materials.ts — owned by WO-002. THE one shared look ("SoftToon", experience.md §4.2): every slice
// builds meshes with these so hero, golem and world shade alike. FROZEN signatures: toonMaterial, emissiveMaterial,
// glowSprite, gradientMap. Low quality has no bloom: emissive sources add a glowSprite halo instead.
//
// SoftToon = MeshLambertMaterial patched in onBeforeCompile:
//   direct  = sun · mix(shadeTint, 1, smoothstep(0, 0.32, N·L × shadow)) · cloudShadow   (soft two-tone, never black)
//   rim     = rimColor · pow(1 − N·V, 3) · 0.35 · (0.4 + 0.6·N·L01)                       (characters, trees)
//   sway    = world-space wind bend ∝ local height² (grass, canopies), shared clock TOON_TIME
// shadeTint = shade / lit per channel, so a grass shadow reads grass-shade and a cliff shadow reads blue.
import * as THREE from 'three';
import { AMBIENT, HALO, LIGHT } from '../tuning/world.ts';

let ramp: THREE.DataTexture | null = null;

/** Shared 1D toon ramp (soft 4-step). Kept for MeshToonMaterial users; SoftToon itself is analytic. */
export function gradientMap(): THREE.Texture {
  if (ramp) return ramp;
  const d = new Uint8Array([90, 90, 90, 255, 160, 160, 160, 255, 220, 220, 220, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.LinearFilter;
  ramp.needsUpdate = true;
  return ramp;
}

export interface ToonOpts {
  /** The `*-shade` token: colour in full shadow (shadeTint = shade / lit). Default: lit × 0.55. */
  shade?: THREE.ColorRepresentation;
  /** Warm rim light (characters, trees). */
  rim?: boolean;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  /** Uses vertex colours (vertex AO on rocks/trunks/golem parts). */
  vertexColors?: boolean;
  /** Ambient sway (grass/trees): world-space wind displacement by vertex height. */
  sway?: number;
  map?: THREE.Texture;
}

/** Shared clocks and light state every SoftToon program reads (one object, so no per-material sync). */
export const TOON_SHARED = {
  /** Ambient seconds (stops while paused). The world view writes it every frame. */
  time: { value: 0 },
  /** 0..1 strength of the moving cloud shadows on the sun term. */
  cloudShadow: { value: 1 },
};

/** World-only extensions of SoftToon (not part of the frozen surface). */
export interface ToonExtra {
  /** Wind gust band darkens tips and bends harder (grass). */
  gust?: boolean;
  /** Per-vertex tree pivot (attribute `aPivot` = canopy centre xyz + tree index) for breathing/sway + dither. */
  canopy?: boolean;
  /** Uniform array of per-tree opacity for the occlusion screen-door dither (length = canopy count). */
  canopyFade?: { value: number[] };
  /** With `canopy`: dither only, no breathing/sway (trunks). The fade is squared, so at the canopy's 35 % the trunk
   *  keeps ≈ 12 %: a dark limb must never sit over the hero or a button (F-022). */
  canopyStill?: boolean;
  /** Skip the cloud-shadow multiply (far scenery that lies outside the noise field). */
  noCloudShadow?: boolean;
  side?: THREE.Side;
  transparent?: boolean;
  /** Multiplies the fog factor (the temple keeps its white through the haze: 0.4). */
  fogScale?: number;
}

const VERT_PARS = /* glsl */ `
uniform float uToonTime;
varying vec3 vToonWorld;
#ifdef TOON_SWAY
uniform float uSway;
#endif
#ifdef TOON_GUST
varying float vGust;
#endif
#ifdef TOON_CANOPY
attribute vec4 aPivot;
varying float vTree;
#endif
`;

// Wind: bend = (base + gust·band)·h²·sin(1.7t + 0.35x + 0.27z); the gust band travels +x.
const VERT_BEGIN = /* glsl */ `
vec3 transformed = vec3( position );
{
  mat4 toonM = modelMatrix;
  #ifdef USE_INSTANCING
  toonM = modelMatrix * instanceMatrix;
  #endif
  #ifdef TOON_CANOPY
  vTree = aPivot.w;
  #endif
  #if defined(TOON_CANOPY) && !defined(TOON_CANOPY_STILL)
  float ph = aPivot.w * 1.7;
  float breath = 1.0 + ${AMBIENT.canopyBreath.toFixed(4)} * sin(6.2831853 * ${AMBIENT.canopyBreathHz.toFixed(3)} * uToonTime + ph);
  vec3 rel = (position - aPivot.xyz) * breath;
  float sw = radians(${AMBIENT.canopySwayDeg.toFixed(2)}) * sin(6.2831853 * ${AMBIENT.canopySwayHz.toFixed(3)} * uToonTime + ph);
  float hh = max(aPivot.y, 0.5);
  transformed = aPivot.xyz + rel;
  transformed.x += sw * (transformed.y - (aPivot.y - hh));
  #endif
  #ifdef TOON_SWAY
  vec3 org = (toonM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float h = max(position.y, 0.0);
  float band = 0.0;
  #ifdef TOON_GUST
  band = smoothstep(0.6, 1.0, sin((org.x - ${AMBIENT.gustSpeed.toFixed(2)} * uToonTime) * ${(2 * Math.PI / (AMBIENT.gustSpeed * AMBIENT.gustPeriod)).toFixed(4)} + org.z * 0.04) * 0.5 + 0.5);
  vGust = band * h;
  #endif
  float bend = ((${AMBIENT.grassBend.toFixed(3)} + ${AMBIENT.grassGust.toFixed(3)} * band) * sin(1.7 * uToonTime + 0.35 * org.x + 0.27 * org.z)
    + 0.07 * band) * h * h * uSway;
  vec3 wOff = vec3(bend, -abs(bend) * 0.3, bend * 0.3);
  mat3 m3 = mat3(toonM);
  float s2 = max(dot(m3[0], m3[0]), 1e-6);
  transformed += transpose(m3) * wOff / s2;
  #endif
}
`;

const VERT_WORLD = /* glsl */ `
#include <project_vertex>
{
  vec4 tw = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
  tw = instanceMatrix * tw;
  #endif
  vToonWorld = ( modelMatrix * tw ).xyz;
}
`;

const FRAG_PARS = /* glsl */ `
uniform vec3 uShadeTint;
uniform vec3 uRimColor;
uniform float uToonTime;
uniform float uCloudShadow;
varying vec3 vToonWorld;
#ifdef TOON_GUST
varying float vGust;
#endif
#ifdef TOON_CANOPY
varying float vTree;
uniform float uCanopyFade[ TOON_CANOPY_N ];
#endif
float toonHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float toonNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(toonHash(i), toonHash(i + vec2(1, 0)), u.x), mix(toonHash(i + vec2(0, 1)), toonHash(i + vec2(1, 1)), u.x), u.y);
}
float toonCloudShadow() {
  #ifdef TOON_NO_CLOUD
  return 1.0;
  #else
  vec2 p = (vToonWorld.xz - vec2(${LIGHT.cloudShadowSpeed.toFixed(2)} * uToonTime, 0.0)) * ${LIGHT.cloudShadowScale.toFixed(3)};
  float n = toonNoise(p) * 0.65 + toonNoise(p * 2.1 + 7.3) * 0.35;
  return mix(1.0, mix(${LIGHT.cloudShadowMin.toFixed(2)}, 1.0, smoothstep(0.3, 0.7, n)), uCloudShadow);
  #endif
}
varying vec3 vViewPosition;
struct LambertMaterial { vec3 diffuseColor; float specularStrength; };
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal,
  const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
  float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
  vec3 base = directLight.color;
  float shadowK = 1.0;
  #if NUM_DIR_LIGHTS > 0
  base = directionalLights[ 0 ].color;
  shadowK = dot( directLight.color, vec3( 1.0 ) ) / max( dot( base, vec3( 1.0 ) ), 1e-4 );
  #endif
  vec3 toon = mix( uShadeTint, vec3( 1.0 ), smoothstep( 0.0, 0.32, dotNL * shadowK ) );
  reflectedLight.directDiffuse += toon * base * toonCloudShadow() * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal,
  const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
  reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct RE_Direct_Toon
#define RE_IndirectDiffuse RE_IndirectDiffuse_Toon
`;

// Screen-door dither (depth stays) for canopies between camera and hero (§4.3 occlusion, §12 item 15).
const FRAG_DITHER = /* glsl */ `
#ifdef TOON_CANOPY
{
  float fadeA = 1.0;
  for (int i = 0; i < TOON_CANOPY_N; i++) if (abs(float(i) - vTree) < 0.5) fadeA = uCanopyFade[i];
  #ifdef TOON_CANOPY_STILL
  fadeA *= fadeA;
  #endif
  if (fadeA < 0.999) {
    const float B[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
    ivec2 c = ivec2(mod(floor(gl_FragCoord.xy), 4.0));
    float bayer = (B[c.y * 4 + c.x] + 0.5) / 16.0;
    if (bayer > fadeA) discard;
  }
}
#endif
`;

// Fog with an optional per-material scale (TOON_FOG_SCALE).
const FRAG_FOG = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
  float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
  float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  #ifdef TOON_FOG_SCALE
  fogFactor *= TOON_FOG_SCALE;
  #endif
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif
`;

// The gust band darkens grass tips (§6) so wind visibly crosses the meadow.
const FRAG_GUST = /* glsl */ `
#include <color_fragment>
#ifdef TOON_GUST
diffuseColor.rgb *= 1.0 - ${AMBIENT.gustDarken.toFixed(3)} * 1.6 * vGust;
#endif
`;

const FRAG_RIM = /* glsl */ `
#include <lights_fragment_end>
#ifdef TOON_RIM
{
  float ndl01 = 0.5;
  #if NUM_DIR_LIGHTS > 0
  ndl01 = dot( normal, directionalLights[ 0 ].direction ) * 0.5 + 0.5;
  #endif
  float nv = saturate( dot( normal, normalize( vViewPosition ) ) );
  totalEmissiveRadiance += uRimColor * pow( 1.0 - nv, 3.0 ) * ${LIGHT.rimStrength.toFixed(3)} * ( 0.4 + 0.6 * ndl01 );
}
#endif
`;

const tmpLit = new THREE.Color();
const tmpShade = new THREE.Color();

/** Builds a SoftToon material. `extra` carries the world-only variants (gust, canopy dither, no cloud shadow). */
export function softToon(color: THREE.ColorRepresentation, opts: ToonOpts = {}, extra: ToonExtra = {}): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({
    color,
    map: opts.map ?? null,
    vertexColors: opts.vertexColors ?? false,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    side: extra.side ?? THREE.FrontSide,
    transparent: extra.transparent ?? false,
  });
  tmpLit.set(color);
  if (opts.shade !== undefined) tmpShade.set(opts.shade);
  else tmpShade.copy(tmpLit).multiplyScalar(0.55);
  const tint = new THREE.Vector3(
    Math.min(1, tmpShade.r / Math.max(tmpLit.r, 1e-3)),
    Math.min(1, tmpShade.g / Math.max(tmpLit.g, 1e-3)),
    Math.min(1, tmpShade.b / Math.max(tmpLit.b, 1e-3)),
  );
  const defines: string[] = [];
  if (opts.rim) defines.push('TOON_RIM');
  if (opts.sway) defines.push('TOON_SWAY');
  if (extra.gust) defines.push('TOON_GUST');
  if (extra.noCloudShadow) defines.push('TOON_NO_CLOUD');
  if (extra.fogScale !== undefined) defines.push(`TOON_FOG_SCALE ${extra.fogScale.toFixed(3)}`);
  const canopyN = extra.canopy && extra.canopyFade ? extra.canopyFade.value.length : 0;
  if (canopyN) defines.push('TOON_CANOPY');
  if (canopyN && extra.canopyStill) defines.push('TOON_CANOPY_STILL');
  const header = defines.map((d) => `#define ${d}\n`).join('') + (canopyN ? `#define TOON_CANOPY_N ${canopyN}\n` : '');
  const sway = { value: opts.sway ?? 0 };
  const rimColor = new THREE.Color(LIGHT.rimColor);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uShadeTint = { value: tint };
    shader.uniforms.uRimColor = { value: rimColor };
    shader.uniforms.uToonTime = TOON_SHARED.time;
    shader.uniforms.uCloudShadow = TOON_SHARED.cloudShadow;
    shader.uniforms.uSway = sway;
    if (canopyN) shader.uniforms.uCanopyFade = extra.canopyFade!;
    shader.vertexShader = header + VERT_PARS + shader.vertexShader
      .replace('#include <begin_vertex>', VERT_BEGIN)
      .replace('#include <project_vertex>', VERT_WORLD);
    shader.fragmentShader = header + shader.fragmentShader
      .replace('#include <lights_lambert_pars_fragment>', FRAG_PARS)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + FRAG_DITHER)
      .replace('#include <color_fragment>', FRAG_GUST)
      .replace('#include <lights_fragment_end>', FRAG_RIM)
      .replace('#include <fog_fragment>', FRAG_FOG);
  };
  mat.customProgramCacheKey = () => 'softtoon:' + header;
  mat.userData.shadeTint = tint;
  return mat;
}

/** The default surface for characters and props. */
export function toonMaterial(color: THREE.ColorRepresentation, opts: ToonOpts = {}): THREE.Material {
  return softToon(color, opts);
}

// ── Halos (Low tier's bloom) ──────────────────────────────────────────────────────────────────────────
let haloTex: THREE.CanvasTexture | null = null;
const haloMaterials = new Set<THREE.SpriteMaterial>();
let halosOn = true;

function haloTexture(): THREE.Texture {
  if (haloTex) return haloTex;
  const n = HALO.texSize;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.14)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, n, n);
  haloTex = new THREE.CanvasTexture(c);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  return haloTex;
}

/** Additive halo sprite standing in for bloom on 'low' (64² radial canvas texture, shared).
 *  Its material is only drawn on Low (the renderer toggles every halo when the tier changes); owners may still
 *  pulse `opacity`/`scale` and hide the sprite itself. */
export function glowSprite(color: THREE.ColorRepresentation, size: number, opacity: number = HALO.opacity): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    color, map: haloTexture(), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  mat.visible = halosOn;
  haloMaterials.add(mat);
  mat.addEventListener('dispose', () => haloMaterials.delete(mat));
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(size);
  s.renderOrder = 5;
  return s;
}

/** Renderer-only: halos are drawn on Low (no bloom) and hidden on High (real bloom). */
export function setHalosEnabled(on: boolean): void {
  halosOn = on;
  for (const m of haloMaterials) m.visible = on;
}

/** Unlit glow (runes, eyes, emblem, sword arc); bloom picks it up on 'high'. */
export function emissiveMaterial(color: THREE.ColorRepresentation, intensity = 2): THREE.MeshBasicMaterial {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
}
