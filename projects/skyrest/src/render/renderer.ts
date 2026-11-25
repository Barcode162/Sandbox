// src/render/renderer.ts — owned by WO-002. WebGL2 renderer + post (bloom/grade on 'high'), quality tiers,
// stats counted across all passes (info.autoReset = false). Scaffold: no post yet.
import * as THREE from 'three';
import type { CreateRenderer, Quality, QualitySetting, RenderStats } from '../contracts.ts';
import { QUALITY } from '../tuning/world.ts';

export const createRenderer: CreateRenderer = (canvas, settings) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;
  const resolve = (q: QualitySetting): Quality =>
    q !== 'auto' ? q : typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 'low' : 'high';
  let quality: Quality = resolve(settings.quality);
  const stats: RenderStats = { drawCalls: 0, triangles: 0, geometries: 0, textures: 0, fps: 0 };
  let frames = 0, last = performance.now();
  const applyPixelRatio = () => renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY[quality].pixelRatioCap));
  applyPixelRatio();
  return {
    renderer,
    get quality() {
      return quality;
    },
    render(scene, camera) {
      renderer.info.reset();
      renderer.render(scene, camera);
      stats.drawCalls = renderer.info.render.calls;
      stats.triangles = renderer.info.render.triangles;
      stats.geometries = renderer.info.memory.geometries;
      stats.textures = renderer.info.memory.textures;
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        stats.fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
      }
    },
    resize(w, h) {
      renderer.setSize(w, h, false);
    },
    setQuality(q) {
      quality = resolve(q);
      applyPixelRatio();
    },
    stats: () => stats,
    dispose() {
      renderer.dispose();
    },
  };
};
