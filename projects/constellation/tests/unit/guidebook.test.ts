// [U-guidebook] The Guidebook example memory (M-0003): it is exactly its source's output, it opens
// cleanly, and every answer its "Try" notes promise is true under the lens they name.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareRoutes, createGraph, exportJson, retrieve, runPathway, validateDoc } from '../../src/core/index.ts';
import { buildGuidebook, GUIDE_LENSES } from './support/guidebook-source.ts';

const TEXT = readFileSync(new URL('../../src/seed/guidebook.json', import.meta.url), 'utf8');
const graph = () => {
  const v = validateDoc(JSON.parse(TEXT));
  assert.ok(v.ok, v.ok ? '' : JSON.stringify(v.errors.slice(0, 3)));
  assert.deepEqual(v.warnings, []);
  return createGraph(v.doc);
};

test('[U-guidebook-1] src/seed/guidebook.json is exactly the output of guidebook-source.ts, in export form', () => {
  assert.equal(TEXT, JSON.stringify(buildGuidebook(), null, 2) + '\n', 'run: node tests/unit/support/write-guidebook.ts');
  assert.equal(exportJson(graph()), TEXT);
});

test('[U-guidebook-2] it is a lot of everyday data: ≥ 140 lights in ≥ 10 clusters, every kind present, 3 time lenses', () => {
  const g = graph();
  assert.ok(g.nodes().length >= 140, `${g.nodes().length} lights`);
  assert.ok(g.relations().length >= 240, `${g.relations().length} lines`);
  const clusters = new Set(g.nodes().map((n) => n.tags[0]));
  assert.ok(clusters.size >= 10, [...clusters].join(','));
  for (const kind of ['concept', 'variable', 'file', 'note', 'pathway']) assert.ok(g.nodes().some((n) => n.kind === kind), kind);
  assert.deepEqual(g.perspectives().map((p) => p.label), ['Today', 'Last year', 'Next year']);
  // Every lens has an authored position for every light (no force-layout fallback, no NaN).
  for (const p of g.perspectives()) for (const n of g.nodes()) {
    const at = p.positions?.[n.id];
    assert.ok(at && [at.x, at.y, at.z].every(Number.isFinite), `${p.id}:${n.id}`);
  }
});

test('[U-guidebook-3] the route Idea → Launch is 13 → 3 today and next year, and longer last year (no client yet)', () => {
  const g = graph();
  const hops = (lens: string) => compareRoutes(g, 't-idea', 't-launch', { perspective: lens });
  for (const lens of ['today', 'next-year']) {
    const r = hops(lens);
    assert.equal(r.declared?.hops, 13);
    assert.equal(r.shortest?.hops, 3);
    assert.ok(r.shortest?.nodes.includes('coop'), 'goes through the Riverside Co-op');
  }
  const last = hops('last-year');
  assert.equal(last.declared?.hops, 13);
  assert.ok((last.shortest?.hops ?? 0) > 3 && !last.shortest?.nodes.includes('coop'), `last year: ${last.shortest?.hops}`);
});

test('[U-guidebook-4] one rule, three truths: each pathway answers differently in each lens', () => {
  const g = graph();
  const run = (start: string) => GUIDE_LENSES.map((l) => {
    const t = runPathway(g, start, l);
    assert.equal(t.status, 'ended', `${start}@${l}: ${t.error ?? ''}`);
    return t.result;
  });
  assert.deepEqual(run('a1'), [
    'Not yet: 400 USD short of keeping the emergency fund.',
    'Not yet: 2300 USD short of keeping the emergency fund.',
    'Book it: 3700 USD left after the trip.',
  ]);
  assert.deepEqual(run('m1'), ['Ready in 2 months, with 4900 USD saved.', 'Ready in 10 months, with 5100 USD saved.', 'Ready in 0 months, with 7000 USD saved.']);
  assert.deepEqual(run('c1'), ['Member pays 75.6 USD, free shipping.', 'Guest pays 69.4 USD with shipping.', 'Member pays 86.4 USD, free shipping.']);
});

test('[U-guidebook-5] every word the "Try: ask by a word" note suggests finds something, in every lens', () => {
  const g = graph();
  const words = ['tax', 'Sam', 'garden', 'insurance', 'pdf', 'passport', 'deadline', 'Lisbon', 'money', 'renew'];
  const tryNote = g.getNode('g-search')!.notes!;
  for (const w of words) {
    assert.ok(tryNote.includes(w), `note mentions ${w}`);
    for (const lens of GUIDE_LENSES) {
      const r = retrieve(g, w, { perspective: lens });
      assert.ok(r.matches.length >= 2, `${w}@${lens}: ${r.matches.length} matches`);
      assert.ok(r.activations.some((a) => a.depth === 1), `${w}@${lens}: lights a neighbourhood`);
    }
  }
});

test('[U-guidebook-7] the example routes the guide names go through real things, never through the guide or the Files hub', () => {
  const g = graph();
  for (const lens of GUIDE_LENSES) for (const [a, b] of [['sam', 'tax-return'], ['laptop', 'trip'], ['t-idea', 't-launch']] as const) {
    const r = compareRoutes(g, a, b, { perspective: lens });
    assert.ok(r.shortest && r.shortest.hops >= 3, `${a}→${b}@${lens}: ${r.shortest?.hops}`);
    assert.ok(!r.shortest.nodes.some((id) => id.startsWith('g-') || id === 'files'), `${a}→${b}@${lens}: ${r.shortest.nodes.join(',')}`);
  }
});

test('[U-guidebook-6] the time lenses disagree where the guide says they do', () => {
  const g = graph();
  const at = (id: string) => GUIDE_LENSES.map((l) => g.getNode(id)!.facets[l]);
  assert.deepEqual(at('rent'), [1200, 1150, 1260]);
  assert.deepEqual(at('sam'), ['Teammate on Garden app', 'Classmate from the night course', 'Co-founder']);
  assert.deepEqual(at('garden'), ['Prototype', 'Idea on a napkin', 'Launched to 3 co-ops']);
  assert.deepEqual(at('tax-pct'), [5, 4, 8]);
  // No secrets are stored: anything about passwords points to where they live instead.
  for (const n of g.nodes()) assert.ok(!/password\s*[:=]/i.test(`${n.value ?? ''} ${n.notes ?? ''}`), n.id);
});
