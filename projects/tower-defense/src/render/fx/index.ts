// Shared particles + rings with the §10.5 caps — STUB (WO-002 implements). FROZEN signature.
import type { DrawPass, Fx, RenderFrame, WorldLayer } from '../../contracts/types';

export interface FxSystem extends Fx, WorldLayer {}

export function createFx(): FxSystem {
  // TODO(WO-002): pooled flecks (cap 600, 6/2/0 tiers), rings never culled, sparks; draws in passes 'particles' and 'rings'.
  return {
    liveParticles: 0,
    ring() {}, flecks() {}, sparks() {},
    onSimEvent() {}, update() {}, reset() {},
    draw(_f: RenderFrame, _pass: DrawPass) {},
  };
}
