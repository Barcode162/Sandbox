// §4.2 soggy/curl, RunResult causes (polish 16), pad states, the win.
import { describe, expect, it } from 'vitest';
import { makeBot } from '../../../src/sim/bots';
import { createSim, step, timerMs } from '../../../src/sim/sim';
import { ticks, ticksToMs } from '../../../src/tuning';
import { eager, events, idle, run, until } from './helpers';

const ESC = ticks(220); // 26

/** Seed 7, frog standing on layer 5, the layer-6 soggy forward. */
function beforeSoggy() {
  const s = createSim(7);
  until(s, (s) => s.frog.layer === 5 && s.frog.phase === 'idle', eager);
  return s;
}

describe('soggy (§4.2)', () => {
  it('sinks the run one tick after the 26-tick escape window; pad sinking → sunk at 380 ms', () => {
    const s = beforeSoggy();
    step(s, { press: 'F' });
    until(s, (s) => s.frog.phase === 'idle');
    const land = events(s, 'land').pop()!;
    expect(land).toMatchObject({ kind: 'soggy', layer: 6 });
    expect(events(s, 'sinkStart').pop()).toEqual({ t: 'sinkStart', tick: land.tick, pad: land.pad });
    expect(s.padStates[land.pad]).toEqual({ state: 'sinking', since: land.tick });
    expect(s.choices.length).toBe(3); // still free to hop
    idle(s, ESC);
    expect(s.result).toBeNull();
    idle(s, 1);
    expect(s.result).toMatchObject({ kind: 'sunk', cause: 'soggy', culpritId: land.pad, layer: 6, tick: land.tick + ESC + 1 });
    expect(s.frog.phase).toBe('sinking');
    expect(events(s, 'sunk')).toEqual([{ t: 'sunk', tick: land.tick + ESC + 1, pad: land.pad, kind: 'soggy' }]);
    idle(s, ticks(380) - ESC - 2);
    expect(s.padStates[land.pad]!.state).toBe('sinking');
    idle(s, 1);
    expect(s.padStates[land.pad]).toEqual({ state: 'sunk', since: land.tick + ticks(380) });
  });

  it('a hop on the 26th tick escapes (and a buffered press escapes on the landing tick)', () => {
    const s = beforeSoggy();
    step(s, { press: 'F' });
    until(s, (s) => s.frog.phase === 'idle');
    const land = events(s, 'land').pop()!;
    idle(s, ESC - 1);
    step(s, { press: 'L' });
    expect(events(s, 'escape')).toEqual([{ t: 'escape', tick: land.tick + ESC, pad: land.pad }]);
    until(s, (s) => s.frog.phase === 'idle');
    expect(s.result).toBeNull();
    expect(s.frog.layer).toBe(7);

    const b = beforeSoggy();
    step(b, { press: 'F' });
    idle(b, 20);
    step(b, { press: 'R' }); // buffered
    idle(b, 15);
    const e = events(b, 'escape')[0]!;
    expect(e.tick).toBe(events(b, 'land').find((l) => l.kind === 'soggy')!.tick);
    expect(events(b, 'hop').pop()).toMatchObject({ buffered: true, tick: e.tick });
  });

  it('a press one tick after the window is too late', () => {
    const s = beforeSoggy();
    step(s, { press: 'F' });
    until(s, (s) => s.frog.phase === 'idle');
    idle(s, ESC);
    step(s, { press: 'L' });
    expect(s.result?.cause).toBe('soggy');
    expect(events(s, 'escape')).toEqual([]);
  });
});

describe('curl (§4.2)', () => {
  it('always fails: tilt on landing, flip + sunk 120 ms later, no press can escape', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = createSim(seed);
      until(s, (s) => s.frog.layer === 9 && s.frog.phase === 'idle', eager);
      const curl = s.river.layers[10]!.find((p) => p.kind === 'curl')!;
      const c = s.choices.find((c) => c.padId === curl.id)!;
      step(s, { press: c.slot });
      idle(s, ticks(60)); // past the retarget window: from here on every press is buffered or ignored
      for (let i = 0; i < 60; i++) step(s, { press: (['L', 'F', 'R'] as const)[i % 3]! }); // mash
      const land = events(s, 'land').pop()!;
      expect(land).toMatchObject({ pad: curl.id, kind: 'curl' });
      expect(events(s, 'tilt')).toEqual([{ t: 'tilt', tick: land.tick, pad: curl.id }]);
      expect(events(s, 'flip')).toEqual([{ t: 'flip', tick: land.tick + ticks(120), pad: curl.id }]);
      expect(s.result).toMatchObject({ kind: 'sunk', cause: 'curl', culpritId: curl.id, tick: land.tick + ticks(120), layer: 10 });
      expect(s.frog.phase).toBe('flung');
      expect(s.padStates[curl.id]!.state).toBe('flipping');
      expect(events(s, 'hop').length).toBe(10);
    }
  });
});

