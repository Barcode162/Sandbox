// src/render/materials.ts — owned by WO-002. THE one shared look ("SoftToon", experience.md §4.2): every slice
// builds meshes with these so hero, golem and world shade alike. FROZEN signatures: toonMaterial, emissiveMaterial,
// glowSprite, gradientMap. Low quality has no bloom: emissive sources add a glowSprite halo instead.
// Scaffold: MeshToonMaterial stand-in; WO-002 replaces it with the patched Lambert (shade tint + rim).
import * as THREE from 'three';

let ramp: THREE.DataTexture | null = null;

/** Shared 1D toon ramp (soft 4-step). */
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

/** The default surface for characters and props. */
export function toonMaterial(color: THREE.ColorRepresentation, opts: ToonOpts = {}): THREE.Material {
  return new THREE.MeshToonMaterial({
    color, gradientMap: gradientMap(),
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    vertexColors: opts.vertexColors ?? false,
  });
}

/** Additive halo sprite standing in for bloom on 'low' (64² radial canvas texture, shared). */
export function glowSprite(color: THREE.ColorRepresentation, size: number, opacity = 0.55): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}

/** Unlit glow (runes, eyes, emblem, sword arc); bloom picks it up on 'high'. */
export function emissiveMaterial(color: THREE.ColorRepresentation, intensity = 2): THREE.MeshBasicMaterial {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
}
