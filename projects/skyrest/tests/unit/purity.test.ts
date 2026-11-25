// Layering rule (contracts.ts header): sim-side modules import neither three nor the DOM, so they run in node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const pure = [
  ...readdirSync(path.join(SRC, 'core')).filter((f) => f.endsWith('.ts') && f !== 'settings.ts').map((f) => `core/${f}`),
  ...readdirSync(path.join(SRC, 'tuning')).map((f) => `tuning/${f}`),
  'hero/sim.ts', 'hero/combat.ts', 'golem/sim.ts', 'minions/sim.ts', 'world/ground.ts',
  ...readdirSync(path.join(SRC, 'moments')).map((f) => `moments/${f}`),
];

test('[P0] sim-side modules are pure', () => {
  for (const f of pure) {
    const src = readFileSync(path.join(SRC, f), 'utf8');
    assert.doesNotMatch(src, /from ['"]three|document\.|window\.|requestAnimationFrame|Math\.random/, f);
  }
});
