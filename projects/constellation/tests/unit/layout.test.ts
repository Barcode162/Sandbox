import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGraph, forceLayout, layoutFor } from '../../src/core/index.ts';
import { bigGraph, seedDoc, seedGraph } from './support/seed.ts';
import { ringPosition } from './support/seed-source.ts';

const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const finite = (p: { x: number; y: number; z: number }) => [p.x, p.y, p.z].every(Number.isFinite);

test('[U-layout-1] forceLayout is deterministic: two runs are deep-equal, insertion order does not matter', () => {
  const g = bigGraph(120);
  const a = forceLayout(g.nodes(), g.relations(), { seed: 'b' });
  const b = forceLayout(g.nodes(), g.relations(), { seed: 'b' });
  const c = forceLayout([...g.nodes()].reverse(), [...g.relations()].reverse(), { seed: 'b' });
  assert.deepEqual(a, b);
  assert.deepEqual([...a.entries()].sort(), [...c.entries()].sort());
  assert.notDeepEqual(a, forceLayout(g.nodes(), g.relations(), { seed: 'c' }), 'the seed changes the layout');
});

test('[U-layout-2] forceLayout normalises into the radius and handles 0 and 1 nodes', () => {
  const g = bigGraph(60);
  const pos = forceLayout(g.nodes(), g.relations(), { radius: 25 });
  const far = Math.max(...[...pos.values()].map((p) => Math.hypot(p.x, p.y, p.z)));
  assert.ok(Math.abs(far - 25) < 1e-6 || far <= 25 + 1e-6, `farthest ${far}`);
  assert.ok([...pos.values()].every(finite));
  assert.equal(forceLayout([], []).size, 0);
  assert.deepEqual([...forceLayout(g.nodes().slice(0, 1), []).values()], [{ x: 0, y: 0, z: 0 }]);
});

test('[U-layout-3] linked nodes end closer than unlinked ones', () => {
  const g = bigGraph(200);
  const pos = forceLayout(g.nodes(), g.relations());
  const linked = g.relations().map((r) => dist(pos.get(r.from)!, pos.get(r.to)!));
  const ids = g.nodes().map((n) => n.id);
  const random = ids.slice(0, 150).map((id, i) => dist(pos.get(id)!, pos.get(ids[(i * 37 + 11) % ids.length]!)!));
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  assert.ok(mean(linked) < mean(random) * 0.8, `${mean(linked)} vs ${mean(random)}`);
});

test('[U-layout-4] 500 nodes lay out in ≤ 50 ms', () => {
  const g = bigGraph(500);
  forceLayout(g.nodes(), g.relations()); // warm the JIT
  const times: number[] = [];
  for (let i = 0; i < 7; i++) {
    const t = performance.now();
    forceLayout(g.nodes(), g.relations(), { seed: String(i) });
    times.push(performance.now() - t);
  }
  // Best of 7: the unit files run in parallel, and contention only ever adds time, so the minimum
  // is the honest measure of the code's own cost.
  times.sort((a, b) => a - b);
  assert.ok(times[0]! <= 50, `best ${times[0]!.toFixed(1)} ms, median ${times[3]!.toFixed(1)} ms`);
});

test('[U-layout-5] layoutFor keeps every authored seed position, in every lens', () => {
  const g = seedGraph();
  for (const p of g.perspectives()) {
    const pos = layoutFor(g, p.id);
    assert.equal(pos.size, 88);
    for (const [id, at] of Object.entries(p.positions!)) assert.deepEqual(pos.get(id), at, `${p.id}/${id}`);
  }
});

test('[U-layout-6] layoutFor is deterministic across graphs and returns copies', () => {
  const a = layoutFor(seedGraph(), 'cook');
  const b = layoutFor(seedGraph(), 'cook');
  assert.deepEqual(a, b);
  a.get('temperature')!.x = 9999;
  const g = seedGraph();
  layoutFor(g, 'cook').get('temperature')!.x = 9999;
  assert.notEqual(layoutFor(g, 'cook').get('temperature')!.x, 9999);
});

test('[U-layout-7] a new node is born beside its link target, holds authored nodes fixed, and is stable', () => {
  const run = () => {
    const g = seedGraph();
    const tea = g.addNode({ id: 'tea', label: 'Tea', facets: { cook: 'hot' } });
    g.addRelation({ from: tea.id, to: 'temperature' });
    return { g, pos: layoutFor(g, 'cook') };
  };
  const { g, pos } = run();
  const temp = g.getPerspective('cook')!.positions!.temperature!;
  assert.deepEqual(pos.get('temperature'), temp);
  const d = dist(pos.get('tea')!, temp);
  assert.ok(d > 3 && d < 16, `born ${d.toFixed(2)} u from Temperature`);
  assert.deepEqual(run().pos.get('tea'), pos.get('tea'), 'same position after a reload');
});

test('[U-layout-8] layoutFor without authored positions uses the visible relations, seeded by the perspective', () => {
  const doc = seedDoc();
  for (const p of doc.perspectives) delete p.positions;
  const g = createGraph(doc);
  const cook = layoutFor(g, 'cook');
  assert.equal(cook.size, 88);
  assert.ok([...cook.values()].every(finite));
  assert.notDeepEqual(cook, layoutFor(g, 'physicist'));
});

test('[U-layout-9] the layout cache drops on mutation', () => {
  const g = seedGraph();
  layoutFor(g, 'cook');
  g.addNode({ id: 'late', label: 'Late' });
  assert.ok(layoutFor(g, 'cook').has('late'));
});

test('[U-layout-10] seed positions follow §6: ring formula, flowchart offsets, cluster radii, orphan at rim', () => {
  const doc = seedDoc();
  const at = (lens: string, id: string) => doc.perspectives.find((p) => p.id === lens)!.positions![id]!;
  // Ring: A and Z exact to 0.01; Physicist ring is flat (no wobble): every stop is R from the centre in its plane.
  const a = ringPosition('cook', 0);
  assert.ok(dist(at('cook', 'road-a'), a) < 0.01);
  for (let i = 0; i < 26; i++) {
    const p = at('physicist', `road-${'abcdefghijklmnopqrstuvwxyz'[i]}`);
    assert.ok(Math.abs(dist(p, { x: 0, y: -110, z: 0 }) - 70) < 0.02, `stop ${i}`);
  }
  // Flowchart offsets: P4 = anchor + (0, −6); Q7 = anchor + (24, −20).
  assert.deepEqual(at('cook', 'p4'), { x: -60, y: -36, z: 50 });
  assert.deepEqual(at('child', 'q7'), { x: 134, y: -10, z: 60 });
  // Heat members sit inside the cluster radius; Energy (orphan under Cook) sits on the rim.
  const heat = { x: 0, y: 10, z: 0 };
  for (const id of ['temperature', 'heat', 'stove', 'ice']) assert.ok(dist(at('cook', id), heat) <= 36.02, id);
  assert.ok(Math.abs(dist(at('cook', 'energy'), heat) - 36) < 0.02);
});
