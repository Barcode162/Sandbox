// Headless script runner — STUB (WO-002 implements). FROZEN signature.
// Policy: at each intermission before round r, enqueue script[r] (retrying unaffordable commands each
// tick during the round, in order), then startRound; stop at victory/defeat or after maxRound clears.
import type { RoundScript, RunSummary, Sim } from '../contracts/types';
import { createSim } from './index';
import { stateHash } from './hash';

export interface PlayOptions {
  seed: number;
  maxRound?: number;
  /** Stop once this round has run for `seconds` (screenshot staging). */
  stopAt?: { round: number; seconds: number };
  /** Optional externally created sim (the app passes its live sim). */
  sim?: Sim;
}

export function summarize(sim: Sim): RunSummary {
  const s = sim.state;
  const outcome = s.phase === 'victory' ? 'victory' : s.phase === 'defeat' ? 'defeat' : 'running';
  return { outcome, round: s.round, tick: s.tick, lives: s.lives, money: s.money, pops: s.stats.pops, hash: stateHash(s) };
}

/** Bot driver usable step by step (the app's playScript drives it from the real loop). */
export interface ScriptDriver {
  /** Call before each sim.step(); enqueues whatever the script wants this tick. */
  beforeStep(sim: Sim): void;
  done(sim: Sim): boolean;
}

export function createScriptDriver(_script: RoundScript, _opts: Omit<PlayOptions, 'sim' | 'seed'> = {}): ScriptDriver {
  // TODO(WO-002)
  return { beforeStep() {}, done: () => true };
}

export function playScript(script: RoundScript, opts: PlayOptions): RunSummary {
  const sim = opts.sim ?? createSim({ seed: opts.seed });
  const driver = createScriptDriver(script, opts);
  while (!driver.done(sim)) { driver.beforeStep(sim); sim.step(); }
  return summarize(sim);
}
