// src/moments/hero.ts — owned by WO-003: F3 (mid-combo hit-stop), F4 (crit finisher), F6 (slam impact + perfect dodge).
import type { MomentId, MomentScript, SimEvent, SimFlags } from '../contracts.ts';
import { MOMENT_SEED } from './common.ts';

/** From the canonical spawn, land combo hit `n` with `flags` set AFTER the reset (`lastFlags` just before the
 *  last hit), then step `after` more. */
const combo = (n: 1 | 2 | 3, after: number, flags: Partial<SimFlags> = {}, lastFlags: Partial<SimFlags> = {}): MomentScript => (api) => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  api.setFlags({ golemPassive: true, ...flags });
  api.stepUntil((s) => s.golem.action === 'idle' || s.golem.action === 'walk', 400);
  let hits = 0;
  for (let i = 0; i < n; i++) {
    if (i === n - 1) api.setFlags(lastFlags);
    api.inject({ attack: true }, 1);
    if (api.stepUntil((s) => s.events.some((e) => e.type === 'hit' && e.target === 'golem'), 60)) hits++;
  }
  api.step(after);
  return `combo hits ${hits}/${n}`;
};

const isSlamTelegraph = (e: SimEvent) => e.type === 'telegraph' && (e.attack === 'slam' || e.attack === 'doubleSlam');

export const HERO_MOMENTS: Partial<Record<MomentId, MomentScript>> = {
  // Hit 2 + 40 ms: inside the 70 ms hit-stop (both actors frozen, backslash crescent, sparks + chips mid-air).
  F3: combo(2, 2, { forceCrit: 0 }),
  // Hit 3, forced crit, + 60 ms: airborne overhead chop, vertical crescent + ground crescent, gold number, FOV punch.
  F4: (api) => `${combo(3, 4, { forceCrit: 0 }, { forceCrit: 1 })(api)}; finisher crit forced`,
  // Slam impact + 80 ms, with the hero rolling THROUGH it: the blow lands inside the i-frames (perfect dodge:
  // cyan afterimage, time-scale 0.5).
  F6: (api) => {
    api.setSeed(MOMENT_SEED);
    api.skipTitle();
    api.setFlags({ heroInvulnerable: true });
    // One strike first: the Guardian answers at once from its spawn (the reference staging), no long walk.
    api.stepUntil((st) => st.golem.action === 'idle' || st.golem.action === 'walk', 400);
    api.inject({ attack: true }, 1);
    api.step(30);
    let frames = -1;
    for (let tries = 0; tries < 6 && frames < 0; tries++) {
      if (!api.stepUntil((s) => s.events.some((e) => e.type === 'telegraph'), 900)) break;
      const e = api.state().events.find(isSlamTelegraph);
      if (e && e.type === 'telegraph') frames = e.frames;
      else api.stepUntil((s) => s.golem.action === 'idle' || s.golem.action === 'walk', 400);
    }
    if (frames < 0) return 'no slam telegraph reached';
    // Neutral roll = straight back (facing kept): still inside the circle when the fists land ~5 frames in, and the
    // hero stays low-centre between trees B and C (the reference staging).
    api.step(Math.max(0, frames - 6));
    api.inject({ dodge: true }, 1);
    const hit = api.stepUntil((st) => st.events.some((e) => e.type === 'impact'), 40);
    const perfect = api.state().events.some((e) => e.type === 'perfectDodge');
    api.step(5); // +80 ms
    return hit ? `slam impact${perfect ? ' + perfect dodge' : ' (roll missed the window)'}` : 'no impact';
  },
};
