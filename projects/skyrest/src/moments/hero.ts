// src/moments/hero.ts — owned by WO-003: F3 (mid-combo hit-stop), F4 (crit finisher), F6 (slam impact + perfect dodge).
import type { MomentId, MomentScript } from '../contracts.ts';
import { comboTo, MOMENT_SEED } from './common.ts';

export const HERO_MOMENTS: Partial<Record<MomentId, MomentScript>> = {
  F3: comboTo(2, 2), // +40 ms, inside hit-stop
  F4: (api) => {
    api.setSeed(MOMENT_SEED);
    api.setFlags({ forceCrit: 1 });
    return comboTo(3, 4)(api); // +60 ms
  },
  F6: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    api.setFlags({ heroInvulnerable: true });
    const ok = api.stepUntil((s) => s.events.some((e) => e.type === 'impact'), 900);
    api.step(5); // +80 ms
    return ok ? 'slam impact' : 'no impact yet (scaffold)';
  },
};
