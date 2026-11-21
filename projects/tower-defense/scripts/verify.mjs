// npm run verify — the single gate command [A4]. Runs every step, prints a table, exits non-zero on any FAIL.
// PENDING lists steps not implemented yet (WO-005 emptied it: every step now runs against the real game).
// `npm run verify -- --strict` treats PENDING as FAIL and also fails when the whole run exceeds the
// 8-minute budget (board condition 2). Pass step names to run a subset: `npm run verify -- boot perf`.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const PENDING = new Set([]);
const BUDGET_S = 8 * 60;
const STEPS = [
  ['typecheck', 'npx', ['tsc', '-p', 'tsconfig.json', '--noEmit']],
  ['unit', 'npx', ['vitest', 'run']],
  ['build', 'npx', ['vite', 'build', '--logLevel', 'warn']],
  ['size', 'node', ['scripts/check-size.mjs']],
  ['boot', 'node', ['scripts/e2e/boot.mjs']],
  ['audio', 'node', ['scripts/e2e/audio.mjs']],
  ['playthrough', 'node', ['scripts/e2e/playthrough.mjs']],
  ['determinism', 'node', ['scripts/e2e/determinism.mjs']],
  ['screens', 'node', ['scripts/e2e/screenshots.mjs']],
  ['perf', 'node', ['scripts/e2e/perf.mjs']],
];
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const only = args.filter((a) => !a.startsWith('--'));
const unknown = only.filter((n) => !STEPS.some(([s]) => s === n));
if (unknown.length) { console.error(`unknown step(s): ${unknown.join(', ')}`); process.exit(2); }
const cwd = resolve(import.meta.dirname, '..');
const rows = [];
const start = Date.now();
for (const [name, cmd, args] of STEPS) {
  if (only.length && !only.includes(name)) continue;
  if (PENDING.has(name)) { rows.push([name, strict ? 'FAIL' : 'PENDING', 0]); continue; }
  console.log(`\n▶ ${name}`);
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  rows.push([name, r.status === 0 ? 'PASS' : 'FAIL', Date.now() - t0]);
}
const totalS = (Date.now() - start) / 1000;
console.log('\nverify summary');
for (const [n, s, ms] of rows) console.log(`  ${s.padEnd(8)} ${n.padEnd(12)} ${ms ? `${(ms / 1000).toFixed(1)} s` : ''}`);
const overBudget = strict && !only.length && totalS > BUDGET_S;
console.log(`  total ${totalS.toFixed(1)} s${strict ? ` (budget ${BUDGET_S} s${overBudget ? ' — OVER' : ''})` : ''}`);
const failed = rows.filter((r) => r[1] === 'FAIL').length + (overBudget ? 1 : 0);
const pending = rows.filter((r) => r[1] === 'PENDING').length;
console.log(failed ? `\nVERIFY FAILED (${failed})` : pending ? `\nVERIFY GREEN with ${pending} PENDING slot(s) — not shippable` : only.length ? `\nVERIFY GREEN (subset: ${only.join(', ')})` : '\nVERIFY GREEN');
process.exit(failed ? 1 : 0);