describe('results (polish 16, 19)', () => {
  it('cause is right for still / flank / soggy / curl / win, and the timer freezes at the result', () => {
    const still = run(createSim(7), makeBot('idler'));
    expect(still.result).toMatchObject({ kind: 'eaten', cause: 'still', culpritId: null, layer: 3 });
    const forward = run(createSim(7), makeBot('forward'));
    expect(forward.result).toMatchObject({ kind: 'sunk', cause: 'soggy', layer: 6 });
    expect(forward.river.pads[forward.result!.culpritId!]!.kind).toBe('soggy');
    const win = run(createSim(7), makeBot('runner'));
    expect(win.result).toMatchObject({ kind: 'won', cause: 'win', culpritId: null, layer: 36 });
    const w = events(win, 'win')[0]!;
    expect(w.timeMs).toBe(ticksToMs(w.tick - win.timerStartTick!));
    expect(win.result!.timeMs).toBe(w.timeMs);
    expect(win.frog.phase).toBe('won');
    expect(win.gator.phase).toBe('retreating');
    expect(win.trail.length).toBe(38);
    const t = timerMs(win);
    const n = win.log.length;
    idle(win, 240);
    expect(timerMs(win)).toBe(t);
    expect(win.log.length).toBe(n); // nothing is logged after the result
    expect(win.choices).toEqual([]);
    // flank and curl causes: tests/unit/sim/gator.test.ts and the curl block above
  });

  it('pad states: target dips 180 ms then occupied; left pad idle; reachable only on the chips', () => {
    const s = createSim(7);
    step(s, { press: 'F' });
    until(s, (s) => s.frog.phase === 'idle');
    const pad = s.frog.padId;
    expect(s.padStates[pad]!.state).toBe('dipping');
    idle(s, ticks(180));
    expect(s.padStates[pad]!.state).toBe('occupied');
    step(s, { press: 'L' });
    expect(s.padStates[pad]!.state).toBe('idle');
    expect(s.padStates.filter((p) => p.state === 'reachable')).toEqual([]);
    until(s, (s) => s.frog.phase === 'idle');
    const reach = s.padStates.flatMap((p, i) => (p.state === 'reachable' ? [i] : []));
    expect(reach).toEqual(s.choices.map((c) => c.padId).sort((a, b) => a - b));
  });
});

describe('soggy chain', () => {
  it('escaping one soggy onto another leaves both sunk on their own clocks', () => {
    let tested = 0;
    for (let seed = 0; seed < 3000 && tested < 5; seed++) {
      const s = createSim(seed);
      const L = s.river.layers;
      const k = L.findIndex((l, i) => i > 6 && i < 36 && l.some((p) => p.kind === 'soggy') && L[i + 1]!.some((p) => p.kind === 'soggy'));
      if (k < 0) continue;
      until(s, (s) => s.frog.layer === k - 1 && s.frog.phase === 'idle', eager);
      if (s.result) continue;
      const a = L[k]!.find((p) => p.kind === 'soggy')!, b = L[k + 1]!.find((p) => p.kind === 'soggy')!;
      step(s, { press: s.choices.find((c) => c.padId === a.id)!.slot });
      until(s, (s) => s.frog.phase === 'idle');
      step(s, { press: s.choices.find((c) => c.padId === b.id)!.slot }); // escape A at once
      idle(s, 80);
      expect(s.padStates[a.id]!.state).toBe('sunk');
      expect(s.padStates[b.id]!.state).toBe('sunk');
      expect(s.result).toMatchObject({ cause: 'soggy', culpritId: b.id });
      tested++;
    }
    expect(tested).toBe(5);
  });
});
