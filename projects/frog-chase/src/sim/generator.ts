/**
 * River generator (§4.1 G1–G8). OWNER: WO-002. Pure: (seed, tuning) → River. One PRNG stream, in layer order.
 * STUB (WO-001): emits banks + three plain lily pads per layer so the shell boots. Replace entirely.
 */
import type { Decor, Pad, PadKind, River, Tuning } from '../contracts';
import { TUNING } from '../tuning';
import { createRng } from './rng';

export function generateRiver(seed: number, tuning: Tuning = TUNING): River {
  const rng = createRng(seed);
  const pads: Pad[] = [];
  const layers: Pad[][] = [];
  const P = tuning.pitch;
  const add = (layer: number, index: number, x: number, y: number, r: number, kind: PadKind): Pad => {
    const p: Pad = { id: pads.length, layer, index, x, y, r, kind, rot: rng.range(0, Math.PI * 2), phase: rng.range(0, Math.PI * 2) };
    pads.push(p);
    return p;
  };
  layers.push([add(0, 0, tuning.width / 2, 0, 0, 'bank')]);
  for (let k = 1; k <= tuning.layers; k++) {
    layers.push([22, 50, 78].map((x, i) => add(k, i, x, k * P, 10, 'lily')));
  }
  const north = tuning.layers + 1;
  layers.push([add(north, 0, tuning.width / 2, north * P, 0, 'bank')]);
  const decor: Decor[] = [];
  return { seed, layers, pads, decor };
}
