import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGraph, forceLayout, layoutFor } from '../../src/core/index.ts';
import { bigGraph, seedDoc, seedGraph } from './support/seed.ts';
import { ringPosition } from './support/seed-source.ts';
import { defaultView, LABEL_CLEARANCE, nodeRadius } from './support/view.ts';

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
  // Ring: every stop matches ringPosition to 0.01 (the formula is tested in U-layout-11).
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach((l, i) => {
    for (const lens of ['cook', 'physicist', 'child'] as const) assert.ok(dist(at(lens, `road-${l}`), ringPosition(lens, i)) < 0.01, `${lens} ${l}`);
  });
  // Flowchart offsets: P4 = anchor + (0, −6); Q7 = anchor + (24, −20).
  assert.deepEqual(at('cook', 'p4'), { x: -60, y: -36, z: 50 });
  assert.deepEqual(at('child', 'q7'), { x: 134, y: -10, z: 60 });
  // Heat members sit inside the cluster bound; Energy (orphan under Cook) sits on the rim.
  const heat = { x: 0, y: 10, z: 0 };
  // (F-030 spreads clusters for the camera within 1.3 × the radius.)
  for (const id of ['temperature', 'heat', 'stove', 'ice']) assert.ok(dist(at('cook', id), heat) <= 36 * 1.3 + 0.02, id);
  assert.ok(dist(at('cook', 'energy'), heat) >= 36 * 0.9, 'Energy stays at the rim');
});

test('[U-layout-11] F-016: in every lens the learned A–Z line crosses the ring centre, A–F cuts the interior, laps never touch', () => {
  const doc = seedDoc();
  const RING = { cook: { c: { x: 0, y: -140, z: -30 }, tilt: 25, R: 70 }, physicist: { c: { x: 0, y: -110, z: 0 }, tilt: 12, R: 70 }, child: { c: { x: 40, y: -100, z: 0 }, tilt: 35, R: 55 } };
  for (const [lens, ring] of Object.entries(RING)) {
    const pos = doc.perspectives.find((p) => p.id === lens)!.positions!;
    // Back into the ring's own plane (undo the tilt), centre at the origin.
    const flat = (l: string) => { const p = pos[`road-${l}`]!; return { x: p.x - ring.c.x, z: (p.z - ring.c.z) / Math.cos((ring.tilt * Math.PI) / 180) }; };
    const segToCentre = (a: { x: number; z: number }, b: { x: number; z: number }) => {
      const dx = b.x - a.x, dz = b.z - a.z;
      const u = Math.max(0, Math.min(1, -(a.x * dx + a.z * dz) / (dx * dx + dz * dz)));
      return Math.hypot(a.x + u * dx, a.z + u * dz);
    };
    const A = flat('a'), F = flat('f'), Z = flat('z');
    const angle = Math.abs(Math.atan2(A.z, A.x) - Math.atan2(Z.z, Z.x)) * (180 / Math.PI);
    assert.ok(Math.abs(angle - 180) < 5, `${lens}: A and Z ${angle.toFixed(0)}° apart`);
    assert.ok(segToCentre(A, Z) < 0.1 * ring.R, `${lens}: A–Z passes the centre`);
    assert.ok(segToCentre(A, F) < 0.65 * ring.R, `${lens}: A–F crosses the interior`);
    const L = 'abcdefghijklmnopqrstuvwxyz'.split('');
    for (let i = 0; i < 26; i++) for (let j = i + 2; j < 26; j++) {
      const p = flat(L[i]!), q = flat(L[j]!);
      assert.ok(Math.hypot(p.x - q.x, p.z - q.z) > 15, `${lens}: ${L[i]} and ${L[j]} too close`);
    }
  }
});

test('[U-layout-12] F-030: at the default view, Heat neighbours clear 1.6 × node radius + a label, and the ring clears both flowcharts', () => {
  const doc = seedDoc();
  const g = seedGraph();
  const cluster = new Map(doc.nodes.map((n) => [n.id, n.tags[0]!]));
  const members = (c: string) => doc.nodes.filter((n) => cluster.get(n.id) === c).map((n) => n.id);
  const rMax = Math.max(...members('heat').map((id) => nodeRadius(g.relationsOf(id).length)));
  const minGap = 1.6 * rMax + LABEL_CLEARANCE; // ≈ 12.1 u
  const L = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (const p of doc.perspectives) {
    const v = defaultView(p.positions! as Record<string, { x: number; y: number; z: number }>);
    const heat = members('heat');
    for (let i = 0; i < heat.length; i++) for (let j = i + 1; j < heat.length; j++) {
      const a = v[heat[i]!]!, b = v[heat[j]!]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      assert.ok(d >= minGap, `${p.id}: ${heat[i]} and ${heat[j]} ${d.toFixed(1)} u apart (< ${minGap.toFixed(1)})`);
    }
    for (const chart of ['simmer', 'serve']) {
      const pts = members(chart).map((id) => v[id]!);
      const box = { x0: Math.min(...pts.map((q) => q.x)), x1: Math.max(...pts.map((q) => q.x)), y0: Math.min(...pts.map((q) => q.y)), y1: Math.max(...pts.map((q) => q.y)) };
      const gap = (q: { x: number; y: number }) => Math.hypot(Math.max(box.x0 - q.x, 0, q.x - box.x1), Math.max(box.y0 - q.y, 0, q.y - box.y1));
      // Every stop and every stretch of road between stops (sampled every 10%).
      for (let k = 0; k < 25; k++) for (let t = 0; t <= 10; t++) {
        const a = v[`road-${L[k]}`]!, b = v[`road-${L[k + 1]}`]!;
        const q = { x: a.x + ((b.x - a.x) * t) / 10, y: a.y + ((b.y - a.y) * t) / 10 };
        assert.ok(gap(q) >= 12, `${p.id}: the road ${L[k]}–${L[k + 1]} passes ${gap(q).toFixed(1)} u from the ${chart} flowchart`);
      }
    }
  }
});
