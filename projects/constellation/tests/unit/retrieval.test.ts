import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGraph, retrieve, search, spreadActivation } from '../../src/core/index.ts';
import type { Activation, MemoryGraph } from '../../src/core/index.ts';
import { bigGraph, seedDoc, seedGraph } from './support/seed.ts';

const close = (a: number, b: number) => Math.abs(a - b) < 1e-12;
const byDepth = (acts: Activation[]) => { const out: number[] = []; for (const a of acts) out[a.depth] = (out[a.depth] ?? 0) + 1; return out; };

/** s ─(1.0)─ a ─(0.5)─ b ─(1.0)─ c ─(1.0)─ d, plus s ─(0.5)─ b and a lens-only s ─ e. */
function handBuilt(): MemoryGraph {
  const g = createGraph();
  g.addPerspective({ id: 'x', label: 'X' });
  for (const id of ['s', 'a', 'b', 'c', 'd', 'e']) g.addNode({ id, label: id === 's' ? 'Seed' : id.toUpperCase() });
  g.addRelation({ from: 's', to: 'a', weight: 1 });
  g.addRelation({ from: 'a', to: 'b', weight: 0.5 });
  g.addRelation({ from: 'b', to: 'c', weight: 1 });
  g.addRelation({ from: 'c', to: 'd', weight: 1 });
  g.addRelation({ from: 's', to: 'b', weight: 0.5 });
  g.addRelation({ from: 's', to: 'e', weight: 1, perspectives: ['x'] });
  return g;
}

test('[U-retrieval-1] spreadActivation: exact depths and activations (max over paths, decay × weight)', () => {
  const acts = spreadActivation(handBuilt(), [{ nodeId: 's', activation: 1 }]);
  const got = Object.fromEntries(acts.map((a) => [a.nodeId, [a.depth, a.activation]]));
  assert.deepEqual(Object.keys(got).sort(), ['a', 'b', 'c', 'd', 'e', 's']);
  assert.equal(got.s![0], 0); assert.equal(got.s![1], 1);
  assert.equal(got.a![0], 1); assert.ok(close(got.a![1]!, 0.6));
  assert.equal(got.e![0], 1); assert.ok(close(got.e![1]!, 0.6));
  // b: direct s─b gives 0.3; s─a─b gives 0.6·0.6·0.5 = 0.18 → 0.3 at depth 1.
  assert.equal(got.b![0], 1); assert.ok(close(got.b![1]!, 0.3));
  assert.equal(got.c![0], 2); assert.ok(close(got.c![1]!, 0.18));
  assert.equal(got.d![0], 3); assert.ok(close(got.d![1]!, 0.108));
  assert.deepEqual(acts.map((a) => a.nodeId), ['s', 'a', 'e', 'b', 'c', 'd'], 'sorted by activation, then depth, then id');
});

test('[U-retrieval-2] options: maxDepth, threshold, decay and perspective visibility', () => {
  const g = handBuilt();
  const seed = [{ nodeId: 's', activation: 1 }];
  assert.deepEqual(spreadActivation(g, seed, { maxDepth: 1 }).map((a) => a.nodeId).sort(), ['a', 'b', 'e', 's']);
  assert.deepEqual(spreadActivation(g, seed, { threshold: 0.2 }).map((a) => a.nodeId).sort(), ['a', 'b', 'e', 's']);
  const strong = spreadActivation(g, seed, { decay: 1 });
  assert.ok(close(strong.find((a) => a.nodeId === 'd')!.activation, 0.5));
  const lensless = spreadActivation(g, seed, { perspective: 'base' });
  assert.equal(lensless.some((a) => a.nodeId === 'e'), false, 'the x-only line is invisible under base');
});

test('[U-retrieval-3] search: case- and accent-insensitive, scored by field, empty → []', () => {
  const g = createGraph();
  g.addNode({ id: 'cafe', label: 'Café Crème' });
  g.addNode({ id: 'note', label: 'Other', notes: 'meet at the cafe' });
  g.addNode({ id: 'tag', label: 'Tagged', tags: ['CAFE-life'] });
  g.addNode({ id: 'file', label: 'Doc', kind: 'file', file: { name: 'menu.txt', path: '/cafe/menu.txt' } });
  g.addNode({ id: 'val', label: 'Order', value: 'one café, please' });
  assert.deepEqual(search(g, '  '), []);
  const m = search(g, 'CAFÉ');
  assert.deepEqual(m.map((x) => [x.nodeId, x.field]), [['cafe', 'label'], ['val', 'value'], ['file', 'file'], ['tag', 'tag'], ['note', 'notes']]);
  assert.equal(search(g, 'café crème')[0]!.score, 1);
  assert.ok(m.every((x) => x.score > 0 && x.score <= 1));
});

test('[U-retrieval-4] search reads the active lens value, and other lenses as facets', () => {
  const g = seedGraph();
  assert.deepEqual(search(g, 'dinner', 'child').map((x) => [x.nodeId, x.field, x.score]), [['soup', 'value', 0.6]]);
  assert.deepEqual(search(g, 'dinner', 'cook').map((x) => [x.nodeId, x.field, x.score]), [['soup', 'facet', 0.45]]);
  assert.deepEqual(search(g, '293').map((x) => x.nodeId), ['temperature'], 'numbers are searchable as text');
});

test('[U-retrieval-5] "boil" under Cook: 2 matches (Boiling Point, boiling-curve.csv), then 4 / 12 / 11 by depth', () => {
  const g = seedGraph();
  const r = retrieve(g, 'boil', { perspective: 'cook' });
  assert.deepEqual(r.matches.map((m) => m.nodeId).sort(), ['boiling-curve', 'boiling-point']);
  assert.deepEqual(byDepth(r.activations), [2, 4, 12, 11]);
  const d1 = r.activations.filter((a) => a.depth === 1).map((a) => a.nodeId).sort();
  assert.deepEqual(d1, ['kettle-manual', 'p4', 'steam', 'temperature']);
  // §5 states 16 and 14 at depths 2 and 3. Those are the counts when activation also crosses
  // pathway (flow) lines; the frozen contract says spread is over non-flow relations. The data
  // matches the spec exactly once flow lines are allowed — see reports/WO-002.md REQUESTS.
  const doc = seedDoc();
  for (const rel of doc.relations) if (rel.type === 'flow') rel.type = 'association';
  assert.deepEqual(byDepth(retrieve(createGraph(doc), 'boil', { perspective: 'cook' }).activations), [2, 4, 16, 14]);
});

test('[U-retrieval-6] flow relations never carry activation', () => {
  const g = createGraph();
  g.addNode({ id: 'p', label: 'Start', kind: 'pathway', pathway: { op: 'start' } });
  g.addNode({ id: 'q', label: 'End', kind: 'pathway', pathway: { op: 'end' } });
  g.addRelation({ from: 'p', to: 'q', type: 'flow' });
  assert.deepEqual(retrieve(g, 'start').activations.map((a) => a.nodeId), ['p']);
});

test('[U-retrieval-7] retrieve on 500 nodes takes ≤ 10 ms', () => {
  const g = bigGraph(500);
  retrieve(g, 'amber'); // warm
  const times: number[] = [];
  for (const q of ['amber', 'ember', 'note', 'cedar 1', 'juniper', 'garnet', 'iris']) {
    const t = performance.now();
    const r = retrieve(g, q, { perspective: 'b' });
    times.push(performance.now() - t);
    assert.ok(r.activations.length > 0);
  }
  times.sort((a, b) => a - b);
  assert.ok(times[3]! <= 10, `median ${times[3]!.toFixed(2)} ms`);
});
