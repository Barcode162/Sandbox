import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreError, compareRoutes, createGraph, declaredPath, exportJson, importJson, isRelationVisible, learnShortcut, learnShortcutDetailed, shortestPath } from '../../src/core/index.ts';
import type { MemoryGraph } from '../../src/core/index.ts';
import { seedGraph } from './support/seed.ts';

const letters = (g: MemoryGraph, ids: string[]) => ids.map((id) => g.getNode(id)!.label).join(' → ');

test('[U-routing-1] seed A → Z under Cook: declared 25 hops, shortest 3 (A → F → X → Z)', () => {
  const g = seedGraph();
  const cmp = compareRoutes(g, 'road-a', 'road-z', { perspective: 'cook' });
  assert.equal(cmp.declared!.hops, 25);
  assert.equal(cmp.declared!.kind, 'declared');
  assert.equal(cmp.shortest!.hops, 3);
  assert.ok(cmp.shortest!.hops <= 3);
  assert.equal(letters(g, cmp.shortest!.nodes), 'A → F → X → Z');
  assert.equal(cmp.savedHops, 22);
  assert.equal(Math.round((1 - 3 / 25) * 100), 88, '"88% shorter"');
});

test('[U-routing-2] Physicist matches Cook; Child cannot see F–X and goes 20 hops', () => {
  const g = seedGraph();
  assert.equal(letters(g, shortestPath(g, 'road-a', 'road-z', { perspective: 'physicist' })!.nodes), 'A → F → X → Z');
  const child = compareRoutes(g, 'road-a', 'road-z', { perspective: 'child' });
  assert.equal(child.declared!.hops, 25);
  assert.equal(child.shortest!.hops, 20);
  assert.equal(letters(g, child.shortest!.nodes), 'A → F → G → H → I → J → K → L → M → N → O → P → Q → R → S → T → U → V → W → X → Z');
  assert.equal(Math.round((1 - 20 / 25) * 100), 20, '"20% shorter"');
});

test('[U-routing-3] Route arrays line up: relations[i] joins nodes[i] and nodes[i+1]; cost = Σ 1/weight', () => {
  const g = seedGraph();
  const r = declaredPath(g, 'road-a', 'road-z', { perspective: 'cook' })!;
  assert.equal(r.nodes.length, 26);
  assert.equal(r.relations.length, 25);
  r.relations.forEach((id, i) => {
    const rel = g.getRelation(id)!;
    assert.deepEqual(new Set([rel.from, rel.to]), new Set([r.nodes[i], r.nodes[i + 1]]));
    assert.equal(rel.type, 'chain');
  });
  assert.equal(r.cost, 25);
});

test('[U-routing-4] perspective-hidden relations are never routed', () => {
  const g = seedGraph();
  const child = shortestPath(g, 'road-a', 'road-z', { perspective: 'child' })!;
  for (const id of child.relations) {
    const rel = g.getRelation(id)!;
    assert.ok(!rel.perspectives || rel.perspectives.includes('child'), id);
  }
  // Energy has no lines under Cook: unreachable there, reachable under Physicist.
  assert.equal(shortestPath(g, 'energy', 'soup', { perspective: 'cook' }), null);
  assert.ok(shortestPath(g, 'energy', 'soup', { perspective: 'physicist' }));
});

test('[U-routing-5] learnShortcut adds one undirected shortcut and is idempotent', () => {
  const g = seedGraph();
  const route = shortestPath(g, 'road-a', 'road-z', { perspective: 'cook' })!;
  const before = g.relations().length;
  const learned = learnShortcut(g, route);
  assert.deepEqual([learned.type, learned.from, learned.to, learned.weight, learned.directed, learned.perspectives], ['shortcut', 'road-a', 'road-z', 0.9, false, undefined]);
  assert.equal(learnShortcut(g, route), learned);
  assert.equal(learnShortcut(g, { ...route, nodes: [...route.nodes].reverse() }), learned, 'either direction is the same shortcut');
  assert.equal(g.relations().length, before + 1);
  for (const lens of ['cook', 'physicist', 'child']) {
    const after = compareRoutes(g, 'road-a', 'road-z', { perspective: lens });
    assert.equal(after.shortest!.hops, 1, lens);
    assert.equal(after.declared!.hops, 25, lens);
  }
});

test('[U-routing-6] learnShortcut refuses one-hop routes with the spec copy', () => {
  const g = seedGraph();
  const one = shortestPath(g, 'road-a', 'road-b')!;
  assert.throws(() => learnShortcut(g, one), (e: unknown) => e instanceof CoreError && e.code === 'invalid' && e.message === 'Already one hop. Nothing shorter to learn.');
});

test('[U-routing-7] a learned shortcut survives export → import', () => {
  const g = seedGraph();
  learnShortcut(g, shortestPath(g, 'road-a', 'road-z', { perspective: 'cook' })!);
  const res = importJson(exportJson(g));
  assert.ok(res.ok);
  const g2 = createGraph(res.doc);
  assert.equal(shortestPath(g2, 'road-a', 'road-z', { perspective: 'child' })!.hops, 1);
});

