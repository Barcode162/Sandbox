// Perf scenario for [A3]. FROZEN signatures.
import type { BlotKind, PerfReport, Sim, TowerKind } from '../contracts/types';
import { TOWER_ORDER, TOWERS } from '../data/towers';
import { FIELD, HUD_TOP } from '../data/map';
import { createCore } from './index';
import { PATH_TOTAL } from './path';
import { placementFail } from './placement';
import { acquireProjectile } from './pool';
import { createRng } from './rng';

/**
 * Targets the field is topped up to before every step. Pops and expiries inside a step eat into them, so
 * they sit above the [A3] floor (≥ 500 blots, ≥ 1,000 projectiles measured after the step).
 */
export const STRESS = { blots: 520, towers: 30, projectiles: 1100, round: 18 } as const;

/** Blot mix for the storm: mostly Blotch/Splash/Dot, with Wax, Streak and a few Knots (no boss). */
const MIX: readonly BlotKind[] = ['blotch', 'blotch', 'blotch', 'splash', 'splash', 'splat', 'drop', 'dot', 'dot', 'dot', 'wax', 'wax', 'streak', 'knot'];
/** Valid tier combos cycled over the towers (every one passes tiersValid). */
const TIERS: readonly (readonly [number, number])[] = [[0, 0], [2, 0], [0, 2], [3, 1], [1, 3], [1, 1], [3, 0], [0, 3]];

/** The first `n` valid tower spots on a 24-px lattice, scanning rows top to bottom (deterministic). */
export function stressSpots(n: number): { kind: TowerKind; x: number; y: number }[] {
  const out: { kind: TowerKind; x: number; y: number }[] = [];
  for (let y = HUD_TOP + 24; y < 720 && out.length < n; y += 24) {
    for (let x = 24; x < FIELD.w && out.length < n; x += 24) {
      const kind = TOWER_ORDER[out.length % TOWER_ORDER.length];
      if (placementFail(kind, x, y, out) === null) out.push({ kind, x, y });
    }
  }
  return out;
}

/** A sim holding 500 blots, 30 towers (mixed kinds/tiers) and ~1,000 projectiles, kept topped up. */
export function buildStressSim(seed = 3): Sim {
  const core = createCore({ seed, startMoney: 1e9, startLives: 1e9, startRound: STRESS.round, noWaves: true });
  const { state, ctx } = core;
  const rng = createRng(seed ^ 0x5eed);
  const spots = stressSpots(STRESS.towers);
  spots.forEach((p, i) => core.addTower(p.kind, p.x, p.y, TIERS[i % TIERS.length]));
  core.beginRound();

  function topUp(): void {
    while (state.blots.count < STRESS.blots) {
      const kind = MIX[rng.int(MIX.length)];
      if (!core.spawnBlot(kind, rng.range(0, PATH_TOTAL * 0.92), rng.next() < 0.1, 0, 0)) break;
    }
    while (state.projectiles.count < STRESS.projectiles) {
      const p = acquireProjectile(state);
      if (!p) break;
      const t = state.towers[rng.int(state.towers.length)];
      const a = rng.range(0, Math.PI * 2);
      const v = 720 / 60;
      p.id = ctx.nextSourceId(); p.kind = 'quill'; p.towerId = t.id;
      p.x = p.px = p.sx = t.x; p.y = p.py = p.sy = t.y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.angle = a;
      p.damage = 1; p.damageType = 'cut'; p.pierceLeft = 2; p.travelled = 0; p.maxTravel = 150 * 1.3;
      p.detect = false; p.areaClass = false; p.multVs = TOWERS.tern.base.multVs; p.slowPct = 0; p.slowDur = 0; p.hitCount = 0;
      p.tx = t.x; p.ty = t.y; p.t = 0; p.arcTicks = 0; p.splashRadius = 0; p.splashMax = 0; p.stun = 0; p.skipsLeft = 0;
    }
  }
  topUp();
  const inner = core.sim;
  return {
    get state() { return inner.state; },
    get events() { return inner.events; },
    enqueue: (cmd) => inner.enqueue(cmd),
    step() { topUp(); inner.step(); },
  };
}

/** Time `steps` sim steps with the supplied clock (performance.now in the browser). */
export function runPerf(sim: Sim, steps: number, now: () => number, heapMB: () => number | null): PerfReport {
  const times = new Float64Array(steps);
  const heapStartMB = heapMB();
  for (let i = 0; i < steps; i++) { const t0 = now(); sim.step(); times[i] = now() - t0; }
  times.sort();
  let sum = 0;
  for (let i = 0; i < steps; i++) sum += times[i];
  const at = (q: number): number => (steps ? times[Math.min(steps - 1, Math.floor(steps * q))] : 0);
  const s = sim.state;
  return {
    blots: s.blots.count, towers: s.towers.length, projectiles: s.projectiles.count, steps,
    meanStepMs: steps ? sum / steps : 0, p95StepMs: at(0.95), p99StepMs: at(0.99), maxStepMs: steps ? times[steps - 1] : 0,
    heapStartMB, heapEndMB: heapMB(),
  };
}
