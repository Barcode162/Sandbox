// Perf scenario for [A3] — STUB (WO-002 implements). FROZEN signature.
import type { PerfReport, Sim } from '../contracts/types';
import { createSim } from './index';

/** A sim holding 500 blots, 30 towers (mixed kinds/tiers) and ~1,000 projectiles, kept topped up. */
export function buildStressSim(seed = 3): Sim {
  // TODO(WO-002 with WO-003 projectiles)
  return createSim({ seed });
}

/** Time `steps` sim steps with the supplied clock (performance.now in the browser). */
export function runPerf(sim: Sim, steps: number, now: () => number, heapMB: () => number | null): PerfReport {
  const times: number[] = [];
  const heapStartMB = heapMB();
  for (let i = 0; i < steps; i++) { const t0 = now(); sim.step(); times.push(now() - t0); }
  times.sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / Math.max(1, times.length);
  const s = sim.state;
  return {
    blots: s.blots.count, towers: s.towers.length, projectiles: s.projectiles.count, steps,
    meanStepMs: mean, p95StepMs: times[Math.floor(times.length * 0.95)] ?? 0, p99StepMs: times[Math.floor(times.length * 0.99)] ?? 0, maxStepMs: times[times.length - 1] ?? 0,
    heapStartMB, heapEndMB: heapMB(),
  };
}
