// Blot rendering (§6 shapes, pips, Pale, squash, hit flash) + pop responses — STUB (WO-002). FROZEN signatures.
import type { BlotKind, DrawPass, Fx, RenderFrame, WorldLayer } from '../contracts/types';

export interface BlotDrawOpts { pale: boolean; colourblind: boolean; scale?: number; phase?: number; alpha?: number }

/** Draw one blot shape at (x,y); used by the world layer, the title and the settings colourblind preview (§10.8). */
export function drawBlotShape(_ctx: CanvasRenderingContext2D, _kind: BlotKind, _x: number, _y: number, _o: BlotDrawOpts): void {
  // TODO(WO-002)
}

/** World layer: draws pass 'blots'; on pop/immune/hit events spawns rings/flecks/sparks through fx. */
export function createBlotLayer(_fx: Fx): WorldLayer {
  return { onSimEvent() {}, update() {}, reset() {}, draw(_f: RenderFrame, _p: DrawPass) {} };
}
