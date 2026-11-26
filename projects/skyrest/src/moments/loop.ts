// src/moments/loop.ts — owned by WO-004: F1 title, F5 telegraph, F7 hurt, F8 phase 2, F9 death, F10 victory, F11 pause
// (experience.md §11). Each script is seeded and returns `ok`-worthy notes only when its trigger really happened.
import type { MomentApi, MomentId, MomentScript, SimState } from '../contracts.ts';
import { dirX, dirZ } from '../core/math.ts';
import { MOMENT_SEED } from './common.ts';

const has = (s: Readonly<SimState>, pred: (e: SimState['events'][number]) => boolean) => s.events.some(pred);

/** Put the hero at (distance, bearing°) from the golem's facing, standing still. */
function placeHero(api: MomentApi, d: number, bearingDeg: number): void {
  const s = api.state();
  const g = s.golem;
  const f = g.facing + (bearingDeg * Math.PI) / 180;
  s.hero.pos.x = s.hero.prevPos.x = g.pos.x + dirX(f) * d;
  s.hero.pos.z = s.hero.prevPos.z = g.pos.z + dirZ(f) * d;
}

/** Hero lands one hit so the golem takes damage (spawn distance is in reach). */
function strike(api: MomentApi): boolean {
  api.inject({ attack: true }, 1);
  return api.stepUntil((s) => has(s, (e) => e.type === 'hit' && e.target === 'golem'), 60);
}

const killGolem = (api: MomentApi): boolean => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  api.setFlags({ golemPassive: true, heroInvulnerable: true, forceDamage: 99999, forceCrit: 0 });
  api.step(30);
  api.inject({ attack: true }, 1);
  return api.stepUntil((s) => has(s, (e) => e.type === 'death' && e.target === 'golem'), 120);
};

const fail = (why: string): never => {
  throw new Error(why);
};

export const LOOP_MOMENTS: Partial<Record<MomentId, MomentScript>> = {
  F1: (api) => {
    api.setSeed(MOMENT_SEED);
    api.step(180); // 3 s on the title
    return api.state().phase === 'title' ? 'title, 3 s in' : fail('left the title');
  },
  F5: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    api.setFlags({ heroInvulnerable: true });
    const ok = api.stepUntil((s) => has(s, (e) => e.type === 'telegraph' && e.attack === 'slam'), 600);
    if (!ok) fail('no slam telegraph');
    // The hero backs out of the circle while the fists rise (+600 ms).
    api.inject({ moveX: 0.15, moveY: -1 }, 28);
    api.step(36);
    return 'slam telegraph +600 ms';
  },
  F7: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    const s = api.state();
    (s.golem.ext as { firstWait: number }).firstWait = 0;
    s.golem.cooldown = 0;
    placeHero(api, 2.9, -62); // on its flank (away from the blossom tree): the sweep's arc
    const ok = api.stepUntil((st) => has(st, (e) => e.type === 'hit' && e.target === 'hero' && e.kind === 'sweep'), 400);
    if (!ok) fail('sweep never connected');
    api.step(6); // +100 ms
    return 'sweep connects +100 ms';
  },
  F8: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    api.setFlags({ golemPassive: true, heroInvulnerable: true });
    api.step(30);
    const g = api.state().golem;
    g.hp = Math.floor(g.maxHp * 0.5) + 1;
    if (!strike(api)) fail('no hit');
    const ok = api.stepUntil((s) => s.golem.enraged, 120);
    if (!ok) fail('no phase 2');
    api.step(54); // +900 ms
    return 'the Guardian kindles +900 ms';
  },
  F9: (api) => {
    if (!killGolem(api)) fail('no kill');
    api.step(42); // +700 ms of sim time (the slow-mo shows on the wall clock)
    return 'crumble + coin fountain +700 ms';
  },
  F10: (api) => {
    if (!killGolem(api)) fail('no kill');
    api.step(150); // +2.6 s: coins arriving in the pill, card up
    return api.state().phase === 'victory' ? 'SKY CLEARED +2.6 s' : fail('no victory');
  },
  F11: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    api.setFlags({ golemPassive: true });
    api.step(60);
    api.control.setPaused(true);
    return 'paused';
  },
};
