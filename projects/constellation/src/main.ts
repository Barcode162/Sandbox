// src/main.ts — the integration seam (owned by WO-003). WAVE-0 PLACEHOLDER.
// Final shape: load autosave or seed via core.importJson/validateDoc → createGraph → startAutosave
// → build SceneSnapshot from core (layoutFor, resolveValue, facetsOf, disagrees, visibleRelations)
// → renderer + ui panels → install window.__constellation.
import './styles/app.css';
import seed from './seed/memory.json';
import { createRenderer } from './view/renderer.ts';
import type { SceneSnapshot } from './view/contracts.ts';

const stage = document.getElementById('stage');
if (!stage) throw new Error('#stage missing');
const renderer = createRenderer({ container: stage, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });

// Placeholder layout (core is stubbed in wave 0): a ring.
const nodes = seed.nodes;
const snapshot: SceneSnapshot = {
  perspective: seed.meta.defaultPerspective,
  nodes: nodes.map((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    return { id: n.id, label: n.label, kind: 'concept', valueText: String(n.value ?? ''), position: { x: Math.cos(a) * 40, y: Math.sin(a) * 40, z: 0 } };
  }),
  relations: [],
};
renderer.setScene(snapshot);
addEventListener('resize', () => renderer.resize(stage.clientWidth, stage.clientHeight));

window.__constellation = {
  ready: true,
  perspective: snapshot.perspective,
  stats: () => renderer.stats(),
  screenPosition: (id) => renderer.screenPosition(id),
  nodeIdByLabel: (label) => nodes.find((n) => n.label.toLowerCase() === label.toLowerCase())?.id ?? null,
  idle: async () => {},
};
