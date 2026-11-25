// src/moments/loop.ts — owned by WO-004: F1 title, F5 telegraph, F7 hurt, F8 phase 2, F9 death, F10 victory, F11 pause.
import type { MomentId, MomentScript } from '../contracts.ts';
import { MOMENT_SEED } from './common.ts';

const fightUntil = (pred: Parameters<Parameters<MomentScript>[0]['stepUntil']>[0], after: number, limit = 1800): MomentScript => (api) => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  const ok = api.stepUntil(pred, limit);
  api.step(after);
  return ok ? 'reached' : 'not reached (scaffold)';
};

const killGolem: MomentScript = (api) => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  api.setFlags({ golemPassive: true, heroInvulnerable: true, forceDamage: 99999 });
  api.step(100);
  api.inject({ attack: true }, 1);
  return api.stepUntil((s) => s.events.some((e) => e.type === 'death' && e.target === 'golem'), 120) ? 'killed' : 'no kill (scaffold)';
};

export const LOOP_MOMENTS: Partial<Record<MomentId, MomentScript>> = {
  F1: (api) => {
    api.setSeed(MOMENT_SEED);
    api.step(180); // boot + 3 s on the title
    return 'title';
  },
  F5: fightUntil((s) => s.events.some((e) => e.type === 'telegraph'), 36), // +600 ms
  F7: (api) => fightUntil((s) => s.events.some((e) => e.type === 'hit' && e.target === 'hero'), 6)(api), // +100 ms
  F8: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    api.setFlags({ golemPassive: true });
    api.step(100);
    const g = api.state().golem;
    g.hp = Math.floor(g.maxHp * 0.5) + 1;
    api.inject({ attack: true }, 1);
    const ok = api.stepUntil((s) => s.golem.enraged, 120);
    api.step(54); // +900 ms
    return ok ? 'enraged' : 'no phase 2 yet (scaffold)';
  },
  F9: (api) => {
    const note = killGolem(api);
    api.step(42); // +700 ms
    return note;
  },
  F10: (api) => {
    const note = killGolem(api);
    api.stepUntil((s) => s.phase === 'victory', 600);
    api.step(60);
    return note;
  },
  F11: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    api.step(60);
    api.control.setPaused(true);
    return 'paused';
  },
};
