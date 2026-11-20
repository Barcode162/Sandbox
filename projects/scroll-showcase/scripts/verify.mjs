// scripts/verify.mjs: the verify orchestrator (architecture → Verification strategy, K12, K18).
//
//   npm run verify        steps 0–7, then floors and manifest; exits non-zero if a gating step fails
//   npm run verify:quick  steps 0, 1, 2, dev unit tests and 4 (gating); the unit spec suite is
//                         run and printed but does not gate
//
// It keeps going after a failure so one run shows everything, prints a step table and a per-id
// table, and writes $EVIDENCE_DIR/verify-summary.json (verify-quick-summary.json in quick mode).
//
// VERIFY_PHASE ratchets (K18): 0 = WO-001 skeleton (zero-test steps allowed; --pass-with-no-tests
// on the perf step only); 1 = WO-013 (floors, skips fail, --pass-with-no-tests forbidden);
// 2 = WO-023 (missing manifest ids and empty suites fail).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const VERIFY_PHASE = 0;
/** Spec unit files (WO-012 fills this; phase ≥ 1 requires each to exist with ≥ 1 test). @type {string[]} */
export const UNIT_SPEC_FILES = [];
/** @type {{ id: string; step: 'unit' | 'e2e' | 'perf' | 'evidence'; suite: string; wo: string }[]} */
export const MANIFEST = [];
export const FLOORS = { unitSpec: 0, unitDev: 0, e2eIds: 0, perf: 0 };
export const PLAYWRIGHT_VERSION = '1.63.0';

/**
 * K12: SHOWCASE_EVIDENCE_DIR if set; else the dossier's evidence/ when it exists relative to the
 * project; else ./evidence-local/ (gitignored).
 * @returns {string}
 */
export function resolveEvidenceDir() {
  if (process.env.SHOWCASE_EVIDENCE_DIR) return path.resolve(process.env.SHOWCASE_EVIDENCE_DIR);
  const dossier = path.resolve(PROJECT, '..', '..', 'bureau', 'missions', 'M-0001-scroll-showcase', 'evidence');
  if (existsSync(dossier)) return dossier;
  return path.join(PROJECT, 'evidence-local');
}

/** @typedef {{ n: number; name: string; status: 'pass' | 'fail' | 'absent' | 'info'; gating: boolean; ms: number; counts?: Record<string, number>; ids?: Record<string, 'pass' | 'fail'>; note?: string; cmd?: string }} StepResult */

/** @param {string} cmd @param {string[]} args @param {Record<string, string>} [env] */
function run(cmd, args, env = {}) {
  const t = Date.now();
  const r = spawnSync(cmd, args, { cwd: PROJECT, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  return { code: r.status ?? 1, out, ms: Date.now() - t, error: r.error ? String(r.error) : '' };
}

/** @param {string} title @param {Record<string, 'pass'|'fail'>} ids @param {boolean} ok */
function collectIds(title, ids, ok) {
  const m = /^\s*\[([^\]]+)\]/.exec(title);
  if (!m) return;
  for (const raw of m[1].split(/[,\s]+/)) {
    const id = raw.trim();
    if (!id) continue;
    if (ids[id] === 'fail') continue;
    ids[id] = ok ? 'pass' : 'fail';
  }
}

/** Parse node --test TAP output. @param {string} out */
function parseTap(out) {
  const num = (/** @type {string} */ k) => {
    const m = new RegExp(`^# ${k} (\\d+)`, 'm').exec(out);
    return m ? Number(m[1]) : 0;
  };
  /** @type {Record<string, 'pass'|'fail'>} */
  const ids = {};
  for (const line of out.split('\n')) {
    const m = /^\s*(not ok|ok) \d+ - (.*?)(\s+#\s*(SKIP|TODO).*)?$/.exec(line);
    if (m) collectIds(m[2], ids, m[1] === 'ok');
  }
  return { counts: { tests: num('tests'), pass: num('pass'), fail: num('fail'), skipped: num('skipped'), todo: num('todo') }, ids };
}

/** Parse a Playwright JSON report. @param {string} file */
function parsePlaywright(file) {
  /** @type {Record<string, 'pass'|'fail'>} */
  const ids = {};
  const counts = { tests: 0, pass: 0, fail: 0, skipped: 0, flaky: 0 };
  if (!existsSync(file)) return { counts, ids, missing: true };
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const s = report.stats ?? {};
  counts.pass = s.expected ?? 0;
  counts.fail = s.unexpected ?? 0;
  counts.skipped = s.skipped ?? 0;
  counts.flaky = s.flaky ?? 0;
  counts.tests = counts.pass + counts.fail + counts.skipped + counts.flaky;
  /** @param {any} suite */
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) collectIds(spec.title, ids, spec.ok);
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites ?? []) walk(suite);
  return { counts, ids, missing: false };
}

