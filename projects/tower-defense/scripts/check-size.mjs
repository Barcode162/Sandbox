// Bundle budget: total gzipped JS in dist/ ≤ 120 KB (architecture §Performance budgets).
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
const BUDGET_KB = 120;
const dir = join(resolve(import.meta.dirname, '..'), 'dist', 'assets');
const kb = readdirSync(dir).filter((f) => f.endsWith('.js'))
  .reduce((n, f) => n + gzipSync(readFileSync(join(dir, f))).length, 0) / 1024;
console.log(`  bundle ${kb.toFixed(1)} KB gzip (budget ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) process.exitCode = 1;
