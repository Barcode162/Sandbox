// The one verify command: `npm run verify`. Frozen in WO-001; new e2e files are picked up by glob.
// Steps: typecheck → unit tests → production build → serve dist → every tests/e2e/*.e2e.mjs.
// Flags: --e2e-only (skip typecheck/unit), --skip-build (reuse dist/).
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const bin = (n) => join(ROOT, 'node_modules', '.bin', n);
const results = [];

function run(label, cmd, argv, env = {}) {
  const t0 = Date.now();
  console.log(`\n=== ${label}`);
  const r = spawnSync(cmd, argv, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } });
  const ok = r.status === 0;
  results.push({ label, ok, ms: Date.now() - t0 });
  return ok;
}

if (!args.has('--e2e-only')) {
  run('typecheck', bin('tsc'), ['--noEmit', '-p', 'tsconfig.json']);
  run('unit', bin('vitest'), ['run']);
}
if (!args.has('--skip-build')) run('build', bin('vite'), ['build', '--logLevel', 'warn']);

// Budget: shipped JS ≤ 120 KB gzip (plan.md §Performance budgets).
{
  const dir = join(ROOT, 'dist', 'assets');
  let gz = 0;
  try {
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) gz += gzipSync(readFileSync(join(dir, f))).length;
  } catch { gz = Infinity; }
  const ok = gz <= 120 * 1024;
  console.log(`\n=== bundle size\n  JS gzip ${(gz / 1024).toFixed(1)} KB (budget 120 KB)`);
  results.push({ label: `bundle ${(gz / 1024).toFixed(1)} KB gzip`, ok, ms: 0 });
}

const port = Number(process.env.PORT ?? 4317);
const server = spawn(bin('vite'), ['preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
try {
  let up = false;
  for (let i = 0; i < 100 && !up; i++) {
    try {
      up = (await fetch(base)).ok;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!up) results.push({ label: 'preview server', ok: false, ms: 0 });
  else {
    const dir = join(ROOT, 'tests', 'e2e');
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.e2e.mjs')).sort()) {
      run(`e2e ${f}`, process.execPath, [join(dir, f)], { BASE_URL: base });
    }
  }
} finally {
  server.kill();
}

console.log('\n=== verify summary');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}  (${(r.ms / 1000).toFixed(1)} s)`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\nverify: ${failed} step(s) FAILED` : '\nverify: all steps passed');
process.exit(failed ? 1 : 0);
