// helpers/evidence.js: where test evidence goes (architecture K12).
//
// EVIDENCE_DIR (set by scripts/verify.mjs) wins, then SHOWCASE_EVIDENCE_DIR, then the dossier's
// evidence/ directory when the project sits inside the Bureau repo, otherwise ./evidence-local/
// (gitignored). The same rule as verify.mjs's resolveEvidenceDir(), restated here so a direct
// `npx playwright test` writes to the same place verify would.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** @returns {string} the evidence root (created on demand) */
export function evidenceRoot() {
  const dossier = path.resolve(PROJECT, '..', '..', 'bureau', 'missions', 'M-0001-scroll-showcase', 'evidence');
  const base = process.env.EVIDENCE_DIR
    ? path.resolve(process.env.EVIDENCE_DIR)
    : process.env.SHOWCASE_EVIDENCE_DIR
      ? path.resolve(process.env.SHOWCASE_EVIDENCE_DIR)
      : fs.existsSync(dossier)
        ? dossier
        : path.join(PROJECT, 'evidence-local');
  fs.mkdirSync(base, { recursive: true });
  return base;
}

/**
 * Absolute path of an evidence file; parent directories are created.
 * @param {...string} parts path segments under the evidence root, e.g. ('seams', 'x.png')
 */
export function evidencePath(...parts) {
  const p = path.join(evidenceRoot(), ...parts);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

/**
 * Write a buffer or string into the evidence tree.
 * @param {string} rel relative path under the evidence root
 * @param {Buffer | string} data
 * @returns {string} the absolute path written
 */
export function writeEvidence(rel, data) {
  const p = evidencePath(rel);
  fs.writeFileSync(p, data);
  return p;
}
