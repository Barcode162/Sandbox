// scripts/check-size.mjs — bundle budget: total gzipped JS in dist/ ≤ 300 KB (three ≈ 170 KB of it).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BUDGET_KB = 300;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
let total = 0;
for (const f of walk(DIST).filter((f) => f.endsWith('.js'))) total += gzipSync(readFileSync(f)).length;
const kb = (total / 1024).toFixed(1);
console.log(`js gzip ${kb} KB / budget ${BUDGET_KB} KB`);
process.exit(total / 1024 <= BUDGET_KB ? 0 : 1);
