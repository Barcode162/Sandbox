// Board condition 1 capture sheets, drawn with the shared renderers so WO-005 can pixel-diff them in
// Chromium (scripts/e2e/pixeldiff.mjs finds cells by paper gutters, so the sheets are plain --paper with
// no labels, tints or grain — any non-paper pixel would read as a cell):
//  · 'blots-grid'  : 9 columns (dot … inkmaw) × 4 rows (plain, Pale, plain+colourblind, Pale+colourblind)
//  · 'towers-sheet': 12 columns (TIER_COMBOS order) × 4 rows (tern, frog, koi, owl)
import type { BlotKind } from '../contracts/types';
import { P } from '../data/palette';
import { LOGICAL_H, LOGICAL_W } from '../data/map';
import { BLOTS } from '../data/blots';
import { TOWER_ORDER, tiersValid } from '../data/towers';
import { drawBlotShape } from '../render/blots';
import { drawTowerSprite } from '../render/towers';
import type { Ctx } from './draw';

export const BLOT_SHEET_KINDS: readonly BlotKind[] = ['dot', 'drop', 'splat', 'splash', 'blotch', 'streak', 'wax', 'knot', 'inkmaw'];
export const BLOT_SHEET_VARIANTS: readonly { pale: boolean; cb: boolean }[] = [
  { pale: false, cb: false }, { pale: true, cb: false }, { pale: false, cb: true }, { pale: true, cb: true },
];

/** Every valid (A, B) tier pair in a fixed reading order: base, A1–A3, B1–B3, then crosspaths. */
export const TIER_COMBOS: readonly (readonly [number, number])[] = (
  [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [1, 1], [2, 1], [3, 1], [1, 2], [1, 3]] as [number, number][]
).filter(([a, b]) => tiersValid(a, b));

export function drawBlotsGrid(c: Ctx, nowMs: number): void {
  c.fillStyle = P.paper;
  c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  const cw = LOGICAL_W / BLOT_SHEET_KINDS.length, ch = LOGICAL_H / BLOT_SHEET_VARIANTS.length;
  BLOT_SHEET_VARIANTS.forEach((v, j) => {
    BLOT_SHEET_KINDS.forEach((k, i) => {
      const r = BLOTS[k].radius;
      // ≤ 40 % of the cell, so every cell keeps a paper gutter on all sides
      const scale = Math.min(1.8, (Math.min(cw, ch) * 0.36) / r);
      drawBlotShape(c, k, cw * (i + 0.5), ch * (j + 0.5), { pale: v.pale, colourblind: v.cb, scale, phase: nowMs / 1000, alpha: 1 });
    });
  });
}

export function drawTowersSheet(c: Ctx, nowMs: number): void {
  c.fillStyle = P.paper;
  c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  const cw = LOGICAL_W / TIER_COMBOS.length, ch = LOGICAL_H / TOWER_ORDER.length;
  TOWER_ORDER.forEach((kind, j) => {
    TIER_COMBOS.forEach((tiers, i) => {
      drawTowerSprite(c, kind, tiers, cw * (i + 0.5), ch * (j + 0.5), { angle: -Math.PI / 2, scale: 1.1, nowMs, coaster: true });
    });
  });
}
