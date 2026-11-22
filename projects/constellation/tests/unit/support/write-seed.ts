// Regenerates src/seed/memory.json from seed-source.ts:  node tests/unit/support/write-seed.ts
import { writeFileSync } from 'node:fs';
import { buildSeed } from './seed-source.ts';

const target = new URL('../../../src/seed/memory.json', import.meta.url);
writeFileSync(target, JSON.stringify(buildSeed(), null, 2) + '\n');
console.log(`wrote ${target.pathname}`);
