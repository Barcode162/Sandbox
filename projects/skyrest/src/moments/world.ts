// src/moments/world.ts — owned by WO-002: F2 (reference parity), F12 (portrait idle), F13 (landscape idle).
import type { MomentId, MomentScript } from '../contracts.ts';
import { MOMENT_SEED } from './common.ts';

const idle: MomentScript = (api) => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  api.setFlags({ golemPassive: true });
  api.step(120);
  return 'fight idle';
};

/** F2: first combo hit, forced 2,368 and no crit, + 120 ms. comboTo() reseeds (which clears flags), so the
 *  forced numbers are set here, after the reset, and the combo walk is inlined. */
const f2: MomentScript = (api) => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  api.setFlags({ golemPassive: true, forceDamage: 2368, forceCrit: 0 });
  api.step(100);
  api.inject({ attack: true }, 1);
  const hit = api.stepUntil((s) => s.events.some((e) => e.type === 'hit' && e.target === 'golem'), 60);
  api.step(7); // +120 ms
  return hit ? 'combo hit 1 (2,368, no crit)' : 'combo hit 1 missed';
};

export const WORLD_MOMENTS: Partial<Record<MomentId, MomentScript>> = { F2: f2, F12: idle, F13: idle };
