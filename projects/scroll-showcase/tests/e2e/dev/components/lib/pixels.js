// Suite-private helpers for the WO-004 component checks: where evidence goes
// (K12) and decoded screenshot pixels.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

/**
 * `$EVIDENCE_DIR/dev/components/`, resolved per K12: EVIDENCE_DIR, then
 * SHOWCASE_EVIDENCE_DIR, then the dossier's evidence directory when the
 * project sits in the Bureau repo, otherwise `evidence-local/`.
 */
export function evidenceDir() {
  const dossier = path.resolve(PROJECT, '../../bureau/missions/M-0001-scroll-showcase/evidence');
  const base = process.env.EVIDENCE_DIR
    || process.env.SHOWCASE_EVIDENCE_DIR
    || (fs.existsSync(dossier) ? dossier : path.join(PROJECT, 'evidence-local'));
  const dir = path.join(base, 'dev', 'components');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Absolute path of a component source file. @param {string} name */
export function componentSource(name) {
  return path.join(PROJECT, 'site', 'js', 'components', name);
}

export function componentFiles() {
  return fs.readdirSync(path.join(PROJECT, 'site', 'js', 'components')).filter((f) => f.endsWith('.js'));
}

/**
 * @typedef {{ width: number, height: number, at(x: number, y: number): [number, number, number] }} Pixels
 * @param {Buffer} png
 * @returns {Pixels}
 */
export function decode(png) {
  const img = pngjs.PNG.sync.read(png);
  return {
    width: img.width,
    height: img.height,
    at(x, y) {
      const i = (y * img.width + x) * 4;
      return [img.data[i], img.data[i + 1], img.data[i + 2]];
    },
  };
}

/** '#F54123' → [245, 65, 35]. @param {string} hex @returns {[number, number, number]} */
export function rgb(hex) {
  const h = hex.trim().replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** @param {[number, number, number]} c */
export const key = (c) => c.join(',');
