// src/moments/world.ts — owned by WO-002: F2 (reference parity), F12 (portrait idle), F13 (landscape idle).
import type { MomentId, MomentScript } from '../contracts.ts';
import { comboTo, MOMENT_SEED } from './common.ts';

const idle: MomentScript = (api) => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  api.setFlags({ golemPassive: true });
  api.step(120);
  return 'fight idle';
};

export const WORLD_MOMENTS: Partial<Record<MomentId, MomentScript>> = {
  F2: (api) => {
    api.setFlags({ forceDamage: 2368, forceCrit: 0 });
    const note = comboTo(1, 7)(api); // +120 ms
    return note;
  },
  F12: idle,
  F13: idle,
};
