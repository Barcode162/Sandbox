import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { AUTOSAVE_KEY, createGraph, exportDoc, exportJson, importJson, layoutFor, learnShortcut, loadSaved, runPathway, shortestPath, startAutosave, validateDoc } from '../../src/core/index.ts';
import type { KeyValueStorage, ValidationIssue } from '../../src/core/index.ts';
import { SEED_TEXT, seedDoc, seedGraph } from './support/seed.ts';
import { buildSeed } from './support/seed-source.ts';

class FakeStorage implements KeyValueStorage {
  map = new Map<string, string>();
  writes = 0;
  failWith: Error | null = null;
  getItem(key: string) { return this.map.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWith) throw this.failWith;
    this.writes++;
    this.map.set(key, value);
  }
  removeItem(key: string) { this.map.delete(key); }
}

test('[U-persistence-1] the seed validates with no warnings: 88 nodes, 110 relations, 3 lenses, Cook first', () => {
  const res = validateDoc(JSON.parse(SEED_TEXT));
  assert.ok(res.ok, JSON.stringify(!res.ok && res.errors));
  assert.deepEqual(res.warnings, []);
  assert.equal(res.doc.nodes.length, 88);
  assert.equal(res.doc.relations.length, 110);
  assert.deepEqual(res.doc.perspectives.map((p) => p.label), ['Cook', 'Physicist', 'Child']);
  assert.equal(res.doc.meta.defaultPerspective, 'cook');
  for (const p of res.doc.perspectives) assert.equal(Object.keys(p.positions!).length, 88, p.id);
});

test('[U-persistence-2] src/seed/memory.json is exactly the output of tests/unit/support/seed-source.ts', () => {
  assert.equal(SEED_TEXT, JSON.stringify(buildSeed(), null, 2) + '\n', 'run: node tests/unit/support/write-seed.ts');
});

test('[U-persistence-3] the seed file is already in export form: export(import(seed)) is byte-identical', () => {
  assert.equal(exportJson(seedGraph()), SEED_TEXT);
});

test('[U-persistence-4] export → import round-trips deep-equal, including edits', () => {
  const g = seedGraph();
  const tea = g.addNode({ label: 'Tea', facets: { cook: 'hot' }, units: { '*': '°C', child: '· warm' }, kind: 'file', file: { name: 'tea.txt', path: '/k/tea.txt', content: 'Steep 4 min.' } });
  g.addRelation({ from: tea.id, to: 'temperature', label: 'relates' });
  learnShortcut(g, shortestPath(g, 'road-a', 'road-z', { perspective: 'cook' })!);
  const doc = exportDoc(g);
  const res = importJson(exportJson(g));
  assert.ok(res.ok);
  assert.deepEqual(res.doc, doc);
  assert.deepEqual(exportDoc(createGraph(res.doc)), doc);
  assert.deepEqual(res.doc.nodes.find((n) => n.label === 'Tea')!.units, { '*': '°C', child: '· warm' });
  assert.deepEqual(res.doc.nodes.find((n) => n.id === 'temperature')!.units, { physicist: 'K', cook: '°C', child: '· warm' });
});