test('[U-routing-8] ties break by fewer hops, then lexicographic node ids; direction is respected', () => {
  const g = createGraph();
  for (const id of ['s', 'a', 'b', 'c', 't']) g.addNode({ id, label: id });
  // Two equal-cost 2-hop paths s-b-t and s-a-t, and a 3-hop path of the same cost.
  g.addRelation({ from: 's', to: 'b', weight: 1 }); g.addRelation({ from: 'b', to: 't', weight: 1 });
  g.addRelation({ from: 's', to: 'a', weight: 1 }); g.addRelation({ from: 'a', to: 't', weight: 1 });
  assert.deepEqual(shortestPath(g, 's', 't')!.nodes, ['s', 'a', 't']);
  const h = createGraph();
  for (const id of ['s', 'm', 't']) h.addNode({ id, label: id });
  h.addRelation({ from: 's', to: 't', weight: 0.5 }); // cost 2, 1 hop
  h.addRelation({ from: 's', to: 'm', weight: 1 }); h.addRelation({ from: 'm', to: 't', weight: 1 }); // cost 2, 2 hops
  assert.deepEqual(shortestPath(h, 's', 't')!.nodes, ['s', 't']);
  const d = createGraph();
  d.addNode({ id: 'x', label: 'x' }); d.addNode({ id: 'y', label: 'y' });
  d.addRelation({ from: 'x', to: 'y', type: 'chain' });
  assert.ok(declaredPath(d, 'x', 'y'));
  assert.equal(declaredPath(d, 'y', 'x'), null, 'a directed chain is not walked backwards');
});

test('[U-routing-9] weights matter: a heavier detour beats a weak direct line; flow is excluded by default', () => {
  const g = createGraph();
  for (const id of ['a', 'b', 'c']) g.addNode({ id, label: id });
  g.addRelation({ from: 'a', to: 'c', weight: 0.2 }); // cost 5
  g.addRelation({ from: 'a', to: 'b', weight: 1 }); g.addRelation({ from: 'b', to: 'c', weight: 1 }); // cost 2
  assert.deepEqual(shortestPath(g, 'a', 'c')!.nodes, ['a', 'b', 'c']);
  assert.deepEqual(shortestPath(g, 'a', 'c', { excludeTypes: [] })!.nodes, ['a', 'b', 'c']);
  const f = createGraph();
  f.addNode({ id: 'p', label: 'p' }); f.addNode({ id: 'q', label: 'q' });
  f.addRelation({ from: 'p', to: 'q', type: 'flow' });
  assert.equal(shortestPath(f, 'p', 'q'), null);
  assert.ok(shortestPath(f, 'p', 'q', { excludeTypes: [] }));
  assert.equal(compareRoutes(f, 'p', 'q').savedHops, 0);
  assert.equal(shortestPath(f, 'p', 'nowhere'), null);
});

test('[U-routing-10] F-007: a lens-hidden shortcut is widened to every lens, and the outcome says what happened', () => {
  const g = seedGraph();
  const hidden = g.addRelation({ from: 'road-z', to: 'road-a', type: 'shortcut', weight: 0.9, perspectives: ['physicist'] });
  const route = shortestPath(g, 'road-a', 'road-z', { perspective: 'cook' })!;
  assert.equal(route.hops, 3, 'the physicist-only shortcut is not routed under Cook');
  const first = learnShortcutDetailed(g, route);
  assert.equal(first.outcome, 'widened');
  assert.equal(first.learned, true);
  assert.equal(first.relation.id, hidden.id, 'no duplicate line');
  assert.equal(first.previous, hidden, 'undo can restore the lens-only line');
  for (const lens of ['cook', 'physicist', 'child']) assert.ok(isRelationVisible(first.relation, lens), lens);
  const again = learnShortcutDetailed(g, route);
  assert.deepEqual([again.outcome, again.learned, again.relation.id], ['existing', false, hidden.id]);
  assert.equal(learnShortcut(g, route), again.relation);
  const fresh = learnShortcutDetailed(seedGraph(), route);
  assert.deepEqual([fresh.outcome, fresh.learned, fresh.previous], ['added', true, undefined]);
});

test('[U-routing-11] F-007: learnShortcut never returns a shortcut hidden in some lens', () => {
  const g = seedGraph();
  g.addRelation({ id: 'lens-only', from: 'road-a', to: 'road-z', type: 'shortcut', perspectives: ['child'] });
  const r = learnShortcut(g, shortestPath(g, 'road-a', 'road-z', { perspective: 'cook' })!);
  assert.equal(r.perspectives, undefined);
  assert.equal(g.relations().filter((x) => x.type === 'shortcut').length, 1);
});
