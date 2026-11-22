import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disagrees, facetsOf, formatValue, isRelationVisible, resolveValue, visibleRelations } from '../../src/core/index.ts';
import type { MemoryNode } from '../../src/core/index.ts';
import { seedGraph } from './support/seed.ts';

const node = (facets: MemoryNode['facets'], value: MemoryNode['value'] = 'base'): MemoryNode =>
  ({ id: 'x', label: 'X', kind: 'concept', value, facets, tags: [], created: 0, updated: 0 });
const P = [{ id: 'cook', label: 'Cook' }, { id: 'physicist', label: 'Physicist' }, { id: 'child', label: 'Child' }];

test('[U-perspectives-1] resolveValue: own facet wins, a null facet is still a facet, missing falls back', () => {
  const n = node({ cook: 20, child: null });
  assert.equal(resolveValue(n, 'cook'), 20);
  assert.equal(resolveValue(n, 'child'), null);
  assert.equal(resolveValue(n, 'physicist'), 'base');
  assert.equal(resolveValue(node({}), 'toString'), 'base', 'prototype keys are not facets');
});

test('[U-perspectives-2] facetsOf: one view per perspective, in order, marking own vs fallback', () => {
  assert.deepEqual(facetsOf(node({ physicist: 293 }), P), [
    { perspective: 'cook', value: 'base', own: false },
    { perspective: 'physicist', value: 293, own: true },
    { perspective: 'child', value: 'base', own: false },
  ]);
});

test('[U-perspectives-8] facetsOf fills unit from units[lens] ?? units["*"]; formatValue reads it', () => {
  const n = { ...node({ cook: 20, physicist: 293 }), units: { physicist: 'K', '*': '°C' } };
  assert.deepEqual(facetsOf(n, P).map((f) => f.unit), ['°C', 'K', '°C']);
  assert.equal('unit' in facetsOf(node({}), P)[0]!, false);
  const g = seedGraph();
  assert.deepEqual(facetsOf(g.getNode('temperature')!, g.perspectives()).map((f) => formatValue(f.value, f.unit)), ['20 °C', '293 K', '2 · warm']);
  assert.equal(formatValue('hot', 'K'), 'hot', 'units attach to numbers only');
  assert.equal(formatValue(null), 'empty');
});

test('[U-perspectives-3] disagrees compares resolved values strictly', () => {
  assert.equal(disagrees(node({ cook: 1, physicist: 1, child: 1 }), P), false);
  assert.equal(disagrees(node({ cook: 1, physicist: '1' }), P), true);
  assert.equal(disagrees(node({ cook: 'base' }), P), false, 'a facet equal to the base value agrees');
  assert.equal(disagrees(node({ cook: 1 }), P.slice(0, 1)), false);
});

test('[U-perspectives-4] the seed has exactly 14 disagreeing nodes (§5 ◆)', () => {
  const g = seedGraph();
  const ids = g.nodes().filter((n) => disagrees(n, g.perspectives())).map((n) => n.label).sort();
  assert.deepEqual(ids, ['Boiling Point', 'Burn', 'Flame Step', 'Heat', 'Room', 'Safe To Touch', 'Soup', 'Steam', 'Temperature', 'boiling-curve.csv', 'drawing-of-a-sun.png', 'limit', 'recipe.txt', 'unit'].sort());
});

test('[U-perspectives-5] relation visibility: absent → every lens; listed → only those', () => {
  const r = { id: 'r', from: 'a', to: 'b', type: 'association' as const, weight: 1, directed: false, created: 0 };
  assert.equal(isRelationVisible(r, 'anything'), true);
  assert.equal(isRelationVisible({ ...r, perspectives: ['physicist', 'cook'] }, 'cook'), true);
  assert.equal(isRelationVisible({ ...r, perspectives: ['physicist', 'cook'] }, 'child'), false);
});

test('[U-perspectives-6] seed visible line counts: Cook 100, Physicist 102, Child 98', () => {
  const g = seedGraph();
  assert.equal(g.relations().length, 110);
  assert.equal(visibleRelations(g, 'cook').length, 100);
  assert.equal(visibleRelations(g, 'physicist').length, 102);
  assert.equal(visibleRelations(g, 'child').length, 98);
});

test('[U-perspectives-7] Energy has no visible lines under Cook and Child, and Temperature hides 2 under Cook', () => {
  const g = seedGraph();
  const lines = (id: string, lens: string) => g.relationsOf(id).filter((r) => isRelationVisible(r, lens)).length;
  assert.equal(lines('energy', 'cook'), 0);
  assert.equal(lines('energy', 'child'), 0);
  assert.equal(lines('energy', 'physicist'), 1);
  assert.equal(lines('temperature', 'cook'), 10);
  assert.equal(g.relationsOf('temperature').length - lines('temperature', 'cook'), 2);
});
