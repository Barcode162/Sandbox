import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreError, createGraph, emptyDoc, validateDoc } from '../../src/core/index.ts';
import type { GraphEvent } from '../../src/core/index.ts';
import { seedDoc, seedGraph } from './support/seed.ts';

function withEvents() {
  const g = createGraph();
  const events: GraphEvent[] = [];
  g.on((e) => events.push(e));
  return { g, events };
}

const isCode = (code: string) => (e: unknown) => e instanceof CoreError && e.code === code;

test('[U-graph-1] emptyDoc is a valid document with one "base" perspective', () => {
  const doc = emptyDoc('Mine');
  assert.equal(doc.meta.title, 'Mine');
  assert.deepEqual(doc.perspectives.map((p) => p.id), ['base']);
  assert.equal(validateDoc(doc).ok, true);
  assert.equal(createGraph().meta.title, 'Untitled memory');
});

test('[U-graph-2] addNode fills defaults, generates n_<base36> ids and fires node-added', () => {
  const { g, events } = withEvents();
  const a = g.addNode({ label: 'Kettle' });
  const b = g.addNode({ label: 'Cup' });
  assert.match(a.id, /^n_[0-9a-z]+$/);
  assert.notEqual(a.id, b.id);
  assert.deepEqual({ kind: a.kind, value: a.value, facets: a.facets, tags: a.tags }, { kind: 'concept', value: null, facets: {}, tags: [] });
  assert.ok(a.created > 0 && a.updated === a.created);
  assert.deepEqual(events.map((e) => e.type), ['node-added', 'node-added']);
  assert.equal(g.getNode(a.id), a);
  assert.equal(g.nodes().length, 2);
});

test('[U-graph-3] generated ids skip ids already taken', () => {
  const g = createGraph();
  g.addNode({ id: 'n_1', label: 'taken' });
  const fresh = g.addNode({ label: 'fresh' });
  assert.notEqual(fresh.id, 'n_1');
});

test('[U-graph-4] duplicate ids throw duplicate; missing ids throw not-found', () => {
  const g = createGraph();
  g.addNode({ id: 'x', label: 'X' });
  assert.throws(() => g.addNode({ id: 'x', label: 'again' }), isCode('duplicate'));
  assert.throws(() => g.updateNode('nope', { label: 'y' }), isCode('not-found'));
  assert.throws(() => g.removeNode('nope'), isCode('not-found'));
  assert.throws(() => g.addRelation({ from: 'x', to: 'nope' }), isCode('not-found'));
  assert.throws(() => g.removeRelation('nope'), isCode('not-found'));
  assert.throws(() => g.updatePerspective('nope', { label: 'y' }), isCode('not-found'));
  g.addRelation({ id: 'r', from: 'x', to: g.addNode({ label: 'Y' }).id });
  assert.throws(() => g.addRelation({ id: 'r', from: 'x', to: 'x' }), isCode('duplicate'));
});

test('[U-graph-5] invalid input throws invalid with the spec copy', () => {
  const g = createGraph();
  assert.throws(() => g.addNode({ label: '   ' }), (e: unknown) => isCode('invalid')(e) && (e as Error).message === 'Give it a name, even one word.');
  assert.throws(() => g.addNode({ label: 'Long', value: 'x'.repeat(501) }), (e: unknown) => (e as Error).message === 'Values hold up to 500 characters. Put longer text in a File.');
  assert.throws(() => g.addNode({ label: 'Lens', facets: { ghost: 1 } }), isCode('invalid'));
  assert.throws(() => g.addNode({ label: 'Bad', value: Number.NaN }), isCode('invalid'));
  const a = g.addNode({ label: 'A' }).id;
  const b = g.addNode({ label: 'B' }).id;
  assert.throws(() => g.addRelation({ from: a, to: a }), isCode('invalid'));
  assert.throws(() => g.addRelation({ from: a, to: b, weight: 0 }), isCode('invalid'));
  assert.throws(() => g.addRelation({ from: a, to: b, weight: 1.5 }), isCode('invalid'));
  assert.throws(() => g.addRelation({ from: a, to: b, type: 'flow', directed: false }), isCode('invalid'));
  assert.throws(() => g.addRelation({ from: a, to: b, branch: 'true' }), isCode('invalid'));
  assert.throws(() => g.addRelation({ from: a, to: b, perspectives: ['ghost'] }), isCode('invalid'));
});

test('[U-graph-6] relation defaults: association 0.5 undirected; chain and flow directed; flow branch next', () => {
  const g = createGraph();
  const a = g.addNode({ label: 'A' }).id, b = g.addNode({ label: 'B' }).id;
  const r1 = g.addRelation({ from: a, to: b });
  const r2 = g.addRelation({ from: a, to: b, type: 'chain' });
  const r3 = g.addRelation({ from: a, to: b, type: 'flow' });
  assert.deepEqual([r1.type, r1.weight, r1.directed], ['association', 0.5, false]);
  assert.equal(r2.directed, true);
  assert.deepEqual([r3.directed, r3.branch], [true, 'next']);
  assert.match(r1.id, /^r_[0-9a-z]+$/);
});

