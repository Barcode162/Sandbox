// src/view/renderer.ts — WAVE-0 PLACEHOLDER (WO-003 replaces it entirely).
// Proves Three.js + WebGL boot in headless Chromium: true-black clear and one point per node.
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from 'three';
import type { CreateRenderer, Renderer, SceneSnapshot } from './contracts.ts';

export const createRenderer: CreateRenderer = ({ container }) => {
  const gl = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gl.setClearColor(new Color(0x000000), 1);
  gl.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(gl.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, 1, 0.1, 2000);
  camera.position.set(0, 0, 140);
  const geometry = new BufferGeometry();
  const points = new Points(geometry, new PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: true }));
  scene.add(points);
  let current: SceneSnapshot = { perspective: '', nodes: [], relations: [] };
  let frames = 0;
  let last = performance.now();
  let fps = 0;
  let raf = 0;

  const draw = (s: SceneSnapshot) => {
    current = s;
    const arr = new Float32Array(s.nodes.length * 3);
    s.nodes.forEach((n, i) => arr.set([n.position.x, n.position.y, n.position.z], i * 3));
    geometry.setAttribute('position', new BufferAttribute(arr, 3));
  };
  const loop = () => {
    raf = requestAnimationFrame(loop);
    gl.render(scene, camera);
    frames += 1;
    const now = performance.now();
    if (now - last >= 1000) {
      fps = (frames * 1000) / (now - last);
      frames = 0;
      last = now;
    }
  };
  const resize = (w: number, h: number) => {
    gl.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  resize(container.clientWidth, container.clientHeight);
  loop();

  const noop = () => {};
  const r: Renderer = {
    setScene: draw,
    transitionTo: async (s) => draw(s),
    highlightRoutes: noop,
    clearRoutes: noop,
    playTrace: async () => {},
    stopTrace: noop,
    setActivation: noop,
    setSelection: noop,
    focusNode: async () => {},
    onPick: () => noop,
    onHover: () => noop,
    screenPosition: () => null,
    setReducedMotion: noop,
    stats: () => ({ fps, frameMs: fps ? 1000 / fps : 0, drawCalls: gl.info.render.calls, nodes: current.nodes.length, relations: current.relations.length }),
    resize,
    dispose: () => {
      cancelAnimationFrame(raf);
      geometry.dispose();
      gl.dispose();
    },
  };
  return r;
};
