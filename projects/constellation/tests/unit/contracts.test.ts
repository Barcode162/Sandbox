// Wave-0 contract checks: the public API surface exists and the seed has the v1 envelope.
// WO-002 adds one <module>.test.ts per core module and replaces the stub assertions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as core from '../../src/core/index.ts';

const API = [
  'CoreError', 'createGraph', 'emptyDoc',
  'resolveValue', 'facetsOf', 'disagrees', 'isRelationVisible', 'visibleRelations',
  'forceLayout', 'layoutFor',
  'declaredPath', 'shortestPath', 'compareRoutes', 'learnShortcut',
  'search', 'spreadActivation', 'retrieve',
  'parseExpr', 'evaluate', 'references', 'isTruthy',
  'listPathways', 'pathwayNodes', 'stepPathway', 'runPathway',
  'validateDoc', 'importJson', 'exportDoc', 'exportJson', 'loadSaved', 'startAutosave',
];

test('[C0] core exports the frozen API', () => {
  for (const name of API) assert.equal(typeof (core as Record<string, unknown>)[name], 'function', name);
  assert.equal(core.SCHEMA_ID, 'constellation.memory');
  assert.equal(core.SCHEMA_VERSION, 1);
  assert.equal(core.AUTOSAVE_KEY, 'constellation.memory.v2');
});

test('[C1] seed carries the v1 envelope', () => {
  const seed = JSON.parse(readFileSync(new URL('../../src/seed/memory.json', import.meta.url), 'utf8'));
  assert.equal(seed.schema, core.SCHEMA_ID);
  assert.equal(seed.version, core.SCHEMA_VERSION);
  assert.ok(Array.isArray(seed.nodes) && seed.nodes.length > 0);
  assert.ok(seed.perspectives.length >= 2);
});

test('[C2] no core module still calls a wave-0 stub', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../../src/core/', import.meta.url);
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts') && n !== 'errors.ts')) {
    assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /notImplemented\(/, f);
  }
});
