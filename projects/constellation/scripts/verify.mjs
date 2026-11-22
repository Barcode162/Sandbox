// scripts/verify.mjs — `npm run verify`: typecheck → unit → build → size → e2e (axe + console + screenshots).
// Runs every step even after a failure, prints a table, exits non-zero if any step failed.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAYWRIGHT = '1.63.0';
const bin = (n) => path.join(PROJECT, 'node_modules', '.bin', n);
const steps = [];

function step(name, cmd, args, pick = (out) => out.trim().split('\n').slice(-12).join('\n')) {
  process.stdout.write(`\n── ${name} ${'─'.repeat(Math.max(4, 60 - name.length))}\n`);
  const t = Date.now();
  const r = spawnSync(cmd, args, { cwd: PROJECT, encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout ?? '') + (r.stderr ?? '') + (r.error ? String(r.error) : '');
  process.stdout.write((pick(out) || '(no output)') + '\n');
  steps.push({ name, ok: r.status === 0, ms: Date.now() - t });
}

// 0 · preflight: pinned Playwright, Node ≥ 22.18 (native TS type stripping for node --test).
{
  const req = createRequire(path.join(PROJECT, 'package.json'));
  const problems = [];
  for (const p of ['@playwright/test', 'playwright-core']) {
    let v = 'unresolved';
    try { v = req(`${p}/package.json`).version; } catch {}
    if (v !== PLAYWRIGHT) problems.push(`${p} ${v} ≠ ${PLAYWRIGHT}`);
  }
  const [maj, min] = process.versions.node.split('.').map(Number);
  if (maj < 22 || (maj === 22 && min < 18)) problems.push(`node ${process.versions.node} < 22.18`);
  console.log(`── preflight\nnode ${process.versions.node} · playwright ${PLAYWRIGHT}${problems.length ? '\nFAIL ' + problems.join('; ') : ' · ok'}`);
  steps.push({ name: 'preflight', ok: problems.length === 0, ms: 0 });
}

step('typecheck', bin('tsc'), ['-p', 'tsconfig.json'], (o) => o.trim() || 'tsc: no errors');
step('unit', process.execPath, ['--test', '--disable-warning=ExperimentalWarning', 'tests/unit/**/*.test.ts'], (o) =>
  o.split('\n').filter((l) => /^(✔|✖|ℹ)|^\s*(not ok|ok)\b/.test(l.trim())).slice(-40).join('\n'));
step('build', bin('vite'), ['build'], (o) => o.trim().split('\n').filter((l) => /dist\/|built in|error/i.test(l)).join('\n'));
step('size', process.execPath, ['scripts/check-size.mjs']);
step('e2e', bin('playwright'), ['test'], (o) => o.trim().split('\n').filter((l) => l.trim()).slice(-25).join('\n'));

console.log('\n── verify summary ' + '─'.repeat(44));
for (const s of steps) console.log(`${s.ok ? 'PASS' : 'FAIL'}  ${s.name.padEnd(10)} ${String(s.ms).padStart(7)} ms`);
const failed = steps.filter((s) => !s.ok);
console.log(failed.length ? `VERIFY FAILED: ${failed.map((s) => s.name).join(', ')}` : 'VERIFY PASSED');
process.exit(failed.length ? 1 : 0);
