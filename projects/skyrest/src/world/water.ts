// src/world/water.ts — owned by WO-002. Waterfalls (§4.4, §6): curved 12-segment ribbons off the isle lips into
// the cloud sea, two streak layers scrolling 1.4/s and 0.9/s, lip foam, edge thinning, and pulsing mist puffs
// where they meet the clouds, so their bottoms are never seen (§12 item 18). One ribbon mesh + one mist mesh.
import * as THREE from 'three';
import { AMBIENT, PALETTE, SCENERY } from '../tuning/world.ts';
import { merge } from './geo.ts';
import { fallTexture, puffTexture } from './textures.ts';

const lin = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace);

export interface WaterView {
  group: THREE.Group;
  update(t: number, camera: THREE.Camera): void;
}

export function buildWater(): WaterView {
  const group = new THREE.Group();
  const SEG = 12;
  const ribbons: THREE.BufferGeometry[] = [];
  const mistSpots: THREE.Vector3[] = [];
  const seaY = SCENERY.cloudSea.y;
  for (const f of SCENERY.falls) {
    const out = new THREE.Vector2(f.dirX, f.dirZ).normalize();
    const side = new THREE.Vector3(-out.y, 0, out.x);
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    // Parabolic arc: leaves the lip at 1.6 m/s outward, accelerates down, ends 3 m under the cloud line.
    const bottom = seaY - 3;
    const drop = f.y - bottom;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG;
      const yy = f.y - drop * u * u * 0.85 - drop * u * 0.15;
      const reach = 0.25 + Math.sqrt(u) * 2.2;
      const cx = f.x + out.x * reach, cz = f.z + out.y * reach;
      const w = f.width * (1 + u * 0.35);
      for (const sd of [-0.5, 0.5]) {
        pos.push(cx + side.x * w * sd, yy, cz + side.z * w * sd);
        uv.push(sd + 0.5, u);
      }
      if (i < SEG) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    // Store the fall's length (m) in the vertex colour's red so streaks keep a constant world scale.
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array((SEG + 1) * 2 * 3).fill(drop / 10), 3));
    ribbons.push(g);
    const mx = f.x + out.x * 2.4, mz = f.z + out.y * 2.4;
    mistSpots.push(new THREE.Vector3(mx, seaY + 2.2, mz), new THREE.Vector3(mx + side.x * f.width * 0.6, seaY + 1.2, mz + side.z * f.width * 0.6),
      new THREE.Vector3(mx - side.x * f.width * 0.6, seaY + 1.4, mz - side.z * f.width * 0.6));
  }
  const tex = fallTexture();
  const fallMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true, vertexColors: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uMap: { value: null }, uTime: { value: 0 }, uFoam: { value: lin(PALETTE.mist) } }]),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vUv;
      varying float vLen;
      void main() {
        vUv = uv;
        vLen = color.r * 10.0;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform sampler2D uMap;
      uniform float uTime;
      uniform vec3 uFoam;
      varying vec2 vUv;
      varying float vLen;
      void main() {
        float v = vUv.y * vLen / 6.0;
        vec3 a = texture2D(uMap, vec2(vUv.x, v - uTime * ${AMBIENT.fallScroll1.toFixed(2)})).rgb;
        vec3 b = texture2D(uMap, vec2(vUv.x * 1.7 + 0.3, v * 0.7 - uTime * ${AMBIENT.fallScroll2.toFixed(2)})).rgb;
        vec3 c = mix(a, b, 0.45);
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float foam = smoothstep(0.08, 0.0, vUv.y);
        c = mix(c, uFoam * 1.05, foam);
        float alpha = edge * mix(0.94, 1.0, foam) * (1.0 - smoothstep(0.78, 1.0, vUv.y));
        gl_FragColor = vec4(c, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  fallMat.uniforms.uMap!.value = tex;
  const falls = new THREE.Mesh(mergeIndexed(ribbons), fallMat);
  falls.renderOrder = 2;
  group.add(falls);

  // Mist: camera-facing soft puffs at the cloud line (instanced quads), pulsing at 0.5 Hz.
  const mistMat = new THREE.MeshBasicMaterial({ map: puffTexture(), color: lin(PALETTE.mist), transparent: true, depthWrite: false, opacity: 0.85 });
  const mist = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mistMat, mistSpots.length);
  mist.frustumCulled = false;
  mist.renderOrder = 3;
  group.add(mist);
  const m = new THREE.Matrix4(), s = new THREE.Vector3();
  return {
    group,
    update(t, camera) {
      fallMat.uniforms.uTime!.value = t;
      for (let i = 0; i < mistSpots.length; i++) {
        const k = 1 + 0.12 * Math.sin(t * Math.PI * 2 * AMBIENT.mistHz + i * 1.7);
        const size = (i % 3 === 0 ? 9 : 6.5) * k;
        m.compose(mistSpots[i]!, camera.quaternion, s.set(size, size * 0.7, 1));
        mist.setMatrixAt(i, m);
      }
      mist.instanceMatrix.needsUpdate = true;
      mistMat.opacity = 0.78 + 0.12 * Math.sin(t * Math.PI * 2 * AMBIENT.mistHz);
    },
  };
}

/** Merges indexed geometries keeping position/uv/color (the ribbons are small; indices are offset). */
function mergeIndexed(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = merge(list.map((x) => x.toNonIndexed()));
  g.deleteAttribute('normal');
  return g;
}
