// Personal memories (src/memories/*.json, opened with ?memory=<name>; M-0003) must open cleanly:
// the "update constellations" command relies on this test to catch a broken update before publishing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createGraph, validateDoc } from '../../src/core/index.ts';

const dir = new URL('../../src/memories/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

test('[U-memories-1] every personal memory validates with no errors or warnings, and has a safe name', () => {
  assert.ok(files.length >= 1, 'at least one personal memory');
  for (const f of files) {
    assert.match(f, /^[a-z0-9-]{1,40}\.json$/, `${f}: name must match ?memory=<name>`);
    const res = validateDoc(JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
    assert.ok(res.ok, `${f}: ${res.ok ? '' : res.errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
    assert.deepEqual(res.warnings ?? [], [], `${f}: warnings`);
  }
});

test('[U-memories-2] every personal memory is one connected sky with readable values', () => {
  for (const f of files) {
    const res = validateDoc(JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
    if (!res.ok) continue;
    const g = createGraph(res.doc);
    const all = g.nodes();
    // One sky: every star is reachable from the first one (no islands), F-005.
    const seen = new Set<string>([all[0]!.id]);
    const queue = [all[0]!.id];
    while (queue.length) for (const r of g.relationsOf(queue.shift()!)) for (const id of [r.from, r.to]) if (!seen.has(id)) (seen.add(id), queue.push(id));
    assert.deepEqual(all.filter((n) => !seen.has(n.id)).map((n) => n.label), [], `${f}: stars not connected to the rest`);
    // Labels are unique (search and "find by name" pick one) and short enough to read (≤ 32).
    const labels = all.map((n) => n.label.toLowerCase());
    assert.deepEqual(labels.filter((l, i) => labels.indexOf(l) !== i), [], `${f}: duplicate labels`);
    for (const n of all) assert.ok(n.label.length <= 32, `${f}: label "${n.label}" is longer than 32`);
    for (const n of all) {
      assert.ok(g.relationsOf(n.id).length > 0, `${f}: ${n.label} has no lines`);
      for (const v of [n.value, ...Object.values(n.facets)]) if (typeof v === 'string') assert.ok(v.length <= 24, `${f}: "${v}" on ${n.label} is too long to read as a chip (≤ 24)`);
    }
  }
});
