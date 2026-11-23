// src/ui/stress.ts — `?stress=N`: a generated, valid N-node memory for the fps budget (plan.md → Budgets).
import { SCHEMA_ID, SCHEMA_VERSION } from '../core/index.ts';
import type { MemoryDoc, MemoryNode, NodeKind, Relation } from '../core/index.ts';

export function stressDoc(count: number): MemoryDoc {
  const n = Math.max(10, Math.min(5000, Math.floor(count)));
  let s = 0x9e3779b9;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const kinds: NodeKind[] = ['concept', 'concept', 'variable', 'file', 'note'];
  const nodes: MemoryNode[] = [];
  const relations: Relation[] = [];
  const clusters = 8;
  for (let i = 0; i < n; i++) {
    const kind = kinds[i % kinds.length]!;
    const disagree = i % 9 === 0;
    nodes.push({
      id: `s${i}`,
      label: i === 0 ? 'Memory' : `Point ${i}`,
      kind,
      value: kind === 'variable' ? i : `value ${i}`,
      facets: disagree ? { a: i, b: i * 2, c: `${i} c` } : {},
      tags: [`c${i % clusters}`],
      created: 0,
      updated: 0,
      ...(kind === 'file' ? { file: { name: `file-${i}.txt`, path: `/stress/file-${i}.txt` } } : {}),
    });
  }
  let r = 0;
  const add = (from: number, to: number, perspectives?: string[]) => {
    if (from === to) return;
    relations.push({ id: `sr${r++}`, from: `s${from}`, to: `s${to}`, type: 'association', weight: 0.4 + rnd() * 0.6, directed: false, created: 0, ...(perspectives ? { perspectives } : {}) });
  };
  for (let i = 1; i < n; i++) {
    // A tree inside each cluster plus a few cross links.
    const sameCluster = i - clusters > 0 ? i - clusters : 0;
    add(i, sameCluster);
    if (rnd() < 0.5) add(i, Math.floor(rnd() * n), rnd() < 0.3 ? ['b'] : undefined);
  }
  // Authored positions at the seed's scale: eight cluster islands per lens, so 500 points read
  // as a sky (and measure the renderer), not a packed hairball.
  const positions = (spread: number) => {
    const out: Record<string, { x: number; y: number; z: number }> = {};
    for (let i = 0; i < n; i++) {
      const c = i % clusters;
      const a = (c / clusters) * Math.PI * 2 + spread;
      const anchor = { x: Math.cos(a) * 170, y: Math.sin(a * 1.7) * 70, z: Math.sin(a) * 120 };
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const rr = 42 * Math.cbrt(rnd());
      const k = Math.sqrt(1 - u * u);
      out[`s${i}`] = { x: round(anchor.x + Math.cos(th) * k * rr), y: round(anchor.y + u * rr), z: round(anchor.z + Math.sin(th) * k * rr) };
    }
    return out;
  };
  return {
    schema: SCHEMA_ID,
    version: SCHEMA_VERSION,
    meta: { title: `Stress: ${n} points`, defaultPerspective: 'a' },
    perspectives: [
      { id: 'a', label: 'Lens A', accent: '#FF9F5A', positions: positions(0) },
      { id: 'b', label: 'Lens B', accent: '#6FD3FF', positions: positions(0.6) },
      { id: 'c', label: 'Lens C', accent: '#FF7EC8', positions: positions(1.2) },
    ],
    nodes,
    relations,
  };
}

const round = (v: number) => Math.round(v * 100) / 100;
