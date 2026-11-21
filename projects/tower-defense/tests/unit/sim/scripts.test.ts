// WO-002 on the REAL tower systems (WO-003): §8 win and loss scripts, determinism, victory, perf.
// Board condition 5: no skip, no fake tower system. Balance values: data/balance.ts, data/waves.ts, data/blots.ts
// (change table in reports/WO-002.md).
import { describe, expect, it } from 'vitest';
import { createCore, createSim } from '../../../src/sim';
import { playScript } from '../../../src/sim/bot';
import { stateHash } from '../../../src/sim/hash';
import { buildStressSim, runPerf } from '../../../src/sim/bench';
import { LOSS_BY_ROUND, LOSS_SCRIPT, SCRIPT_SEED, WIN_MIN_SEEDS, WIN_SCRIPT } from '../../../src/data/scripts';

describe('§8 reference scripts on the real towers', () => {
  it('the win script reaches victory with ≥ 40 seeds, losing no more than 60 % of them', () => {
    const r = playScript(WIN_SCRIPT, { seed: SCRIPT_SEED });
    expect(r.outcome).toBe('victory');
    expect(r.lives).toBeGreaterThanOrEqual(WIN_MIN_SEEDS);
    expect(r.lives).toBeLessThan(100); // not trivial: the script must bleed somewhere
  });
  it('the loss script reaches defeat by R12', () => {
    const r = playScript(LOSS_SCRIPT, { seed: SCRIPT_SEED });
    expect(r.outcome).toBe('defeat');
    expect(r.round).toBeLessThanOrEqual(LOSS_BY_ROUND);
  });
  it('the same seed and script give the same stateHash twice', () => {
    expect(playScript(WIN_SCRIPT, { seed: SCRIPT_SEED })).toEqual(playScript(WIN_SCRIPT, { seed: SCRIPT_SEED }));
  });
});

describe('determinism and the end of a run', () => {
  it('two sims fed the same commands hash identically every 60 ticks', () => {
    const a = createSim({ seed: 5 }), b = createSim({ seed: 5 });
    const hashes = (sim: typeof a) => {
      const out: string[] = [];
      sim.enqueue({ type: 'place', kind: 'tern', x: 340, y: 510 });
      sim.enqueue({ type: 'autoStart', on: true });
      sim.enqueue({ type: 'startRound' });
      for (let i = 0; i < 6000; i++) { sim.step(); if (i % 60 === 0) out.push(stateHash(sim.state)); }
      return out;
    };
    const ha = hashes(a);
    expect(ha).toEqual(hashes(b));
    expect(new Set(ha).size).toBeGreaterThan(90);
    expect(a.state.round).toBeGreaterThan(1);
  });
  it('clearing R20 is victory, with the best defender', () => {
    const core = createCore({ seed: 1, startRound: 20 });
    const t1 = core.addTower('owl', 860, 360, [0, 0]);
    const t2 = core.addTower('tern', 340, 510, [0, 0]);
    core.sim.enqueue({ type: 'startRound' });
    let victory: unknown = null;
    for (let i = 0; i < 6000 && !victory; i++) {
      core.sim.step();
      for (const e of core.sim.events) if (e.type === 'victory') victory = e;
      const s = core.state;
      for (let j = 0; j < s.blots.count; j++) { const b = s.blots.items[j]; if (b.alive) core.ctx.hit(b, b.hp, 'crush', 0, j % 3 ? t2 : t1, 0, 1); }
    }
    expect(core.state.phase).toBe('victory');
    expect(victory).toMatchObject({ type: 'victory', lives: 100, bestTowerId: t2.pops >= t1.pops ? t2.id : t1.id });
  });
});

describe('[A3] perf (Node)', () => {
  // Vitest runs other files in parallel workers, so one 600-step sample can catch CPU contention. The budget
  // is judged on the best of three samples (a real regression slows all three); WO-005's perf.mjs measures
  // the same scenario in Chromium alone.
  it('runPerf(buildStressSim(), 600): p95 ≤ 4 ms and p99 ≤ 6 ms with ≥ 500 blots, 30 towers, ≥ 1,000 projectiles', () => {
    const sim = buildStressSim();
    for (let i = 0; i < 120; i++) sim.step(); // warm-up (JIT)
    const runs = [0, 1, 2].map(() => runPerf(sim, 600, () => performance.now(), () => null));
    const best = runs.reduce((a, b) => (b.p99StepMs < a.p99StepMs ? b : a));
    console.log(`stress perf (best of 3): mean ${best.meanStepMs.toFixed(3)} p95 ${best.p95StepMs.toFixed(3)} p99 ${best.p99StepMs.toFixed(3)} max ${best.maxStepMs.toFixed(3)} ms · ${best.blots} blots ${best.towers} towers ${best.projectiles} projectiles`);
    expect(best.towers).toBe(30);
    expect(best.blots).toBeGreaterThanOrEqual(500);
    expect(best.projectiles).toBeGreaterThanOrEqual(1000);
    expect(best.p95StepMs).toBeLessThanOrEqual(4);
    expect(best.p99StepMs).toBeLessThanOrEqual(6);
  });
});
