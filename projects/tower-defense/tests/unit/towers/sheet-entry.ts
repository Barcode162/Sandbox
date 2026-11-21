// Browser entry for the sheet test (bundled by sheet.test.ts, never by the app).
import { drawTowerSheet, drawTowerSprite, SHEET, TOWER_COMBOS } from '../../../src/render/towers';
import { TOWER_ORDER } from '../../../src/data/towers';

/** Per-cell fraction of sprite-box pixels that differ from the left neighbour (row-wise, 4 × 11 pairs). */
function cellDiffs(ctx: CanvasRenderingContext2D): number[][] {
  const out: number[][] = [];
  const box = { w: SHEET.cellW, h: SHEET.cellH - SHEET.labelH };
  for (let row = 0; row < TOWER_ORDER.length; row++) {
    const diffs: number[] = [];
    const y = SHEET.y0 + row * SHEET.cellH + SHEET.labelH;
    for (let col = 1; col < TOWER_COMBOS.length; col++) {
      const a = ctx.getImageData(SHEET.x0 + (col - 1) * SHEET.cellW, y, box.w, box.h).data;
      const b = ctx.getImageData(SHEET.x0 + col * SHEET.cellW, y, box.w, box.h).data;
      let n = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 48) n++;
      }
      diffs.push(n / (box.w * box.h));
    }
    out.push(diffs);
  }
  return out;
}

/** Same cell geometry but with a flat background, so the checkerboard never counts as a difference. */
function flatSheet(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#F3EAD7';
  ctx.fillRect(0, 0, 1280, 720);
  TOWER_ORDER.forEach((kind, row) => TOWER_COMBOS.forEach((tiers, col) => {
    drawTowerSprite(ctx, kind, tiers, SHEET.x0 + col * SHEET.cellW + SHEET.cx, SHEET.y0 + row * SHEET.cellH + SHEET.cy,
      { angle: kind === 'koi' ? -Math.PI / 2 : SHEET.angle, scale: SHEET.scale, coaster: true });
  }));
}

(window as unknown as Record<string, unknown>).sheet = {
  draw(nowMs: number) {
    const ctx = (document.getElementById('c') as HTMLCanvasElement).getContext('2d')!;
    drawTowerSheet(ctx, nowMs);
  },
  diffs() {
    const ctx = (document.getElementById('c') as HTMLCanvasElement).getContext('2d', { willReadFrequently: true })!;
    flatSheet(ctx);
    const d = cellDiffs(ctx);
    drawTowerSheet(ctx, 0);
    return d;
  },
};

// ───────── a live battle frame: the real tower systems on the fake core, drawn by the real tower layer ─────────
import { createTowerLayer } from '../../../src/render/towers';
import { createFx } from '../../../src/render/fx';
import { PATH_POINTS } from '../../../src/data/map';
import { BLOTS } from '../../../src/data/blots';
import { P } from '../../../src/data/palette';
import { DEFAULT_SETTINGS } from '../../../src/app/settings';
import type { BlotKind, RenderFrame, TowerKind } from '../../../src/contracts/types';
import { createFake } from './fake-ctx';

(window as unknown as Record<string, unknown>).battle = (ticks: number): string[] => {
  const ctx = (document.getElementById('c') as HTMLCanvasElement).getContext('2d')!;
  const f = createFake();
  const fx = createFx();
  const layer = createTowerLayer(fx);
  const errs: string[] = [];
  const setup: [TowerKind, number, number, [number, number]][] = [
    ['tern', 520, 300, [3, 0]], ['tern', 400, 250, [1, 3]], ['frog', 360, 340, [1, 3]], ['koi', 520, 410, [1, 3]],
    ['owl', 380, 470, [3, 0]], ['owl', 300, 520, [0, 3]], ['koi', 290, 455, [3, 1]], ['frog', 160, 520, [3, 1]],
  ];
  for (const [k, x, y, t] of setup) {
    const tw = f.tower(k, x, y, t);
    layer.onSimEvent({ type: 'place', towerId: tw.id, kind: k, x, y, cost: 0 }, f.state);
  }
  const mix: BlotKind[] = ['blotch', 'splash', 'wax', 'splat', 'streak', 'knot', 'drop'];
  for (let i = 0; i < ticks; i++) {
    if (i % 6 === 0) f.blot(mix[(i / 6) % mix.length], 640, { pale: i % 42 === 0 });
    f.tick();
    for (const e of f.events) layer.onSimEvent(e, f.state);
    f.events.length = 0;
    layer.update(1000 / 60, f.state);
  }
  const frame: RenderFrame = { ctx, state: f.state, alpha: 0.5, nowMs: ticks * 1000 / 60, dtMs: 16.7, settings: DEFAULT_SETTINGS };
  ctx.fillStyle = P.paper; ctx.fillRect(0, 0, 1280, 720);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); PATH_POINTS.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.strokeStyle = P.kraftEdge; ctx.lineWidth = 48; ctx.stroke(); ctx.strokeStyle = P.kraft; ctx.lineWidth = 44; ctx.stroke();
  layer.draw(frame, 'decals');
  // harness-only blot stand-ins (the blot renderer is WO-002's)
  for (let i = 0; i < f.state.blots.count; i++) {
    const b = f.state.blots.items[i];
    const d = BLOTS[b.kind];
    ctx.globalAlpha = b.pale ? 0.4 : 1;
    ctx.fillStyle = (P as Record<string, string>)[d.color] ?? P.ink;
    ctx.beginPath(); ctx.arc(b.x, b.y, d.radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (const pass of ['projectiles', 'towers', 'particles', 'rings'] as const) { layer.draw(frame, pass); fx.draw(frame, pass); }
  return errs;
};