/** Each case: a mutation of the seed, the issue path, and a fragment of the sentence. */
const BROKEN: Array<[string, (d: any) => unknown, string, RegExp]> = [
  ['not an object', () => [1, 2], '', /isn't a Constellation memory \(it holds a list, not an object\)/],
  ['missing nodes', (d) => { delete d.nodes; }, 'nodes', /^That file isn't a Constellation memory \(missing "nodes"\)\.$/],
  ['wrong schema', (d) => { d.schema = 'photos'; }, 'schema', /its schema is "photos"/],
  ['newer version', (d) => { d.version = 3; }, 'version', /^This memory is from a newer version \(v3\)\. Update the app to open it\.$/],
  ['node without label', (d) => { d.nodes[3].label = ''; }, 'nodes[3].label', /^nodes\[3\] has no label\. Give it a name, even one word\.$/],
  ['duplicate node id', (d) => { d.nodes[5].id = d.nodes[2].id; }, 'nodes[5].id', /nodes\[5\] \("Heat"\) uses the id "flame-step", which nodes\[2\] already has/],
  ['bad kind', (d) => { d.nodes[0].kind = 'gadget'; }, 'nodes[0].kind', /nodes\[0\] \("Temperature"\) has the kind "gadget"\. Use one of: concept, variable, file, note, pathway\./],
  ['facet for unknown lens', (d) => { d.nodes[0].facets.chef = 1; }, 'nodes[0].facets.chef', /value for the perspective "chef", which doesn't exist/],
  ['object value', (d) => { d.nodes[1].value = { k: 1 }; }, 'nodes[1].value', /The value of nodes\[1\] \("Boiling Point"\) is an object\. Values are text, numbers, true\/false or null\./],
  ['dangling relation', (d) => { d.relations[0].to = 'ghost'; }, 'relations[0].to', /relations\[0\] ends at "ghost", but no node has that id\./],
  ['weight out of range', (d) => { d.relations[1].weight = 2; }, 'relations[1].weight', /weight 2\. A weight is a number above 0 and at most 1/],
  ['undirected flow', (d) => { d.relations.find((r: any) => r.type === 'flow').directed = false; }, 'relations[91].directed', /pathway \(flow\) line, so it must be directed/],
  ['lens-only line for unknown lens', (d) => { d.relations[6].perspectives = ['astronaut']; }, 'relations[6].perspectives[0]', /appears in the perspective "astronaut"/],
  ['bad expression', (d) => { d.nodes.find((n: any) => n.id === 'p4').pathway.expr = 'heat <'; }, 'nodes[77].pathway.expr', /has an expression that can't be read: Expected a value at column 7\./],
  ['reserved variable', (d) => { d.nodes.find((n: any) => n.id === 'p3').pathway.target = '__proto__'; }, 'nodes[76].pathway.target', /writes to "__proto__"/],
  ['position for unknown node', (d) => { d.perspectives[1].positions.ghost = { x: 0, y: 0, z: 0 }; }, 'perspectives[1].positions.ghost', /\("Physicist"\) places "ghost", but no node has that id\./],
  ['default lens missing', (d) => { d.meta.defaultPerspective = 'chef'; }, 'meta.defaultPerspective', /opens in the perspective "chef", which doesn't exist/],
  ['featured pathway is not a start', (d) => { d.meta.featured.pathway = 'p4'; }, 'meta.featured.pathway', /isn't the start of a pathway/],
  ['file content too big', (d) => { d.nodes[16].file.content = 'x'.repeat(70 * 1024); }, 'nodes[16].file.content', /70 KB of file text; the limit is 64 KB/],
  ['unit for unknown lens', (d) => { d.nodes[0].units.chef = '°F'; }, 'nodes[0].units.chef', /has a unit for the perspective "chef", which doesn't exist/],
  ['unit not text', (d) => { d.nodes[0].units.cook = 5; }, 'nodes[0].units.cook', /"cook" unit that isn't text\. A unit is short text like "°C"\./],
  ['units not an object', (d) => { d.nodes[1].units = ['K']; }, 'nodes[1].units', /"units" that aren't an object of perspective id → unit text/],
  ['accent injection (F-002)', (d) => { d.perspectives[0].accent = 'red;background:url(x)'; }, 'perspectives[0].accent', /\("Cook"\) has the accent colour "red;background:url\(x\)"\. Use a hex colour like "#FF9F5A" or "#f95", or leave it out\./],
  ['accent named colour (F-002)', (d) => { d.perspectives[1].accent = 'blue'; }, 'perspectives[1].accent', /Use a hex colour/],
  ['value too long', (d) => { d.nodes[9].value = 'x'.repeat(501); }, 'nodes[9].value', /is 501 characters long\. Values hold up to 500 characters\. Put longer text in a File\./],
];

test(`[U-persistence-5] ${BROKEN.length} broken documents each name a path and say what to do in a sentence`, () => {
  for (const [name, mutate, path, pattern] of BROKEN) {
    const d: any = JSON.parse(SEED_TEXT);
    const replaced = mutate(d);
    const res = validateDoc(replaced === undefined ? d : replaced);
    assert.equal(res.ok, false, name);
    if (res.ok) continue;
    const hit: ValidationIssue | undefined = res.errors.find((e) => e.path === path);
    assert.ok(hit, `${name}: no error at "${path}", got ${JSON.stringify(res.errors)}`);
    assert.match(hit.message, pattern, name);
    assert.match(hit.message, /^[A-Z"a-z].*[.)]$/, `${name}: a sentence`);
    assert.doesNotMatch(hit.message, /undefined|\[object|ValidationError|required/i, name);
  }
});

test('[U-persistence-6] importJson explains bad JSON and empty files; unknown keys are warnings', () => {
  const bad = importJson('{"schema": "constellation.memory",');
  assert.equal(bad.ok, false);
  if (!bad.ok) { assert.equal(bad.errors[0]!.path, ''); assert.match(bad.errors[0]!.message, /^That file isn't valid JSON, so it can't be a Constellation memory \(.+\)\.$/); }
  const empty = importJson('  ');
  assert.equal(empty.ok, false);
  const d = JSON.parse(SEED_TEXT);
  d.colour = 'blue';
  d.nodes[0].mood = 'calm';
  const res = validateDoc(d);
  assert.ok(res.ok);
  assert.deepEqual(res.warnings.map((w) => w.path), ['colour', 'nodes[0].mood']);
  assert.equal('mood' in res.doc.nodes[0]!, false, 'unknown fields are dropped');
});

test('[U-persistence-7] deleting a node that a pathway reads still exports a loadable memory', () => {
  const g = seedGraph();
  g.removeNode('temperature');
  g.removeNode('road-a');
  const res = importJson(exportJson(g));
  assert.ok(res.ok, JSON.stringify(!res.ok && res.errors));
  assert.deepEqual(res.warnings.map((w) => w.path), ['nodes[73].pathway.source', 'nodes[80].pathway.source']);
  assert.match(res.warnings[0]!.message, /reads "temperature", which isn't in this memory any more\. Running the pathway will stop there\./);
  assert.equal(res.doc.meta.featured!.route, undefined, 'a featured route to a deleted node is dropped');
  assert.equal(res.doc.perspectives[0]!.positions!.temperature, undefined);
});

test('[U-persistence-8] loadSaved: null when empty, the doc when saved, a sentence when storage is blocked', () => {
  const s = new FakeStorage();
  assert.equal(loadSaved(s), null);
  s.setItem(AUTOSAVE_KEY, SEED_TEXT);
  const res = loadSaved(s);
  assert.ok(res && res.ok);
  assert.deepEqual(res.doc, seedDoc());
  s.setItem('other', '{nope');
  assert.equal(loadSaved(s, 'other')!.ok, false);
  const blocked: KeyValueStorage = { getItem() { throw new Error('SecurityError'); }, setItem() {}, removeItem() {} };
  const b = loadSaved(blocked)!;
  assert.equal(b.ok, false);
  if (!b.ok) assert.match(b.errors[0]!.message, /Couldn't read this browser's storage/);
});

test('[U-persistence-9] autosave debounces (400 ms), flushes once on stop, then stays quiet', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const g = seedGraph();
    const s = new FakeStorage();
    const stop = startAutosave(g, s);
    g.addNode({ id: 'tea', label: 'Tea' });
    mock.timers.tick(300);
    g.updateNode('tea', { value: 'hot' });
    mock.timers.tick(399);
    assert.equal(s.writes, 0, 'no save mid-typing');
    mock.timers.tick(1);
    assert.equal(s.writes, 1);
    const saved = importJson(s.getItem(AUTOSAVE_KEY)!);
    assert.ok(saved.ok && saved.doc.nodes.some((n) => n.id === 'tea' && n.value === 'hot'));
    g.addNode({ id: 'cup', label: 'Cup' });
    stop();
    assert.equal(s.writes, 2, 'pending change flushed on stop');
    stop();
    g.addNode({ id: 'late', label: 'Late' });
    mock.timers.tick(1000);
    assert.equal(s.writes, 2, 'stopped');
    const custom = new FakeStorage();
    const stop2 = startAutosave(g, custom, { key: 'k', debounceMs: 50 });
    g.removeNode('late');
    mock.timers.tick(50);
    assert.ok(custom.getItem('k'));
    stop2();
  } finally {
    mock.timers.reset();
  }
});

test('[U-persistence-10] autosave surfaces quota errors through onError and keeps going', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const g = seedGraph();
    const s = new FakeStorage();
    const errors: unknown[] = [];
    const quota = Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' });
    s.failWith = quota;
    const stop = startAutosave(g, s, { onError: (e) => errors.push(e) });
    g.addNode({ label: 'Big' });
    mock.timers.tick(400);
    assert.deepEqual(errors, [quota]);
    s.failWith = null;
    g.addNode({ label: 'Small' });
    mock.timers.tick(400);
    assert.equal(s.writes, 1, 'recovers once storage frees up');
    stop();
  } finally {
    mock.timers.reset();
  }
});

test('[U-persistence-11] F-002: accents accept #rgb and #rrggbb only', () => {
  for (const ok of ['#f95', '#FF9F5A', '#abc', '#0a0B0c']) {
    const d = JSON.parse(SEED_TEXT); d.perspectives[0].accent = ok;
    assert.equal(validateDoc(d).ok, true, ok);
  }
  for (const bad of ['#ff', '#ff9f5a00', 'ff9f5a', '#ggg', 'rgb(1,2,3)', '#fff;x', ' #fff', 5]) {
    const d = JSON.parse(SEED_TEXT); d.perspectives[0].accent = bad;
    assert.equal(validateDoc(d).ok, false, String(bad));
  }
});

test('[U-persistence-12] F-010: ids named __proto__ keep their positions, facets and units through import and export', () => {
  const text = SEED_TEXT
    .replaceAll('"temperature"', '"__proto__"')
    .replace('"perspectives": [', '"perspectives": [\n    { "id": "constructor", "label": "Odd lens" },');
  const res = importJson(text);
  assert.ok(res.ok, JSON.stringify(!res.ok && res.errors));
  const node = res.doc.nodes.find((n) => n.label === 'Temperature')!;
  assert.equal(node.id, '__proto__');
  assert.ok(Object.prototype.hasOwnProperty.call(res.doc.perspectives[1]!.positions!, '__proto__'));
  assert.equal(Object.getPrototypeOf(res.doc.perspectives[1]!.positions!), Object.prototype, 'the prototype is untouched');
  const g = createGraph(res.doc);
  assert.deepEqual(layoutFor(g, 'cook').get('__proto__'), res.doc.perspectives[1]!.positions!['__proto__']);
  assert.deepEqual(layoutFor(g, 'constructor').size, 88, 'a lens without positions lays out every node');
  assert.equal(runPathway(g, 'p1', 'cook').result, 'Done after 2 stirs · heat 100 °C', 'read source "__proto__" still resolves');
  const again = importJson(exportJson(g));
  assert.ok(again.ok);
  assert.deepEqual(again.doc, res.doc);
});
