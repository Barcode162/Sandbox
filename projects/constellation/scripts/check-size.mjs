// scripts/check-size.mjs — bundle budget on dist/ (run after `vite build`).
// Budget: total JS ≤ 230 KB gzip, total CSS ≤ 30 KB gzip (plan.md → Budgets).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BUDGET = { js: 230 * 1024, css: 30 * 1024 };
const total = { js: 0, css: 0 };
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = path.join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else {
      const ext = path.extname(n).slice(1);
      if (ext in total) total[ext] += gzipSync(readFileSync(p)).length;
    }
  }
};
walk(DIST);
let ok = true;
for (const k of Object.keys(BUDGET)) {
  const pass = total[k] <= BUDGET[k];
  ok &&= pass;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${k} ${(total[k] / 1024).toFixed(1)} KB gz / ${(BUDGET[k] / 1024).toFixed(0)} KB`);
}
process.exit(ok ? 0 : 1);
