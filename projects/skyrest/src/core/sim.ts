// src/core/sim.ts — owned by WO-004 (orchestration order is part of the contract; keep it).
// One fixed step: clear events → copy prev transforms → time-scale timer → flow → (hit-stop freeze) → hero → hero hits
// → golem (also steps s.hazards) → minions.
import type { HazardState, Intent, SimState } from '../contracts.ts';
import { ARENA } from '../tuning/arena.ts';
import { seedWord } from './rng.ts';
import { copyVec } from './math.ts';
import { stepFlow } from './flow.ts';
import { bufferHeroInput, createHero, stepHero } from '../hero/sim.ts';
import { resolveHeroAttacks } from '../hero/combat.ts';
import { createGolem, stepGolem } from '../golem/sim.ts';
import { createMinions, stepMinions } from '../minions/sim.ts';

export function createSim(seed: number): SimState {
  return {
    seed, rng: seedWord(seed), frame: 0, phase: 'title', phaseFrame: 0, hitstop: 0, wave: 1, coins: 0,
    fightFrames: 0, timeScale: 1, timeScaleFrames: 0,
    hero: createHero(), golem: createGolem(), minions: createMinions(), hazards: createHazards(), events: [],
    flags: { heroInvulnerable: false, golemPassive: false, forceCrit: -1, forceDamage: 0 },
  };
}

export function createHazards(): HazardState[] {
  const out: HazardState[] = [];
  for (let i = 0; i < ARENA.hazardPool; i++)
    out.push({ active: false, kind: 'shockwave', pos: { x: 0, z: 0 }, age: 0, frames: 0, r0: 0, r1: 0, band: 0, damage: 0, spent: false });
  return out;
}

/** Fresh hero/golem/minions for the next attempt; keeps seed stream, coins, wave and flags. */
export function resetWave(s: SimState): void {
  s.hero = createHero();
  s.golem = createGolem();
  s.minions = createMinions();
  s.hazards = createHazards();
  s.hitstop = 0;
  s.fightFrames = 0;
  s.timeScale = 1;
  s.timeScaleFrames = 0;
}

export function stepSim(s: SimState, intent: Readonly<Intent>): void {
  s.events.length = 0;
  s.frame++;
  s.phaseFrame++;
  const h = s.hero, g = s.golem;
  copyVec(h.prevPos, h.pos);
  h.prevFacing = h.facing;
  copyVec(g.prevPos, g.pos);
  g.prevFacing = g.facing;
  for (let i = 0; i < s.minions.length; i++) {
    const m = s.minions[i]!;
    copyVec(m.prevPos, m.pos);
    m.prevFacing = m.facing;
  }
  if (s.timeScaleFrames > 0 && --s.timeScaleFrames === 0) s.timeScale = 1;
  stepFlow(s, intent);
  if (s.phase === 'fight') s.fightFrames++;
  if (s.hitstop > 0) {
    s.hitstop--;
    if (s.phase === 'fight') bufferHeroInput(s, intent);
    return;
  }
  stepHero(s, intent);
  resolveHeroAttacks(s, intent);
  stepGolem(s, intent);
  stepMinions(s, intent);
}
