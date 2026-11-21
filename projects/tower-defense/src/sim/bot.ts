// Headless script runner. FROZEN signature.
// Policy: at each intermission before round r, enqueue script[r] (retrying unaffordable commands each
// tick during the round, in order), then startRound; stop at victory/defeat or after maxRound clears.
import { SIM_HZ, type Command, type RoundScript, type RunSummary, type Sim } from '../contracts/types';
import { ECONOMY } from '../data/economy';
import { TOWERS } from '../data/towers';
import { createSim } from './index';
import { stateHash } from './hash';
import { canPlace } from './placement';
import { tierStatus } from './towers';

export interface PlayOptions {
  seed: number;
  maxRound?: number;
  /** Stop once this round has run for `seconds` (screenshot staging). */
  stopAt?: { round: number; seconds: number };
  /** Optional externally created sim (the app passes its live sim). */
  sim?: Sim;
}

/** Safety stop: a run longer than this many ticks (~2.3 h of sim time) means a stalled round. */
export const MAX_SCRIPT_TICKS = 500_000;

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

type Verdict = 'go' | 'wait' | 'drop';

export function createScriptDriver(script: RoundScript, opts: Omit<PlayOptions, 'sim' | 'seed'> = {}): ScriptDriver {
  const maxRound = opts.maxRound ?? ECONOMY.rounds;
  const stopAt = opts.stopAt;
  const pending: Command[] = [];
  let loadedFor = 0;
  let startedFor = 0;

  /** Can `cmd` succeed with `money` sheets right now? Unaffordable → wait; impossible → drop. */
  function judge(sim: Sim, cmd: Command, money: number): [Verdict, number] {
    const s = sim.state;
    if (cmd.type === 'place') {
      const cost = TOWERS[cmd.kind].cost;
      const fail = canPlace({ ...s, money } as typeof s, cmd.kind, cmd.x, cmd.y, cost);
      return fail === null ? ['go', cost] : fail === 'money' ? ['wait', 0] : ['drop', 0];
    }
    if (cmd.type === 'upgrade') {
      const t = s.towers.find((x) => x.id === cmd.towerId);
      if (!t) return ['wait', 0]; // its place command has not applied yet (or is still unaffordable)
      const cur = t.tiers[cmd.path];
      if (cur >= 3) return ['drop', 0];
      const v = tierStatus(s, t, cmd.path, (cur + 1) as 1 | 2 | 3);
      if (v.status === 'sealed') return ['drop', 0];
      return v.cost <= money ? ['go', v.cost] : ['wait', 0];
    }
    return ['go', 0];
  }

  return {
    beforeStep(sim) {
      const s = sim.state;
      if (s.phase === 'victory' || s.phase === 'defeat') return;
      if (s.phase === 'intermission' && loadedFor < s.round && s.round <= maxRound) {
        loadedFor = s.round;
        const cmds = script[s.round];
        if (cmds) for (const c of cmds) pending.push(c);
      }
      let money = s.money;
      while (pending.length) {
        const [verdict, cost] = judge(sim, pending[0], money);
        if (verdict === 'wait') break;
        const cmd = pending.shift()!;
        if (verdict === 'go') { sim.enqueue(cmd); money -= cost; }
      }
      if (s.phase === 'intermission' && startedFor < s.round && s.round <= maxRound) {
        startedFor = s.round;
        sim.enqueue({ type: 'startRound' });
      }
    },
    done(sim) {
      const s = sim.state;
      if (s.phase === 'victory' || s.phase === 'defeat') return true;
      if (s.tick >= MAX_SCRIPT_TICKS) return true;
      if (s.phase === 'intermission' && s.round > maxRound) return true;
      if (stopAt && s.round === stopAt.round && s.phase === 'round' && s.roundTick >= Math.round(stopAt.seconds * SIM_HZ)) return true;
      return false;
    },
  };
}

export function playScript(script: RoundScript, opts: PlayOptions): RunSummary {
  const sim = opts.sim ?? createSim({ seed: opts.seed });
  const driver = createScriptDriver(script, opts);
  while (!driver.done(sim)) { driver.beforeStep(sim); sim.step(); }
  return summarize(sim);
}
