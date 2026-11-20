import { describe, expect, it } from 'vitest';
import { createLoop } from '../../../src/loop';
import { DT, TICK_HZ, ticks, ticksToMs } from '../../../src/tuning';

function runAt(hz: number, seconds: number): { ticks: number; perFrame: number[] } {
  let n = 0;
  const perFrame: number[] = [];
  const loop = createLoop({ tick: () => void n++, render: () => {} });
  const frames = Math.round(seconds * hz);
  for (let i = 0; i < frames; i++) perFrame.push(loop.advance(1000 / hz));
  return { ticks: n, perFrame };
}

describe('fixed-timestep loop (§4.7)', () => {
  it('runs exactly TICK_HZ ticks per simulated second at 30, 60 and 144 Hz', () => {
    for (const hz of [30, 60, 144]) expect(runAt(hz, 10).ticks).toBe(10 * TICK_HZ);
  });

  it('spreads ticks evenly: 4 per frame at 30 Hz, 0 or 1 at 144 Hz', () => {
    expect(new Set(runAt(30, 2).perFrame)).toEqual(new Set([4]));
    expect([...new Set(runAt(144, 2).perFrame)].sort()).toEqual([0, 1]);
  });

  it('render alpha stays in [0,1) and pause stops ticks but not rendering', () => {
    const alphas: number[] = [];
    let n = 0;
    const loop = createLoop({ tick: () => void n++, render: (a) => void alphas.push(a) });
    for (let i = 0; i < 50; i++) loop.advance(7);
    loop.running = false;
    const before = n;
    loop.advance(100);
    expect(n).toBe(before);
    expect(alphas.length).toBe(51);
    expect(alphas.every((a) => a >= 0 && a < 1)).toBe(true);
  });

  it('caps catch-up after a long stall', () => {
    const loop = createLoop({ tick: () => {}, render: () => {} }, 30);
    expect(loop.advance(5000)).toBe(30);
    expect(loop.advance(1000 / 120)).toBe(1);
  });
});

describe('tick rounding (§14.1)', () => {
  it('converts the frozen timings to whole ticks', () => {
    expect(ticks(60) + ticks(200)).toBe(31); // landing at 258 ms, spec 260
    expect(ticks(150)).toBe(18);
    expect(ticks(40)).toBe(5);
    expect(ticks(250)).toBe(30);
    expect(ticksToMs(120)).toBe(1000);
    expect(DT * TICK_HZ).toBeCloseTo(1, 12);
  });
});
