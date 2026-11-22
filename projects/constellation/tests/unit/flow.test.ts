import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGraph, listPathways, pathwayNodes, runPathway, stepPathway } from '../../src/core/index.ts';
import type { MemoryGraph, Trace } from '../../src/core/index.ts';
import { seedGraph } from './support/seed.ts';

const heats = (t: Trace) => t.steps.filter((s) => s.nodeId === 'p4').map((s) => s.vars.heat);

test('[U-flow-1] listPathways: the two seeded start nodes, sorted by label', () => {
  assert.deepEqual(listPathways(seedGraph()).map((n) => n.label), ['Simmer until done', 'What should I do with it?']);
});

test('[U-flow-2] pathwayNodes: BFS over flow relations from the start', () => {
  const g = seedGraph();
  assert.deepEqual(pathwayNodes(g, 'p1'), ['p1', 'p2', 'p3', 'p4', 'p5', 'p7', 'p6']);
  assert.deepEqual(pathwayNodes(g, 'q1'), ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  assert.deepEqual(pathwayNodes(g, 'nope'), []);
});

test('[U-flow-3] Simmer (while loop) per lens: stirs, heat trail and visit counts from §5', () => {
  const g = seedGraph();
  const cook = runPathway(g, 'p1', 'cook');
  assert.equal(cook.status, 'ended');
  assert.equal(cook.result, 'Done after 2 stirs · heat 100 °C');
  assert.equal(cook.steps.length, 11);
  assert.deepEqual(heats(cook), [20, 60, 100]);
  const phys = runPathway(g, 'p1', 'physicist');
  assert.equal(phys.result, 'Done after 4 stirs · heat 373 K');
  assert.equal(phys.steps.length, 17);
  assert.deepEqual(heats(phys), [293, 313, 333, 353, 373]);
  const child = runPathway(g, 'p1', 'child');
  assert.equal(child.vars.stirs, 3);
  assert.equal(child.vars.heat, 5);
  assert.equal(child.steps.length, 14);
  assert.deepEqual(heats(child), [2, 3, 4, 5]);
  // §5 writes this as "heat 5 · bubbly"; the format has no per-value words (REQUEST in reports/WO-002.md).
  assert.equal(child.result, 'Done after 3 stirs · heat 5 hand-feel');
});

test('[U-flow-4] Serve (if/else) per lens: three different outcomes and visit paths', () => {
  const g = seedGraph();
  const path = (t: Trace) => t.steps.map((s) => s.nodeId.toUpperCase()).join(' ');
  const cook = runPathway(g, 'q1', 'cook');
  assert.deepEqual([cook.result, path(cook)], ['Serve it.', 'Q1 Q2 Q3 Q5 Q7']);
  const phys = runPathway(g, 'q1', 'physicist');
  assert.deepEqual([phys.result, path(phys)], ['Warm it up.', 'Q1 Q2 Q3 Q5 Q6']);
  const child = runPathway(g, 'q1', 'child');
  assert.deepEqual([child.result, path(child)], ['Wait, too hot to touch.', 'Q1 Q2 Q3 Q4']);
  assert.notEqual(cook.result, phys.result);
});

test('[U-flow-5] trace steps: readable notes, branch and via, vars after each step', () => {
  const g = seedGraph();
  const t = runPathway(g, 'p1', 'cook');
  assert.deepEqual(t.steps.map((s) => s.note), [
    'start · Simmer until done (Cook)',
    'read heat ← Temperature · 20',
    'assign stirs ← 0',
    'while heat < Boiling Point · 20 < 100 → true',
    'assign heat ← heat + Flame Step · 20 + 40 → 60',
    'assign stirs ← stirs + 1 · 0 + 1 → 1',
    'while heat < Boiling Point · 60 < 100 → true',
    'assign heat ← heat + Flame Step · 60 + 40 → 100',
    'assign stirs ← stirs + 1 · 1 + 1 → 2',
    'while heat < Boiling Point · 100 < 100 → false',
    'end · Done after 2 stirs · heat 100 °C',
  ]);
  const visit7 = t.steps[6]!; // F9: trace[6] is P4 with heat 60, stirs 1
  assert.deepEqual([visit7.nodeId, visit7.op, visit7.vars.heat, visit7.vars.stirs, visit7.branch], ['p4', 'while', 60, 1, 'true']);
  assert.equal(g.getRelation(visit7.via!)!.to, 'p5');
  assert.equal(t.steps[9]!.branch, 'false');
  assert.equal(t.steps.at(-1)!.via, undefined);
  t.steps.forEach((s, i) => assert.equal(s.index, i));
  assert.deepEqual(t.vars, { heat: 100, stirs: 2 });
  assert.equal(runPathway(g, 'q1', 'physicist').steps[3]!.note, 'if t < Room · 293 < 295 → true');
});

test('[U-flow-6] stepPathway yields one step per visit and returns the trace', () => {
  const it = stepPathway(seedGraph(), 'q1', 'child');
  const seen: string[] = [];
  let r = it.next();
  while (!r.done) { seen.push(r.value.nodeId); r = it.next(); }
  assert.deepEqual(seen, ['q1', 'q2', 'q3', 'q4']);
  assert.equal(r.value.status, 'ended');
  assert.equal(r.value.steps.length, 4);
});

function loopGraph(): MemoryGraph {
  const g = createGraph();
  g.addNode({ id: 'flame', label: 'Flame Step', value: 0 });
  const steps = [
    ['s', 'Stuck loop', { op: 'start' }],
    ['r', 'assign heat ← 20', { op: 'assign', target: 'heat', expr: '20' }],
    ['w', 'while heat < 100', { op: 'while', expr: 'heat < 100' }],
    ['b', 'assign heat ← heat + Flame Step', { op: 'assign', target: 'heat', expr: 'heat + @"Flame Step"' }],
    ['e', 'end', { op: 'end', expr: 'heat' }],
  ] as const;
  for (const [id, label, pathway] of steps) g.addNode({ id, label, kind: 'pathway', pathway: { ...pathway } });
  g.addRelation({ from: 's', to: 'r', type: 'flow' });
  g.addRelation({ from: 'r', to: 'w', type: 'flow' });
  g.addRelation({ from: 'w', to: 'b', type: 'flow', branch: 'true' });
  g.addRelation({ from: 'b', to: 'w', type: 'flow' });
  g.addRelation({ from: 'w', to: 'e', type: 'flow', branch: 'false' });
  return g;
}

test('[U-flow-7] a while loop runs and terminates', () => {
  const g = loopGraph();
  g.updateNode('flame', { value: 30 });
  const t = runPathway(g, 's', 'base');
  assert.equal(t.status, 'ended');
  assert.equal(t.result, 110);
  assert.equal(t.steps.filter((s) => s.nodeId === 'w').length, 4);
});

test('[U-flow-8] the max-step guard yields max-steps with the spec sentence, never a hang', () => {
  const t = runPathway(loopGraph(), 's', 'base', { maxSteps: 202 });
  assert.equal(t.status, 'max-steps');
  assert.equal(t.steps.length, 202);
  assert.equal(t.result, null);
  assert.equal(t.error, 'Stopped after 100 loops: the condition never became false (heat stayed 20).');
  assert.equal(runPathway(loopGraph(), 's', 'base').steps.length, 500, 'default guard is 500 steps');
});

test('[U-flow-9] user errors end the trace with status error and the spec copy, never throw', () => {
  const g = seedGraph();
  g.updateNode('boiling-point', { facets: { physicist: 373, cook: 100, child: null } });
  const missing = runPathway(g, 'p1', 'child');
  assert.equal(missing.status, 'error');
  assert.equal(missing.error, 'Stopped at while: Boiling Point has no value under Child.');
  assert.equal(missing.steps.at(-1)!.note, missing.error);

  const h = seedGraph();
  h.removeNode('temperature');
  const gone = runPathway(h, 'p1', 'cook');
  assert.equal(gone.error, 'Stopped at "read heat ← Temperature": Temperature no longer exists.');
  assert.equal(gone.steps.length, 2);

  const k = seedGraph();
  k.updateNode('p4', { pathway: { op: 'while', expr: 'heat < (' } });
  assert.match(runPathway(k, 'p1', 'cook').error!, /^Stopped at "while heat is too low": its expression can't be read \(Expected a value at column 9\)\.$/);

  const m = seedGraph();
  m.removeRelation(m.relationsOf('q3').find((r) => r.type === 'flow' && r.branch === 'false')!.id);
  assert.equal(runPathway(m, 'q1', 'cook').error, 'Stopped at "if t > Safe To Touch": there is no "false" path out of this step.');

  assert.equal(runPathway(seedGraph(), 'p4', 'cook').error, '"while heat is too low" isn\'t the start of a pathway.');
  assert.equal(runPathway(seedGraph(), 'nope', 'cook').error, 'That pathway no longer exists.');
});
