/**
 * Canvas 2D renderer (§4.6 camera, §5 look, §6 juice, §7 frames). OWNER: WO-003.
 * Reads SimState + ViewState; never mutates the sim. Hit-stop and shake are render-only (§6).
 * STUB (WO-001): flat water, plain discs, a fixed camera at 64% height. Replace entirely.
 */
import type { Renderer, SimEvent, SimState, ViewState } from '../contracts';
import { PALETTE } from './palette';

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D unavailable');
  let w = 1, h = 1, dpr = 1;
  const drawn = new Map<number, { x: number; y: number; r: number }>();

  return {
    resize(cssW, cssH, ratio) {
      w = cssW; h = cssH; dpr = ratio;
      canvas.width = Math.round(cssW * ratio);
      canvas.height = Math.round(cssH * ratio);
    },
    frame(sim: SimState, _view: ViewState, _ev: readonly SimEvent[], _dt: number) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = PALETTE.waterA;
      ctx.fillRect(0, 0, w, h);
      const s = Math.min(w / 100, h / 150);
      const ox = (w - 100 * s) / 2;
      const frogPad = sim.river.pads[sim.frog.padId]!;
      const camY = frogPad.y;
      const sx = (x: number) => ox + x * s;
      const sy = (y: number) => h * 0.64 - (y - camY) * s;
      drawn.clear();
      for (const p of sim.river.pads) {
        if (p.kind === 'bank') continue;
        const x = sx(p.x), y = sy(p.y), r = p.r * s;
        if (y < -r || y > h + r) continue;
        drawn.set(p.id, { x, y, r });
        ctx.fillStyle = PALETTE.pad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.frog;
      ctx.beginPath();
      ctx.arc(sx(frogPad.x), sy(frogPad.y), 4 * s, 0, Math.PI * 2);
      ctx.fill();
    },
    pickPad(cx, cy) {
      for (const [id, c] of drawn) if (Math.hypot(cx - c.x, cy - c.y) <= c.r * 1.4) return id;
      return null;
    },
    padOnScreen(id) {
      return drawn.get(id) ?? null;
    },
  };
}
