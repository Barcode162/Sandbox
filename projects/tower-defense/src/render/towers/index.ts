// Tower sprites (4 kinds × 12 valid tier combos), projectiles, beams, pulses, decals, fire feel — STUB (WO-003). FROZEN signatures.
import type { DrawPass, Fx, RenderFrame, TowerKind, WorldLayer } from '../../contracts/types';

export interface SpriteOpts {
  angle: number; // facing (radians)
  scale?: number;
  alpha?: number;
  /** Real-time ms for ambient motion (sway, streamers, rotating rays); 0 = static. */
  nowMs?: number;
  /** Draw the coaster disc, hard shadow and tier notches (§7 Tower markers). */
  coaster?: boolean;
}

/** One sprite for (kind, tiers); used in the world, the ghost, satchel cards, portraits and upgrade previews. */
export function drawTowerSprite(_ctx: CanvasRenderingContext2D, _kind: TowerKind, _tiers: readonly [number, number], _x: number, _y: number, _o: SpriteOpts): void {
  // TODO(WO-003)
}

/** World layer for passes 'decals', 'projectiles', 'towers'; reacts to fire/land/pulse/beam/place/upgrade/sell events. */
export function createTowerLayer(_fx: Fx): WorldLayer {
  return { onSimEvent() {}, update() {}, reset() {}, draw(_f: RenderFrame, _p: DrawPass) {} };
}
