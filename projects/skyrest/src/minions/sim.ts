// src/minions/sim.ts — owned by WO-004 (stretch: small rock minions). Pure: no three/DOM.
// FROZEN signatures: createMinions, stepMinions. Scaffold: all inactive.
import type { Intent, MinionState, SimState } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';

export function createMinions(): MinionState[] {
  const out: MinionState[] = [];
  for (let i = 0; i < ARENA.minionPool; i++) {
    out.push({ id: i, pos: { x: 0, z: 0 }, prevPos: { x: 0, z: 0 }, facing: 0, prevFacing: 0, action: 'inactive', actionFrame: 0, hp: 0, hitFlash: 0, ext: {} });
  }
  return out;
}

export function stepMinions(s: SimState, _intent: Readonly<Intent>): void {
  for (let i = 0; i < s.minions.length; i++) {
    const m = s.minions[i]!;
    if (m.action === 'inactive') continue;
    m.actionFrame++;
    if (m.hitFlash > 0) m.hitFlash--;
  }
}
