// Sim core — STUB (WO-002 implements). The factory signature and SimState shape are FROZEN (contracts/types.ts).
// Pure: no DOM, no Math.random, no clocks. Fixed 60 Hz. Tick order (architecture §State & data flow):
// commands → hit-stop gate → spawns → movement/leaks → grid → updateAuras → updateTowers → updateProjectiles → compact → round end.
import type { Blot, Command, Sim, SimEvent, SimOptions, SimState } from '../contracts/types';
import { ECONOMY } from '../data/economy';
import { createProjectile } from './towers';

export const BLOT_CAPACITY = 2048;
export const PROJECTILE_CAPACITY = 2048;

export function createBlot(): Blot {
  return { id: 0, alive: false, kind: 'dot', hp: 0, s: 0, ps: 0, x: 0, y: 0, pale: false, slow: 0, slowTicks: 0, frozenTicks: 0, stunTicks: 0, immuneTo: 0, spawnTick: 0, parentId: 0, nextShed: 0 };
}

export function createInitialState(opts: SimOptions): SimState {
  return {
    seed: opts.seed,
    tick: 0,
    round: opts.startRound ?? 1,
    phase: 'intermission',
    lives: opts.startLives ?? ECONOMY.startLives,
    money: opts.startMoney ?? ECONOMY.startMoney,
    autoStart: false,
    hitStop: 0,
    roundTick: 0,
    blots: { items: Array.from({ length: BLOT_CAPACITY }, createBlot), count: 0 },
    towers: [],
    projectiles: { items: Array.from({ length: PROJECTILE_CAPACITY }, createProjectile), count: 0 },
    boss: null,
    stats: { pops: 0, leaked: 0, spent: 0, earned: 0 },
    seen: {},
  };
}

export function createSim(opts: SimOptions): Sim {
  const state = createInitialState(opts);
  const queue: Command[] = [];
  const events: SimEvent[] = [];
  return {
    state,
    events,
    enqueue(cmd) { queue.push(cmd); },
    step() {
      events.length = 0;
      queue.length = 0; // TODO(WO-002): apply commands
      state.tick++;
      if (state.phase === 'round') state.roundTick++;
    },
  };
}
