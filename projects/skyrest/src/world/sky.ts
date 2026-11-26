// src/world/sky.ts — owned by WO-002. Sky dome (zenith → mid → horizon → luminous haze below), sun glow, the
// cloud sea (two scrolling octaves, edge fading to cloud-deep), 70 drifting puff clusters, 8 painted cumulus on
// the horizon and 3 bird flocks circling the temple isle (§4.2, §4.4, §6).
import * as THREE from 'three';
import { makeRng } from '../core/rng.ts';
import { AMBIENT, LIGHT, PALETTE, QUALITY, SCENERY } from '../tuning/world.ts';
import { softToon } from '../render/materials.ts';
import { lumpy, merge, paint, place, rgbOf } from './geo.ts';
import { cloudSeaTexture, cumulusTexture } from './textures.ts';

const lin = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace);

export interface SkyView {
  group: THREE.Group;
  update(t: number, camera: THREE.Camera): void;
  setQuality(low: boolean): void;
}

export function buildSky(): SkyView {
  const group = new THREE.Group();
  const sunDir = new THREE.Vector3(LIGHT.sunDir.x, LIGHT.sunDir.y, LIGHT.sunDir.z).normalize();

  // ── Dome: gradient by elevation of the view ray, plus a soft sun glow. Never fogged; follows the camera.
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uZenith: { value: lin(PALETTE.skyZenith) }, uMid: { value: lin(PALETTE.skyMid) },
        uHorizon: { value: lin(PALETTE.skyHorizon) }, uDeep: { value: lin(PALETTE.cloudDeep) },
        uSun: { value: sunDir }, uSunCol: { value: lin(LIGHT.sunColor) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uZenith, uMid, uHorizon, uDeep, uSun, uSunCol;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float el = asin(clamp(d.y, -1.0, 1.0));
          float e25 = radians(25.0);
          vec3 c;
          // Horizon haze is a thin band; the saturated blue starts low so a pitched-down camera still sees it.
          if (el > radians(9.0)) c = mix(uMid, uZenith, smoothstep(radians(9.0), radians(45.0), el));
          else if (el > 0.0) c = mix(uHorizon, uMid, smoothstep(0.0, radians(9.0), el));
          else c = mix(uHorizon, uDeep, smoothstep(0.0, radians(30.0), -el) * 0.6);
          float s = max(dot(d, uSun), 0.0);
          c += uSunCol * (pow(s, 600.0) * 1.2 + pow(s, 12.0) * 0.12);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  group.add(dome);

  // ── Cloud sea: opaque disc at y −24, two octaves scrolling, edge fades into cloud-deep haze.
  const cs = SCENERY.cloudSea;
  const seaTex = cloudSeaTexture();
  const seaMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uMap: { value: null }, uTime: { value: 0 }, uDeep: { value: lin(PALETTE.cloudDeep) }, uLit: { value: lin(PALETTE.cloudLit) },
    }]),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vXZ;
      void main() {
        vXZ = position.xz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform sampler2D uMap;
      uniform float uTime;
      uniform vec3 uDeep, uLit;
      varying vec2 vXZ;
      void main() {
        vec2 uv = vXZ / 90.0;
        vec3 a = texture2D(uMap, uv + vec2(uTime * ${cs.scroll.toFixed(4)}, 0.0)).rgb;
        vec3 b = texture2D(uMap, uv * 2.3 + vec2(uTime * ${(cs.scroll * 1.7).toFixed(4)}, uTime * 0.0013)).rgb;
        vec3 c = a * 0.62 + b * 0.38;
        c = mix(c, uLit, smoothstep(0.75, 0.95, c.r) * 0.5);
        float r = length(vXZ) / ${cs.radius.toFixed(1)};
        c = mix(c, uDeep, smoothstep(0.45, 1.0, r));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  seaMat.uniforms.uMap!.value = seaTex;
  const sea = new THREE.Mesh(new THREE.CircleGeometry(cs.radius, 48), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = cs.y;
  group.add(sea);

  // ── Puff clusters: flattened lumpy icospheres (SoftToon, cloud-shade shadows), drifting +x and wrapping.
  const lobes: THREE.BufferGeometry[] = [];
  const lr = makeRng(606);
  for (let k = 0; k < 5; k++) {
    const g = lumpy(new THREE.IcosahedronGeometry(1, 2), 0.1, 1.2, 600 + k);
    const r = k === 0 ? 1 : 0.55 + lr() * 0.35;
    place(g, k === 0 ? 0 : (lr() - 0.5) * 2.2, k === 0 ? 0 : 0.1 + lr() * 0.3, k === 0 ? 0 : (lr() - 0.5) * 1.4, 0, 0, 0, r, r * 0.6, r);
    lobes.push(paint(g, (_x, y) => {
      const k2 = Math.min(1, Math.max(0, (y + 0.3) / 0.9));
      const c = rgbOf(PALETTE.cloudShade), w = rgbOf(PALETTE.cloudLit);
      return [c[0] + (w[0] - c[0]) * k2, c[1] + (w[1] - c[1]) * k2, c[2] + (w[2] - c[2]) * k2].map((v, i) => v / w[i]!) as [number, number, number];
    }));
  }
  const puffMat = softToon(PALETTE.cloudLit, { vertexColors: true, shade: PALETTE.cloudShade }, { noCloudShadow: true });
  // Clouds are the haze: fogging them toward the fog colour would erase their billows, so they stay crisp white.
  puffMat.fog = false;
  const maxPuffs = QUALITY.high.cloudPuffs;
  const puffs = new THREE.InstancedMesh(merge(lobes), puffMat, maxPuffs);
  puffs.frustumCulled = false;
  const pr = makeRng(707);
  const puffData: { a: number; r: number; y: number; s: number }[] = [];
  for (let i = 0; i < maxPuffs; i++) {
    puffData.push({ a: pr() * Math.PI * 2, r: cs.ringMin + Math.sqrt(pr()) * (cs.ringMax - cs.ringMin), y: cs.puffMinY + pr() * (cs.puffMaxY - cs.puffMinY), s: 4 + pr() * 9 });
  }
  group.add(puffs);

  // ── Painted cumulus at 300 m: one merged mesh of quads facing the centre (unfogged, horizon-tinted).
  const quads: THREE.BufferGeometry[] = [];
  const cr = makeRng(909);
  for (let i = 0; i < cs.cumulus; i++) {
    const a = -Math.PI * 0.95 + (i / cs.cumulus) * Math.PI * 1.9 + cr() * 0.25; // mostly ahead of the camera
    const w = 110 + cr() * 90;
    const q = new THREE.PlaneGeometry(w, w * 0.5);
    const x = Math.sin(a) * cs.cumulusDist, z = -Math.cos(a) * cs.cumulusDist;
    place(q, x, -18 + cr() * 40 + w * 0.12, z, 0, Math.atan2(-x, -z), 0);
    quads.push(q);
  }
  const cumulus = new THREE.Mesh(merge(quads), new THREE.MeshBasicMaterial({
    map: cumulusTexture(), transparent: true, depthWrite: false, fog: false, color: lin(0xf4f8ff).multiplyScalar(0.98),
  }));
  cumulus.renderOrder = -9;
  group.add(cumulus);

  // ── Birds: 3 flocks × 4 V-shapes circling the temple isle at r 18 m, flapping 5 Hz.
  const v = new THREE.BufferGeometry();
  v.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0.2, -0.1, 0, 0, 0.12, 0, 0, -0.12, 0.55, 0.2, -0.1, 0, 0, -0.12, 0, 0, 0.12], 3));
  v.computeVertexNormals();
  const birdN = AMBIENT.birdFlocks * AMBIENT.birdsPerFlock;
  const birds = new THREE.InstancedMesh(v, new THREE.MeshBasicMaterial({ color: lin(0x5a6a88), side: THREE.DoubleSide }), birdN);
  birds.frustumCulled = false;
  group.add(birds);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const ti = SCENERY.templeIsland;
  const span = Math.PI * 2;
  let low = false;
  return {
    group,
    update(t, camera) {
      dome.position.copy(camera.position);
      seaMat.uniforms.uTime!.value = t;
      const n = low ? QUALITY.low.cloudPuffs : maxPuffs;
      puffs.count = n;
      for (let i = 0; i < n; i++) {
        const d = puffData[i]!;
        // Drift +x at 0.4 m/s, wrapping within the ring band.
        const bx = Math.sin(d.a) * d.r, bz = -Math.cos(d.a) * d.r;
        const wrapW = cs.ringMax * 2;
        let x = bx + cs.drift * t;
        x = ((x + cs.ringMax) % wrapW + wrapW) % wrapW - cs.ringMax;
        if (Math.hypot(x, bz) < cs.ringMin * 0.8) x += x < 0 ? -cs.ringMin : cs.ringMin;
        m.compose(p.set(x, d.y, bz), q.setFromEuler(e.set(0, d.a, 0)), s.set(d.s, d.s, d.s));
        puffs.setMatrixAt(i, m);
      }
      puffs.instanceMatrix.needsUpdate = true;
      for (let f = 0; f < AMBIENT.birdFlocks; f++) {
        const ang = t * AMBIENT.birdSpeed * (f % 2 ? -1 : 1) + (f * span) / AMBIENT.birdFlocks;
        const r = AMBIENT.birdRadius + f * 3;
        for (let k = 0; k < AMBIENT.birdsPerFlock; k++) {
          const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2);
          const a2 = ang - Math.abs(off) * 0.05 * (f % 2 ? -1 : 1);
          const x = ti.x + Math.sin(a2) * (r + off * 0.9), z = ti.z - Math.cos(a2) * (r + off * 0.9);
          const y = ti.y + 9 + f * 2.5 + Math.sin(t * 0.7 + f) * 0.8 - Math.abs(off) * 0.3;
          const heading = a2 + (f % 2 ? -Math.PI / 2 : Math.PI / 2);
          const flap = Math.sin(t * AMBIENT.birdFlapHz * Math.PI * 2 + k * 1.3);
          m.compose(p.set(x, y, z), q.setFromEuler(e.set(0, Math.PI - heading, 0)), s.set(0.9, 0.3 + 1.2 * flap, 0.9));
          birds.setMatrixAt(f * AMBIENT.birdsPerFlock + k, m);
        }
      }
      birds.instanceMatrix.needsUpdate = true;
    },
    setQuality(l) {
      low = l;
    },
  };
}
