// src/fx/index.ts — owned by WO-003. Sword arc trails, hit sparks, dust, shockwave rings, damage numbers
// (DOM in ctx.overlay; crits bigger + gold), camera kick on hit. Pools only: no allocation per hit.
import type { CreateFx } from '../contracts.ts';

export const createFx: CreateFx = (_rig) => ({
  init() {},
  update() {},
  setQuality() {},
  dispose() {},
});
