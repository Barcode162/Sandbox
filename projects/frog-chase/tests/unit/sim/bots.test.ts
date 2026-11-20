// Bots (SC1, §13), determinism at 30 vs 144 Hz (§4.7), heartbeat (polish 14), sim budget.
import { describe, expect, it } from 'vitest';
import type { BotName, BotOptions } from '../../../src/contracts';
import { createLoop } from '../../../src/loop';
import { makeBot } from '../../../src/sim/bots';
import { createSim, heartbeatPhase, isHooked, step } from '../../../src/sim/sim';
import { DT } from '../../../src/tuning';
import { events, run } from './helpers';

describe('bots', () => {
  for (const delayMs of [400, 700, 900]) {
    it(`runner (${delayMs} ms after each landing) wins ≥ 99% of 500 seeds in 20–60 s`, () => {
      let wins = 0, minT = Infinity, maxT = 0;
      for (let seed = 1; seed <= 500; seed++) {
        const s = run(createSim(seed * 101), makeBot('runner', { delayMs }));
        if (s.result?.kind === 'won') {
          wins++;
          minT = Math.min(minT, s.result.timeMs);
          maxT = Math.max(maxT, s.result.timeMs);
        }
      }
      expect(wins / 500).toBeGreaterThanOrEqual(0.99);
      expect(minT).toBeGreaterThanOrEqual(20_000);
      expect(maxT).toBeLessThanOrEqual(60_000);
    });
  }

  it('idler is eaten with cause still (after the hook); forward sinks at layer 6 on seed 7', () => {
    for (let seed = 0; seed < 50; seed++) expect(run(createSim(seed), makeBot('idler')).result).toMatchObject({ kind: 'eaten', cause: 'still' });
    const f = run(createSim(7), makeBot('forward'));
    expect(f.result).toMatchObject({ kind: 'sunk', cause: 'soggy', layer: 6 });
  });

  it('idleAtTau reaches τ ≥ 0.6 alive and grounded, then stops pressing; nearMiss logs near-misses', () => {
    const s = createSim(7);
    const bot = makeBot('idleAtTau', { tau: 0.6 });
    let reached = -1;
    while (!s.result) {
      if (reached < 0 && isHooked(s) && s.frog.phase === 'idle' && s.gator.tau >= 0.6) {
        reached = s.log.length;
      }
      step(s, { press: bot(s) });
    }
    expect(reached).toBeGreaterThan(0);
    expect(s.log.slice(reached).some((e) => e.t === 'hop')).toBe(false);
    expect(s.result.cause).toBe('still');
    const n = run(createSim(7), makeBot('nearMiss'));
    expect(events(n, 'nearMiss').length).toBeGreaterThan(5);
    expect(n.result?.kind).toBe('won');
  });

  it('stopAtLayer parks every hopping bot (screenshots 4 and 5)', () => {
    for (const name of ['runner', 'forward'] as const) {
      const s = createSim(7);
      const bot = makeBot(name, { stopAtLayer: 5 });
      for (let i = 0; i < 1200 && !s.result; i++) step(s, { press: bot(s) });
      expect(s.frog.layer).toBe(5);
    }
  });
});

/** Run a bot through createLoop at a display rate; returns the log. */
function atHz(seed: number, hz: number, name: BotName, opts?: BotOptions): string {
  const s = createSim(seed);
  const bot = makeBot(name, opts);
  const loop = createLoop({ tick: () => step(s, { press: bot(s) }), render: () => {} });
  for (let f = 0; f < hz * 120 && !s.result; f++) loop.advance(1000 / hz);
  return JSON.stringify([s.log, s.result]);
}

describe('determinism (§4.7)', () => {
  it('same seed + bot at 30 vs 144 Hz frames give an identical log, over 200 seeds', () => {
    const bots: [BotName, BotOptions?][] = [['runner'], ['runner', { delayMs: 900 }], ['nearMiss'], ['idleAtTau'], ['forward']];
    for (let seed = 0; seed < 200; seed++) {
      const [name, opts] = bots[seed % bots.length]!;
      const a = atHz(seed, 30, name, opts), b = atHz(seed, 144, name, opts);
      expect(a.length).toBeGreaterThan(100);
      if (a !== b) expect({ seed, name, a }).toEqual({ seed, name, a: b });
    }
  });
});

describe('heartbeat (polish 14)', () => {
  it('phase is 0..1, never jumps, and runs at 60 + 80τ bpm', () => {
    const s = createSim(7);
    const bot = makeBot('idleAtTau');
    let prev = heartbeatPhase(s);
    while (!s.result) {
      step(s, { press: bot(s) });
      const p = heartbeatPhase(s);
      expect(p >= 0 && p < 1).toBe(true);
      const d = (p - prev + 1) % 1;
      expect(d).toBeCloseTo(((60 + 80 * s.gator.tau) / 60) * DT, 9);
      prev = p;
    }
  });
});

describe('budget', () => {
  it('a full 36-layer bot run takes ≤ 150 ms and the p95 step ≤ 0.25 ms (Node)', () => {
    for (let i = 0; i < 5; i++) run(createSim(i), makeBot('runner')); // warm up
    const s = createSim(99);
    const bot = makeBot('runner', { delayMs: 900 });
    const times: number[] = [];
    const t0 = performance.now();
    while (!s.result) {
      const a = performance.now();
      step(s, { press: bot(s) });
      times.push(performance.now() - a);
    }
    const total = performance.now() - t0;
    times.sort((a, b) => a - b);
    expect(s.result.kind).toBe('won');
    expect(total).toBeLessThanOrEqual(150);
    expect(times[Math.floor(times.length * 0.95)]!).toBeLessThanOrEqual(0.25);
  });
});
