// §5 placement validity. Implemented in WO-001 (pure); owned by WO-002 afterwards.
import type { PlaceFail, SimState, TowerKind } from '../contracts/types';
import { FIELD, FOOTPRINT, HUD_TOP, LOGICAL_H, NO_BUILD, PATH_CLEARANCE } from '../data/map';
import { distanceToPath } from './path';

/** Geometry-only check (rules 1–4). `towers` may be empty. Returns null when valid. */
export function placementFail(
  kind: TowerKind, x: number, y: number,
  towers: readonly { kind: TowerKind; x: number; y: number }[],
): Exclude<PlaceFail, 'money' | 'phase'> | null {
  const fr = FOOTPRINT[kind];
  if (x < fr || x > FIELD.w - fr || y < HUD_TOP + fr || y > LOGICAL_H - fr) return 'bounds';
  if (distanceToPath(x, y) < PATH_CLEARANCE + fr) return 'path';
  for (const c of NO_BUILD) if (Math.hypot(x - c.x, y - c.y) < c.r + fr) return 'noBuild';
  for (const t of towers) if (Math.hypot(x - t.x, y - t.y) < fr + FOOTPRINT[t.kind]) return 'tower';
  return null;
}

/** Full check used by the ghost (§10.2) and the place command: geometry, then money. */
export function canPlace(state: Readonly<SimState>, kind: TowerKind, x: number, y: number, cost: number): PlaceFail | null {
  if (state.phase === 'victory' || state.phase === 'defeat') return 'phase';
  const g = placementFail(kind, x, y, state.towers);
  if (g) return g;
  return state.money < cost ? 'money' : null;
}