test('[U-graph-7] updateNode fires one node-updated with previous; snapshots never change', () => {
  const { g, events } = withEvents();
  const before = g.addNode({ label: 'Tea', value: 'hot', notes: 'n' });
  const after = g.updateNode(before.id, { value: 'cold', notes: undefined });
  assert.equal(before.value, 'hot');
  assert.equal(after.value, 'cold');
  assert.equal('notes' in after, false);
  assert.ok(after.updated > before.updated || after.updated === before.updated);
  const ev = events.at(-1)!;
  assert.equal(ev.type, 'node-updated');
  if (ev.type === 'node-updated') { assert.equal(ev.previous, before); assert.equal(ev.node, after); }
  assert.equal(events.length, 2);
  assert.ok(Object.isFrozen(after) && Object.isFrozen(after.facets) && Object.isFrozen(after.tags));
  assert.throws(() => g.updateNode(before.id, { id: 'other' } as never), isCode('invalid'));
});

test('[U-graph-14] units are carried through add/update and validated', () => {
  const g = createGraph();
  g.addPerspective({ id: 'cook', label: 'Cook' });
  const t = g.addNode({ label: 'Temp', value: 20, units: { cook: '°C', '*': 'K' } });
  assert.deepEqual(t.units, { cook: '°C', '*': 'K' });
  assert.ok(Object.isFrozen(t.units));
  assert.deepEqual(g.updateNode(t.id, { units: { cook: '°F' } }).units, { cook: '°F' });
  assert.equal('units' in g.updateNode(t.id, { units: undefined }), false);
  assert.throws(() => g.addNode({ label: 'X', units: { chef: '°C' } }), isCode('invalid'));
  assert.throws(() => g.addNode({ label: 'X', units: { cook: '' } }), isCode('invalid'));
  assert.throws(() => g.addNode({ label: 'X', units: { cook: 5 as unknown as string } }), isCode('invalid'));
});

test('[U-graph-8] removeNode cascades: one node-removed event carrying the removed relations', () => {
  const { g, events } = withEvents();
  const a = g.addNode({ label: 'A' }).id, b = g.addNode({ label: 'B' }).id, c = g.addNode({ label: 'C' }).id;
  const ab = g.addRelation({ from: a, to: b });
  const ca = g.addRelation({ from: c, to: a });
  const bc = g.addRelation({ from: b, to: c });
  events.length = 0;
  g.removeNode(a);
  assert.equal(events.length, 1);
  const ev = events[0]!;
  assert.equal(ev.type, 'node-removed');
  if (ev.type === 'node-removed') assert.deepEqual(ev.relations.map((r) => r.id).sort(), [ab.id, ca.id].sort());
  assert.deepEqual(g.relations().map((r) => r.id), [bc.id]);
  assert.deepEqual(g.relationsOf(b).map((r) => r.id), [bc.id]);
  assert.equal(g.relationsOf(a).length, 0);
});

test('[U-graph-9] relation update/remove fire relation-updated (with previous) and relation-removed', () => {
  const { g, events } = withEvents();
  const a = g.addNode({ label: 'A' }).id, b = g.addNode({ label: 'B' }).id;
  const r = g.addRelation({ from: a, to: b, label: 'x' });
  const r2 = g.updateRelation(r.id, { weight: 0.9, label: undefined });
  assert.equal(r2.weight, 0.9);
  assert.equal('label' in r2, false);
  g.removeRelation(r.id);
  assert.deepEqual(events.map((e) => e.type), ['node-added', 'node-added', 'relation-added', 'relation-updated', 'relation-removed']);
  const up = events[3]!;
  if (up.type === 'relation-updated') assert.equal(up.previous, r);
  assert.equal(g.getRelation(r.id), undefined);
});

test('[U-graph-10] relationsOf returns both directions; findByLabel is trimmed, case-insensitive, exact case first', () => {
  const g = seedGraph();
  assert.equal(g.findByLabel('  boiling point ')?.id, 'boiling-point');
  assert.equal(g.findByLabel('I')?.id, 'road-i');
  assert.equal(g.findByLabel('i')?.id, 'var-i');
  assert.equal(g.findByLabel('nothing'), undefined);
  // Temperature: 10 relates + 2 reads, touching it from either end.
  assert.equal(g.relationsOf('temperature').length, 12);
});

test('[U-graph-11] perspectives: add (duplicate → error), update fires perspective-updated', () => {
  const { g, events } = withEvents();
  g.addPerspective({ id: 'cook', label: 'Cook' });
  assert.throws(() => g.addPerspective({ id: 'cook', label: 'Again' }), isCode('duplicate'));
  const p = g.updatePerspective('cook', { accent: '#FF9F5A', positions: { } });
  assert.equal(p.accent, '#FF9F5A');
  assert.deepEqual(g.perspectives().map((x) => x.id), ['base', 'cook']);
  assert.deepEqual(events.map((e) => e.type), ['perspective-added', 'perspective-updated']);
  assert.throws(() => g.updatePerspective('cook', { label: '' }), isCode('invalid'));
});

test('[U-graph-12] load replaces everything and fires reset; unsubscribe stops events', () => {
  const g = createGraph();
  const events: string[] = [];
  const off = g.on((e) => events.push(e.type));
  g.load(seedDoc());
  assert.equal(g.nodes().length, 88);
  assert.equal(g.meta.defaultPerspective, 'cook');
  off();
  g.addNode({ label: 'quiet' });
  assert.deepEqual(events, ['reset']);
});

test('[U-graph-13] the store is isolated from the document it was built from', () => {
  const doc = seedDoc();
  const g = createGraph(doc);
  doc.nodes[0]!.label = 'mutated';
  assert.equal(g.getNode(doc.nodes[0]!.id)!.label, 'Temperature');
  assert.throws(() => { (g.nodes() as unknown as unknown[]).push(1); });
});
