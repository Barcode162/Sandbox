// scripts/check-size.mjs: verify step 4. Payload budgets (architecture → Performance budgets) and
// asset integrity (R7). gzip = zlib.gzipSync level 9. 1 KB = 1024 B.
// Exits 1 if any row fails; writes $EVIDENCE_DIR/size.json.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveEvidenceDir } from './verify.mjs';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(PROJECT, 'site');
const KB = 1024;

export const BUDGETS = {
  js: 40 * KB, // site/js/**/*.js, gzip
  css: 12 * KB, // site/css/**/*.css, gzip
  html: 16 * KB, // site/**/*.html, gzip (with the baked Scene 1 SVG)
  firstLoad: 95 * KB, // js + css + html gzip + font bytes
};
export const FONT = { file: 'fonts/space-grotesk-latin-wght-normal.woff2', bytes: 22288, sha256: '0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d' };
export const OFL = { file: 'fonts/OFL.txt', bytes: 4401, sha256: '18a4de52385f6b988782639d5d0cc1326e5a8c2de9a7f01d7b20d9aedcc60943' };

/** @param {string} dir @param {(f: string) => boolean} keep @returns {string[]} */
function walk(dir, keep) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, keep));
    else if (keep(p)) out.push(p);
  }
  return out;
}

/** @param {string[]} files */
function measure(files) {
  const rows = files.map((f) => {
    const buf = readFileSync(f);
    return { file: path.relative(SITE, f), bytes: buf.length, gzip: gzipSync(buf, { level: 9 }).length };
  });
  return { files: rows, bytes: rows.reduce((s, r) => s + r.bytes, 0), gzip: rows.reduce((s, r) => s + r.gzip, 0) };
}

/** @param {string} rel */
function asset(rel) {
  try {
    const buf = readFileSync(path.join(SITE, rel));
    return { bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
  } catch {
    return { bytes: -1, sha256: 'missing' };
  }
}

export function checkSize() {
  const js = measure(walk(path.join(SITE, 'js'), (f) => f.endsWith('.js')));
  const css = measure(walk(path.join(SITE, 'css'), (f) => f.endsWith('.css')));
  const html = measure(walk(SITE, (f) => f.endsWith('.html')));
  const font = asset(FONT.file);
  const ofl = asset(OFL.file);
  const firstLoad = js.gzip + css.gzip + html.gzip + Math.max(0, font.bytes);

  const rows = [
    { budget: 'JS gzip', actual: js.gzip, limit: BUDGETS.js, ok: js.gzip <= BUDGETS.js },
    { budget: 'CSS gzip', actual: css.gzip, limit: BUDGETS.css, ok: css.gzip <= BUDGETS.css },
    { budget: 'HTML gzip', actual: html.gzip, limit: BUDGETS.html, ok: html.gzip <= BUDGETS.html },
    { budget: 'Font bytes', actual: font.bytes, limit: FONT.bytes, ok: font.bytes === FONT.bytes },
    { budget: 'Font sha256', actual: font.sha256, limit: FONT.sha256, ok: font.sha256 === FONT.sha256 },
    { budget: 'OFL.txt sha256', actual: ofl.sha256, limit: OFL.sha256, ok: ofl.sha256 === OFL.sha256 },
    { budget: 'First-load transfer', actual: firstLoad, limit: BUDGETS.firstLoad, ok: firstLoad <= BUDGETS.firstLoad },
  ];
  return { ok: rows.every((r) => r.ok), rows, js, css, html, font, ofl, firstLoad };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = checkSize();
  const fmt = (/** @type {number|string} */ v) => (typeof v === 'number' ? `${v} B (${(v / KB).toFixed(2)} KB)` : `${v.slice(0, 12)}…`);
  for (const r of result.rows) {
    process.stdout.write(`${r.ok ? 'PASS' : 'FAIL'}  ${r.budget.padEnd(20)} ${fmt(r.actual).padEnd(24)} limit ${fmt(r.limit)}\n`);
  }
  const dir = resolveEvidenceDir();
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'size.json');
  writeFileSync(out, JSON.stringify({ generated: new Date().toISOString(), ...result }, null, 2) + '\n');
  process.stdout.write(`size.json → ${path.relative(PROJECT, out)}\n${result.ok ? 'size: OK' : 'size: OVER BUDGET or asset mismatch'}\n`);
  process.exit(result.ok ? 0 : 1);
}
