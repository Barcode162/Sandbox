// npm run verify — the single gate command [A4]. Runs every step, prints a table, exits non-zero on any FAIL.
// PENDING lists steps whose implementation belongs to a wave-1 work order; WO-005 must empty it.
// `npm run verify -- --strict` treats PENDING as FAIL (the ship gate runs strict).
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const PENDING = new Set(['playthrough', 'determinism', 'screens', 'perf']);
const STEPS = [
  ['typecheck', 'npx', ['tsc', '-p', 'tsconfig.json', '--noEmit']],
  ['unit', 'npx', ['vitest', 'run']],
  ['build', 'npx', ['vite', 'build', '--logLevel', 'warn']],
  ['size', 'node', ['scripts/check-size.mjs']],
  ['boot', 'node', ['scripts/e2e/boot.mjs']],
  ['playthrough', 'node', ['scripts/e2e/playthrough.mjs']],
  ['determinism', 'node', ['scripts/e2e/determinism.mjs']],
  ['screens', 'node', ['scripts/e2e/screenshots.mjs']],
  ['perf', 'node', ['scripts/e2e/perf.mjs']],
];
const strict = process.argv.includes('--strict');
const cwd = resolve(import.meta.dirname, '..');
const rows = [];
for (const [name, cmd, args] of STEPS) {
  if (PENDING.has(name) && !strict) { rows.push([name, 'PENDING', 0]); continue; }
  console.log(`\n▶ ${name}`);
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  rows.push([name, r.status === 0 ? 'PASS' : 'FAIL', Date.now() - t0]);
}
console.log('\nverify summary');
for (const [n, s, ms] of rows) console.log(`  ${s.padEnd(8)} ${n.padEnd(12)} ${ms ? `${(ms / 1000).toFixed(1)} s` : ''}`);
const failed = rows.filter((r) => r[1] === 'FAIL').length;
const pending = rows.filter((r) => r[1] === 'PENDING').length;
console.log(failed ? `\nVERIFY FAILED (${failed})` : pending ? `\nVERIFY GREEN with ${pending} PENDING slot(s) — not shippable` : '\nVERIFY GREEN');
process.exit(failed ? 1 : 0);
