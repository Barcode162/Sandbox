// Board condition 1 capture sheets, drawn with the shared renderers so WO-005 can pixel-diff them in
// Chromium: 'blots-grid' (9 kinds × {plain, Pale} × {normal, colourblind}) and 'towers-sheet'
// (4 kinds × the 12 valid tier combos).
import type { BlotKind, TowerKind } from '../contracts/types';
import { P } from '../data/palette';
import { LOGICAL_H, LOGICAL_W } from '../data/map';
import { BLOTS } from '../data/blots';
import { TOWERS, TOWER_ORDER, tiersValid } from '../data/towers';
import { drawBlotShape } from '../render/blots';
import { drawTowerSprite } from '../render/towers';
import { type Ctx, displayFont, uiFont } from './draw';

const KINDS: readonly BlotKind[] = ['dot', 'drop', 'splat', 'splash', 'blotch', 'streak', 'wax', 'knot', 'inkmaw'];
const VARIANTS: readonly { label: string; pale: boolean; cb: boolean }[] = [
  { label: 'plain', pale: false, cb: false },
  { label: 'Pale', pale: true, cb: false },
  { label: 'plain · colourblind', pale: false, cb: true },
  { label: 'Pale · colourblind', pale: true, cb: true },
];

/** Every valid (A, B) tier pair in a fixed reading order: base, A1–A3, B1–B3, then crosspaths. */
export const TIER_COMBOS: readonly (readonly [number, number])[] = (() => {
  const out: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [1, 1], [2, 1], [3, 1], [1, 2], [1, 3]];
  return out.filter(([a, b]) => tiersValid(a, b));
})();

export function drawBlotsGrid(c: Ctx, nowMs: number): void {
  c.fillStyle = P.paper;
  c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  c.font = displayFont(28);
  c.fillStyle = P.ink;
  c.fillText('Blots', 24, 40);
  const left = 150, top = 70, cw = (LOGICAL_W - left - 10) / KINDS.length, ch = (LOGICAL_H - top - 10) / VARIANTS.length;
  c.font = uiFont(14);
  c.textAlign = 'center';
  KINDS.forEach((k, i) => { c.fillStyle = P.ink; c.fillText(BLOTS[k].name, left + cw * (i + 0.5), top - 8); });
  c.textAlign = 'left';
  VARIANTS.forEach((v, j) => {
    const y = top + ch * j;
    c.fillStyle = j % 2 ? P.paperShade : P.paper;
    c.fillRect(0, y, LOGICAL_W, ch);
    c.fillStyle = P.ink;
    c.font = uiFont(14);
    c.fillText(v.label, 16, y + ch / 2 + 5);
    KINDS.forEach((k, i) => {
      const x = left + cw * (i + 0.5);
      const def = BLOTS[k];
      const scale = def.radius > 30 ? Math.min(1, (cw * 0.42) / def.radius) : 1.6;
      drawBlotShape(c, k, x, y + ch / 2, { pale: v.pale, colourblind: v.cb, scale, phase: nowMs / 1000, alpha: 1 });
      if (v.pale && !def.paleEligible) {
        c.font = uiFont(12, 400);
        c.fillStyle = P.inkSoft;
        c.textAlign = 'center';
        c.fillText('not Pale in play', x, y + ch - 10);
        c.textAlign = 'left';
      }
    });
  });
}

export function drawTowersSheet(c: Ctx, nowMs: number): void {
  c.fillStyle = P.paper;
  c.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  const top = 28, cw = LOGICAL_W / TIER_COMBOS.length, ch = (LOGICAL_H - top) / 4;
  c.font = uiFont(12);
  c.textAlign = 'center';
  TIER_COMBOS.forEach(([a, b], i) => { c.fillStyle = P.inkSoft; c.fillText(`A${a} · B${b}`, cw * (i + 0.5), 18); });
  TOWER_ORDER.forEach((kind: TowerKind, j) => {
    const y = top + ch * j;
    c.fillStyle = j % 2 ? P.paperShade : P.paper;
    c.fillRect(0, y, LOGICAL_W, ch);
    c.fillStyle = P.ink;
    c.font = uiFont(12);
    c.textAlign = 'left';
    c.fillText(TOWERS[kind].name, 6, y + 16);
    TIER_COMBOS.forEach((tiers, i) => {
      drawTowerSprite(c, kind, tiers, cw * (i + 0.5), y + ch / 2 + 6, { angle: -Math.PI / 2, scale: 1.25, nowMs, coaster: true });
    });
  });
  c.textAlign = 'left';
}
