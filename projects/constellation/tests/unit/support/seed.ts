// Shared fixtures for unit tests: the real seed (through the import path) and a 500-node graph.
import { readFileSync } from 'node:fs';
import { createGraph, importJson } from '../../../src/core/index.ts';
import type { MemoryDoc, MemoryGraph } from '../../../src/core/index.ts';
import { hashString, mulberry32 } from '../../../src/core/internal.ts';

export const SEED_TEXT = readFileSync(new URL('../../../src/seed/memory.json', import.meta.url), 'utf8');

export function seedDoc(): MemoryDoc {
  const res = importJson(SEED_TEXT);
  if (!res.ok) throw new Error('seed does not validate: ' + JSON.stringify(res.errors));
  return res.doc;
}

export function seedGraph(): MemoryGraph {
  return createGraph(seedDoc());
}

/** Node id by label in the seed (exact case). */
export function idOf(graph: MemoryGraph, label: string): string {
  const n = graph.findByLabel(label);
  if (!n) throw new Error(`no node "${label}"`);
  return n.id;
}

/** A deterministic 500-node, ~900-relation graph with three perspectives and some lens-only lines. */
export function bigGraph(count = 500): MemoryGraph {
  const g = createGraph({
    schema: 'constellation.memory',
    version: 1,
    meta: { title: 'stress', defaultPerspective: 'a' },
    perspectives: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
    nodes: [],
    relations: [],
  });
  const rand = mulberry32(hashString('stress'));
  const words = ['amber', 'basalt', 'cedar', 'delta', 'ember', 'fjord', 'garnet', 'harbor', 'iris', 'juniper'];
  for (let i = 0; i < count; i++) {
    g.addNode({ id: `s${i}`, label: `${words[i % words.length]} ${i}`, value: i % 7 === 0 ? `note about ${words[(i * 3) % words.length]}` : i, facets: i % 5 === 0 ? { b: i * 2 } : {}, tags: [words[i % 4]!] });
  }
  for (let i = 1; i < count; i++) g.addRelation({ from: `s${Math.floor(rand() * i)}`, to: `s${i}`, weight: 0.3 + rand() * 0.7 });
  for (let k = 0; k < count * 0.8; k++) {
    const a = Math.floor(rand() * count), b = Math.floor(rand() * count);
    if (a !== b) g.addRelation({ from: `s${a}`, to: `s${b}`, weight: 0.2 + rand() * 0.8, ...(k % 6 === 0 ? { perspectives: ['b'] } : {}) });
  }
  return g;
}
