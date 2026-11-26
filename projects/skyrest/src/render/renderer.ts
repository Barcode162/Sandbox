// src/render/renderer.ts — owned by WO-002. WebGL2 renderer + post (§4.2): Neutral tone mapping; on High an
// EffectComposer (MSAA HalfFloat scene → UnrealBloom on emissives → OutputPass → grade: saturation, shadow lift,
// vignette); on Low no composer: direct render, halo sprites instead of bloom, CSS vignette. Stats count every
// pass (info.autoReset = false). Auto tier: touch starts Low, else High; sustained slow frames step down, never up.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { CreateRenderer, Quality, QualitySetting, RenderStats } from '../contracts.ts';
import { POST, QUALITY } from '../tuning/world.ts';
import { setHalosEnabled } from './materials.ts';
import { autoStep, createAutoState } from './quality.ts';

/** Raw display-space components (the grade runs after OutputPass, in sRGB). */
const raw = (hex: number) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);

/** Final grade in display space: saturation, shadows lifted toward a cool blue, coloured vignette. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSat: { value: POST.saturation },
    uLift: { value: POST.shadowLift },
    uLiftColor: { value: raw(POST.shadowLiftColor) },
    uVigOffset: { value: POST.vignetteOffset },
    uVigDark: { value: POST.vignetteDarkness },
    uVigColor: { value: raw(POST.vignetteColor) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSat, uLift, uVigOffset, uVigDark;
    uniform vec3 uLiftColor, uVigColor;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      c = mix(c, uLiftColor, uLift * (1.0 - smoothstep(0.0, 0.5, l)));
      vec2 d = (vUv - 0.5) * 2.0;
      float v = smoothstep(uVigOffset * 0.55, uVigOffset * 1.45, length(d * vec2(0.9, 1.0)));
      c = mix(c, uVigColor, v * uVigDark);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

export const createRenderer: CreateRenderer = (canvas, settings) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = POST.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // soft via shadow.radius (PCFSoft was folded into PCF in r18x)
  renderer.info.autoReset = false;

  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  // Automation runs on a software rasterizer: its frame times say nothing about a player's device (plan: fps is
  // never claimed from SwiftShader), so Auto never downgrades under webdriver.
  const automated = typeof navigator !== 'undefined' && navigator.webdriver === true;
  let setting: QualitySetting = settings.quality;
  const auto = createAutoState(touch ? 'low' : 'high', Math.min(devicePixelRatio || 1, QUALITY[touch ? 'low' : 'high'].pixelRatioCap));
  const resolve = (): Quality => (setting === 'auto' ? auto.quality : setting);
  let quality: Quality = resolve();

  // Low tier's CSS vignette (the grade pass does it on High).
  const vignette = document.createElement('div');
  vignette.setAttribute('aria-hidden', 'true');
  Object.assign(vignette.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none', display: 'none',
    background: 'radial-gradient(ellipse at center, rgba(26,36,64,0) 55%, rgba(26,36,64,0.24) 100%)',
  });
  canvas.insertAdjacentElement('afterend', vignette);

  let composer: EffectComposer | null = null;
  let width = 1, height = 1;
  const buildComposer = () => {
    const rt = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: POST.msaaSamples });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    return composer;
  };
  let scenePass: RenderPass | null = null;

  const pixelRatio = () => Math.min(devicePixelRatio || 1, QUALITY[quality].pixelRatioCap, setting === 'auto' ? auto.pixelRatio : Infinity);
  const dropComposer = () => {
    if (!composer) return;
    for (const pass of composer.passes) pass.dispose();
    composer.dispose();
    composer = null;
    scenePass = null;
  };
  const apply = () => {
    quality = resolve();
    if (quality === 'low') dropComposer(); // Low never keeps the post targets alive (phone memory)
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
    composer?.setPixelRatio(renderer.getPixelRatio());
    composer?.setSize(width, height);
    setHalosEnabled(quality === 'low');
    vignette.style.display = quality === 'low' ? 'block' : 'none';
    // Observable tier for tests and the stats overlay: which post path draws this frame.
    canvas.dataset.tier = quality;
    canvas.dataset.post = quality === 'high' ? 'bloom' : 'halos';
  };
  apply();

  const stats: RenderStats = { drawCalls: 0, triangles: 0, geometries: 0, textures: 0, fps: 0 };
  let frames = 0, lastFps = performance.now(), lastFrame = 0;
  return {
    renderer,
    get quality() {
      return quality;
    },
    render(scene, camera) {
      renderer.info.reset();
      if (quality === 'high') {
        if (!composer) {
          buildComposer();
          scenePass = new RenderPass(scene, camera);
          const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), POST.bloomStrength, POST.bloomRadius, POST.bloomThreshold);
          composer!.addPass(scenePass);
          composer!.addPass(bloom);
          composer!.addPass(new OutputPass());
          composer!.addPass(new ShaderPass(GradeShader));
        }
        scenePass!.scene = scene;
        scenePass!.camera = camera;
        composer!.render();
      } else renderer.render(scene, camera);
      stats.drawCalls = renderer.info.render.calls;
      stats.triangles = renderer.info.render.triangles;
      stats.geometries = renderer.info.memory.geometries;
      stats.textures = renderer.info.memory.textures;
      frames++;
      const now = performance.now();
      if (now - lastFps >= 1000) {
        stats.fps = Math.round((frames * 1000) / (now - lastFps));
        frames = 0;
        lastFps = now;
      }
      // Auto tier: only real, visible, consecutive frames count.
      if (setting === 'auto' && !automated && !document.hidden && lastFrame > 0 && autoStep(auto, now - lastFrame)) apply();
      lastFrame = now;
    },
    resize(w, h) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      apply();
    },
    setQuality(q) {
      setting = q;
      apply();
    },
    stats: () => stats,
    dispose() {
      dropComposer();
      vignette.remove();
      renderer.dispose();
    },
  };
};