/** @param {string} dir */
function dirStats(dir) {
  let bytes = 0;
  let files = 0;
  if (!existsSync(dir)) return { bytes, files };
  const walk = (/** @type {string} */ d) => {
    for (const n of readdirSync(d)) {
      const p = path.join(d, n);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else {
        bytes += st.size;
        files += 1;
      }
    }
  };
  walk(dir);
  return { bytes, files };
}

/** @param {string[]} argv */
export function main(argv) {
  const quick = argv.includes('--quick');
  const evidenceDir = resolveEvidenceDir();
  const childEnv = { EVIDENCE_DIR: evidenceDir, SHOWCASE_EVIDENCE_DIR: evidenceDir };
  const bin = (/** @type {string} */ name) => path.join(PROJECT, 'node_modules', '.bin', name);
  /** @type {StepResult[]} */
  const steps = [];
  /** @type {Record<string, 'pass'|'fail'>} */
  const allIds = {};
  const log = (/** @type {string} */ s) => process.stdout.write(s + '\n');
  const banner = (/** @type {number|string} */ n, /** @type {string} */ name) => log(`\n── step ${n} · ${name} ${'─'.repeat(Math.max(4, 60 - name.length))}`);

  // ── Step 0: preflight ──────────────────────────────────────────────────────────────────
  {
    banner(0, 'preflight');
    const t = Date.now();
    /** @type {string[]} */
    const problems = [];
    const req = createRequire(path.join(PROJECT, 'package.json'));
    /** @type {Record<string, string>} */
    const versions = {};
    for (const pkg of ['playwright-core', 'playwright', '@playwright/test']) {
      try {
        versions[pkg] = req(`${pkg}/package.json`).version;
      } catch {
        versions[pkg] = 'unresolved';
      }
      if (versions[pkg] !== PLAYWRIGHT_VERSION) problems.push(`${pkg} resolves to ${versions[pkg]}, expected ${PLAYWRIGHT_VERSION}`);
    }
    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (nodeMajor < 22) problems.push(`Node ${process.versions.node} < 22`);
    try {
      mkdirSync(evidenceDir, { recursive: true });
    } catch (e) {
      problems.push(`cannot create EVIDENCE_DIR ${evidenceDir}: ${e}`);
    }
    log(`playwright-core ${versions['playwright-core']} · playwright ${versions.playwright} · @playwright/test ${versions['@playwright/test']} · node ${process.versions.node}`);
    log(`VERIFY_PHASE ${VERIFY_PHASE} · EVIDENCE_DIR ${path.relative(PROJECT, evidenceDir) || '.'}`);
    for (const p of problems) log(`FAIL ${p}`);
    steps.push({ n: 0, name: 'preflight', status: problems.length ? 'fail' : 'pass', gating: true, ms: Date.now() - t, note: problems.join('; ') || undefined });
  }

  // ── Step 1: typecheck ──────────────────────────────────────────────────────────────────
  {
    banner(1, 'typecheck');
    const r = run(bin('tsc'), ['-p', 'tsconfig.json']);
    log(r.out.trim() || 'tsc: no errors');
    steps.push({ n: 1, name: 'typecheck', status: r.code === 0 ? 'pass' : 'fail', gating: true, ms: r.ms, cmd: 'tsc -p tsconfig.json' });
  }

  // ── Step 2: static guards ──────────────────────────────────────────────────────────────
  {
    banner(2, 'static guards');
    const script = path.join(PROJECT, 'tests', 'static', 'check-static.mjs');
    if (!existsSync(script)) {
      const absentOk = VERIFY_PHASE === 0;
      log(`tests/static/check-static.mjs absent (WO-012 creates it)${absentOk ? ': allowed in phase 0' : ''}`);
      steps.push({ n: 2, name: 'static guards', status: absentOk ? 'absent' : 'fail', gating: true, ms: 0 });
    } else {
      const r = run(process.execPath, [script]);
      log(r.out.trim());
      steps.push({ n: 2, name: 'static guards', status: r.code === 0 ? 'pass' : 'fail', gating: true, ms: r.ms, cmd: 'node tests/static/check-static.mjs' });
    }
  }

  // ── Step 3: unit ───────────────────────────────────────────────────────────────────────
  /** @param {string} glob @param {string} name @param {boolean} gating @param {number} floor */
  const unit = (glob, name, gating, floor) => {
    banner(3, name);
    const r = run(process.execPath, ['--test', '--test-reporter=tap', glob], childEnv);
    const { counts, ids } = parseTap(r.out);
    Object.assign(allIds, ids);
    const tail = r.out.split('\n').filter((l) => /^(not ok|ok) |^# (tests|pass|fail|skipped|todo|duration)/.test(l.trimStart()) && !/^\s{4,}/.test(l));
    log(tail.join('\n') || r.out.trim());
    /** @type {string[]} */
    const notes = [];
    let ok = r.code === 0;
    if (VERIFY_PHASE > 0 && counts.tests < Math.max(1, floor)) {
      ok = false;
      notes.push(`floor: ${counts.tests} < ${Math.max(1, floor)}`);
    }
    if (VERIFY_PHASE > 0 && counts.skipped + counts.todo > 0) {
      ok = false;
      notes.push(`${counts.skipped} skipped, ${counts.todo} todo`);
    }
    steps.push({ n: 3, name, status: gating ? (ok ? 'pass' : 'fail') : 'info', gating, ms: r.ms, counts, note: (gating ? '' : `non-gating: ${ok ? 'green' : 'RED'}; `) + notes.join('; ') || undefined, cmd: `node --test '${glob}'` });
  };
  if (quick) {
    unit('tests/unit/dev/**/*.test.js', 'unit (dev)', true, FLOORS.unitDev);
    unit('tests/unit/spec/**/*.test.js', 'unit (spec, printed only)', false, FLOORS.unitSpec);
  } else {
    unit('tests/unit/**/*.test.js', 'unit', true, FLOORS.unitDev + FLOORS.unitSpec);
    for (const f of UNIT_SPEC_FILES) {
      if (!existsSync(path.join(PROJECT, 'tests', 'unit', 'spec', f))) {
        steps.push({ n: 3, name: `unit spec file ${f}`, status: 'fail', gating: VERIFY_PHASE > 0, ms: 0, note: 'missing' });
      }
    }
  }

  // ── Step 4: size and assets ────────────────────────────────────────────────────────────
  {
    banner(4, 'size and assets');
    const r = run(process.execPath, [path.join(PROJECT, 'scripts', 'check-size.mjs')], childEnv);
    log(r.out.trim());
    steps.push({ n: 4, name: 'size and assets', status: r.code === 0 ? 'pass' : 'fail', gating: true, ms: r.ms, cmd: 'node scripts/check-size.mjs' });
  }

  if (!quick) {
    // ── Step 5: e2e ──────────────────────────────────────────────────────────────────────
    /** @param {number} n @param {string} name @param {string[]} args @param {number} floor */
    const pw = (n, name, args, floor) => {
      if (VERIFY_PHASE > 0 && args.includes('--pass-with-no-tests')) throw new Error('--pass-with-no-tests is forbidden after phase 0 (K18)');
      banner(n, name);
      const json = path.join(evidenceDir, `playwright-${name}.json`);
      const r = run(bin('playwright'), ['test', ...args, '--reporter=json,list'], { ...childEnv, PLAYWRIGHT_JSON_OUTPUT_NAME: json });
      log(r.out.split('\n').filter((l) => !/^\s*$/.test(l)).slice(-60).join('\n'));
      const { counts, ids } = parsePlaywright(json);
      Object.assign(allIds, ids);
      /** @type {string[]} */
      const notes = [];
      let ok = r.code === 0;
      if (VERIFY_PHASE > 0 && counts.tests < Math.max(1, floor)) {
        ok = false;
        notes.push(`floor: ${counts.tests} < ${Math.max(1, floor)}`);
      }
      if (VERIFY_PHASE > 0 && counts.skipped > 0) {
        ok = false;
        notes.push(`${counts.skipped} skipped`);
      }
      steps.push({ n, name, status: ok ? 'pass' : 'fail', gating: true, ms: r.ms, counts, note: notes.join('; ') || undefined, cmd: `playwright test ${args.join(' ')}` });
    };
    pw(5, 'e2e', ['--project=e2e'], FLOORS.e2eIds);

    // ── Step 6: perf ─────────────────────────────────────────────────────────────────────
    const perfArgs = ['--project=perf', '--workers=1'];
    if (VERIFY_PHASE === 0) perfArgs.push('--pass-with-no-tests');
    pw(6, 'perf', perfArgs, FLOORS.perf);

    // ── Step 7: evidence index ───────────────────────────────────────────────────────────
    banner(7, 'evidence index');
    const idx = path.join(PROJECT, 'tests', 'e2e', 'evidence', 'check-index.mjs');
    if (!existsSync(idx)) {
      const absentOk = VERIFY_PHASE < 2;
      log(`tests/e2e/evidence/check-index.mjs absent (WO-023 wires it)${absentOk ? `: allowed in phase ${VERIFY_PHASE}` : ''}`);
      steps.push({ n: 7, name: 'evidence index', status: absentOk ? 'absent' : 'fail', gating: true, ms: 0 });
    } else {
      const r = run(process.execPath, [idx], childEnv);
      log(r.out.trim());
      steps.push({ n: 7, name: 'evidence index', status: r.code === 0 ? 'pass' : 'fail', gating: true, ms: r.ms });
    }
  }

  // ── Floors and manifest ────────────────────────────────────────────────────────────────
  banner('—', 'floors and manifest');
  /** @type {{ id: string; suite: string; wo: string; status: string }[]} */
  const idTable = MANIFEST.map((m) => ({ id: m.id, suite: m.suite, wo: m.wo, status: allIds[m.id] ?? 'missing' }));
  if (!MANIFEST.length) log(`manifest empty (phase ${VERIFY_PHASE}); ids seen: ${Object.keys(allIds).sort().join(' ') || 'none'}`);
  else {
    for (const r of idTable) log(`${r.status.padEnd(8)} ${r.id.padEnd(10)} ${r.suite.padEnd(12)} ${r.wo}`);
    const missing = idTable.filter((r) => r.status === 'missing');
    const failed = idTable.filter((r) => r.status === 'fail');
    const manifestOk = failed.length === 0 && (VERIFY_PHASE < 2 || missing.length === 0);
    if (!quick) steps.push({ n: 8, name: 'floors and manifest', status: manifestOk ? 'pass' : 'fail', gating: true, ms: 0, note: `${missing.length} missing, ${failed.length} failing` });
  }

  // ── Table and summary ──────────────────────────────────────────────────────────────────
  log('\n── verify summary ' + '─'.repeat(50));
  log(`${'#'.padEnd(3)} ${'step'.padEnd(28)} ${'status'.padEnd(7)} ${'tests'.padStart(6)} ${'ms'.padStart(7)}  note`);
  for (const s of steps) {
    const tests = s.counts ? String(s.counts.tests) : '';
    log(`${String(s.n).padEnd(3)} ${s.name.padEnd(28)} ${s.status.toUpperCase().padEnd(7)} ${tests.padStart(6)} ${String(s.ms).padStart(7)}  ${s.note ?? ''}`);
  }
  const failed = steps.filter((s) => s.gating && s.status === 'fail');
  const summary = {
    generated: new Date().toISOString(),
    mode: quick ? 'quick' : 'full',
    VERIFY_PHASE,
    ok: failed.length === 0,
    evidenceDir,
    steps,
    ids: idTable,
    idsSeen: allIds,
    skipped: steps.reduce((n, s) => n + (s.counts?.skipped ?? 0), 0),
    evidence: { screens: dirStats(path.join(evidenceDir, 'screens')), motion: dirStats(path.join(evidenceDir, 'motion')) },
  };
  const out = path.join(evidenceDir, quick ? 'verify-quick-summary.json' : 'verify-summary.json');
  writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
  log(`\nsummary → ${path.relative(PROJECT, out)}`);
  log(failed.length ? `VERIFY${quick ? ':QUICK' : ''} FAILED: ${failed.map((s) => `${s.n} ${s.name}`).join(', ')}` : `VERIFY${quick ? ':QUICK' : ''} PASSED (phase ${VERIFY_PHASE})`);
  return failed.length ? 1 : 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exit(main(process.argv.slice(2)));
