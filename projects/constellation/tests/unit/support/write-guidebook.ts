// Regenerates src/seed/guidebook.json from guidebook-source.ts:  node tests/unit/support/write-guidebook.ts
import { writeFileSync } from 'node:fs';
import { buildGuidebook } from './guidebook-source.ts';

const target = new URL('../../../src/seed/guidebook.json', import.meta.url);
writeFileSync(target, JSON.stringify(buildGuidebook(), null, 2) + '\n');
console.log(`wrote ${target.pathname}`);
