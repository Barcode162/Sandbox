// §4.4 frog timing, §4.5 slots, polish 2 (buffer), 19 (timer on takeoff), 21 (trail).
import { describe, expect, it } from 'vitest';
import { choicesFor, createSim, hopTicks, step, targetFor, timerMs } from '../../../src/sim/sim';
import { ticks } from '../../../src/tuning';
import { eager, events, idle, press, run } from './helpers';

const LAND = ticks(60) + ticks(200); // 31

describe('frog timing (§4.4)', () => {
  it('lands 31 ticks after the press tick; squash 7 ticks; choices only while grounded', () => {
    const s = createSim(7);
    expect(s.choices.map((c) => c.slot)).toEqual(['L', 'F', 'R']);
    expect(s.choices.every((c) => s.padStates[c.padId]!.state === 'reachable')).toBe(true);
    press(s, 'F');
    const hop = events(s, 'hop')[0]!;
    expect(hop).toMatchObject({ tick: 1, slot: 'F', buffered: false, to: s.river.layers[1]![1]!.id });
    expect(s.frog.phase).toBe('squash');
    expect(s.choices).toEqual([]);
    idle(s, ticks(60) - 1);
    expect(s.frog.phase).toBe('squash');
    idle(s, 1);
    expect(s.frog.phase).toBe('air');
    idle(s, LAND - ticks(60) - 1);
    expect(events(s, 'land')).toEqual([]);
    idle(s, 1);
    expect(events(s, 'land')[0]!.tick - hop.tick).toBe(LAND);
    expect(hopTicks(s)).toBe(LAND);
    expect(s.frog).toMatchObject({ phase: 'idle', padId: hop.to, layer: 1, landTick: hop.tick + LAND });
    expect(s.padStates[hop.to]!.state).toBe('dipping');
    expect(s.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('polish 2: a press 100 ms before landing fires ON the landing tick, with no idle tick between hops', () => {
    const s = createSim(7);
    press(s, 'F');
    idle(s, LAND - ticks(100) - 1);
    press(s, 'L'); // 12 ticks (100 ms) before landing
    expect(s.frog.buffer).toMatchObject({ slot: 'L' });
    idle(s, ticks(100) - 1);
    expect(events(s, 'land')).toEqual([]);
    idle(s, 1);
    const land = events(s, 'land')[0]!;
    const hop2 = events(s, 'hop')[1]!;
    expect(hop2).toMatchObject({ tick: land.tick, slot: 'L', buffered: true });
    expect(s.frog.phase).toBe('squash');
  });

  it('airborne presses earlier than the 150 ms window are dropped; the window edge (18 ticks) buffers', () => {
    const early = createSim(7);
    press(early, 'F');
    idle(early, LAND - ticks(150) - 2);
    press(early, 'R'); // 19 ticks before landing
    expect(early.frog.buffer).toBeNull();
    idle(early, 40);
    expect(events(early, 'hop').length).toBe(1);

    const edge = createSim(7);
    press(edge, 'F');
    idle(edge, LAND - ticks(150) - 1);
    press(edge, 'R'); // 18 ticks before landing
    idle(edge, 40);
    expect(events(edge, 'hop').length).toBe(2);
  });

  it('the latest press in the buffer window wins', () => {
    const s = createSim(7);
    press(s, 'F');
    idle(s, LAND - 15);
    press(s, 'L');
    idle(s, 3);
    press(s, 'R');
    idle(s, 20);
    expect(events(s, 'hop')[1]).toMatchObject({ slot: 'R', buffered: true });
  });

  it('retarget: a different key within 5 ticks (40 ms) of the squash retargets; later it is dropped', () => {
    const s = createSim(7);
    press(s, 'L');
    idle(s, ticks(40) - 1);
    press(s, 'R'); // 5 ticks after the hop tick
    expect(events(s, 'retarget')).toEqual([{ t: 'retarget', tick: 6, to: s.river.layers[1]![2]!.id, slot: 'R' }]);
    expect(s.frog).toMatchObject({ targetId: s.river.layers[1]![2]!.id, slot: 'R' });
    idle(s, 40);
    expect(s.frog.padId).toBe(s.river.layers[1]![2]!.id);

    const late = createSim(7);
    press(late, 'L');
    idle(late, ticks(40));
    press(late, 'R'); // 6 ticks: too late
    idle(late, 40);
    expect(events(late, 'retarget')).toEqual([]);
    expect(late.frog.padId).toBe(late.river.layers[1]![0]!.id);
  });

  it('key-repeat style duplicates are harmless: one hop per landing, no retargets, no lost tick', () => {
    const s = createSim(7);
    for (let i = 0; i < LAND * 5 + 1; i++) press(s, 'F');
    const hops = events(s, 'hop');
    expect(hops.length).toBe(6);
    expect(events(s, 'retarget')).toEqual([]);
    hops.forEach((h, i) => expect(h.tick).toBe(1 + i * LAND));
    expect(hops.slice(1).every((h) => h.buffered)).toBe(true);
  });

  it('polish 19: the timer starts on the first takeoff, not on load', () => {
    const s = createSim(7);
    idle(s, 300);
    expect(timerMs(s)).toBe(0);
    expect(s.timerStartTick).toBeNull();
    press(s, 'F');
    expect(s.timerStartTick).toBe(301);
    expect(events(s, 'timerStart')).toEqual([{ t: 'timerStart', tick: 301 }]);
    idle(s, 120);
    expect(timerMs(s)).toBe(1000);
  });

  it('polish 21: the trail holds every landed pad centre in order, with cumulative arc length', () => {
    const s = run(createSim(7), eager);
    const lands = events(s, 'land');
    expect(s.trail.length).toBe(lands.length + 1);
    lands.forEach((l, i) => expect(s.trail[i + 1]).toEqual({ x: s.river.pads[l.pad]!.x, y: s.river.pads[l.pad]!.y }));
    for (let i = 1; i < s.trail.length; i++)
      expect(s.trailArc[i]! - s.trailArc[i - 1]!).toBeCloseTo(Math.hypot(s.trail[i]!.x - s.trail[i - 1]!.x, s.trail[i]!.y - s.trail[i - 1]!.y), 9);
  });
});

describe('slots (§4.5)', () => {
  it('2-pad layers: Forward is the nearest pad in x and also answers its side key; the bank answers all', () => {
    for (let seed = 0; seed < 300; seed++) {
      const s = createSim(seed);
      while (!s.result && s.frog.layer < 36) {
        const next = s.river.layers[s.frog.layer + 1]!;
        const from = s.river.pads[s.frog.padId]!;
        const ch = choicesFor(s);
        if (next.length === 2) {
          const fwd = ch.find((c) => c.slot === 'F')!;
          const other = next.find((p) => p.id !== fwd.padId)!;
          expect(Math.abs(s.river.pads[fwd.padId]!.x - from.x)).toBeLessThanOrEqual(Math.abs(other.x - from.x));
          expect(fwd.alsoAnswers).toEqual([s.river.pads[fwd.padId]!.index === 0 ? 'L' : 'R']);
          expect(targetFor(s, 'L')).toBe(next[0]!.id);
          expect(targetFor(s, 'R')).toBe(next[1]!.id);
        }
        step(s, { press: eager(s) });
        idle(s, LAND);
      }
      if (s.frog.layer === 36) expect(choicesFor(s)).toEqual([{ slot: 'F', padId: s.river.layers[37]![0]!.id, alsoAnswers: ['L', 'R'] }]);
    }
  });
});
