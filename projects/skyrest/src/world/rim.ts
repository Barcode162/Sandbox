// src/world/rim.ts — owned by WO-002. The arena lip's dressing (F-016): bush clumps and rock clusters set
// irregularly round the rim so its far silhouette reads as a broken island edge, never one smooth planet arc.
// Pure (no three): rocks.ts builds the stones, foliage.ts the bushes, from this one layout.
import { makeRng } from '../core/rng.ts';
import { SCENERY } from '../tuning/world.ts';
import { ARENA } from '../tuning/arena.ts';
import { arenaRimRadius } from './ground.ts';

export interface RimProp { kind: 'bush' | 'rock'; x: number; z: number; theta: number; size: number; seed: number }

/** Gaps left open: the bridge mouth (P1) and the little arena waterfall's lip. */
const KEEP_CLEAR: readonly { x: number; z: number; r: number }[] = [
  { x: ARENA.bridgeFoot.x, z: ARENA.bridgeFoot.z, r: 3.4 },
  { x: -3, z: -15.4, r: 2.0 },
];

/** Angular step between props (rad): 0.18–0.3, i.e. ≈ 26 props round the lip. */
const STEP_MIN = 0.18, STEP_MAX = 0.3;

let cache: RimProp[] | null = null;

export function rimProps(): readonly RimProp[] {
  if (cache) return cache;
  const rnd = makeRng(1607);
  const out: RimProp[] = [];
  const arenaTrees = SCENERY.trees.filter((t) => t.y === undefined);
  let th = rnd() * 0.3;
  let i = 0;
  while (th < Math.PI * 2 - 0.1) {
    const bush = rnd() < 0.55;
    // Bushes sit on the lip (they may hang over it); rocks a little inside it, half-sunk.
    const R = arenaRimRadius(th) - (bush ? 0.1 + rnd() * 0.3 : 0.35 + rnd() * 0.4);
    const x = Math.sin(th) * R, z = -Math.cos(th) * R;
    const blocked = KEEP_CLEAR.some((c) => Math.hypot(x - c.x, z - c.z) < c.r)
      || arenaTrees.some((t) => Math.hypot(x - t.x, z - t.z) < t.canopyR + 0.6)
      || ARENA.colliders.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 0.8);
    if (!blocked) out.push({ kind: bush ? 'bush' : 'rock', x, z, theta: th, size: bush ? 0.7 + rnd() * 0.4 : 0.45 + rnd() * 0.45, seed: 900 + i });
    th += STEP_MIN + rnd() * (STEP_MAX - STEP_MIN);
    i++;
  }
  cache = out;
  return out;
}
