// §4.3 gator: the gap, the hook, steady states, eaten, near-miss, flank F1/F2, head leads body.
import { describe, expect, it } from 'vitest';
import type { SimState } from '../../../src/contracts';
import { makeBot, safeSlot } from '../../../src/sim/bots';
import { createSim, hopTicks, isHooked, step } from '../../../src/sim/sim';
import { DT, TUNING } from '../../../src/tuning';
import { dwell, eager, events, idle, periodic, run, until } from './helpers';

describe('the gap (§4.3)', () => {
  it('is frozen at gMax until the frog lands on layer 3, then starts at g0 and drains dt per tick', () => {
    const s = createSim(7);
    until(s, (s) => s.frog.layer === 2 && s.frog.phase === 'idle', eager);
    idle(s, 600);
    expect(s.gator).toMatchObject({ g: TUNING.gMax, phase: 'dormant', tau: 0 });
    expect(s.result).toBeNull();
    until(s, (s) => s.frog.layer === 3, eager);
    const hook = events(s, 'hook')[0]!;
    expect(hook.tick).toBe(events(s, 'land')[2]!.tick);
    expect(s.gator.g).toBeCloseTo(TUNING.g0 - DT, 12);
    expect(s.gator.phase).toBe('surfacing');
    idle(s, 120);
    expect(s.gator.g).toBeCloseTo(TUNING.g0 - 121 * DT, 9);
    expect(s.gator.tau).toBeCloseTo(1 - s.gator.g / TUNING.tauSpan, 12);
    expect(s.gator.phase).toBe('chasing');
  });

  const steady = (period: number) => {
    const s = run(createSim(11), periodic(period));
    const lands = events(s, 'land').filter((l) => l.layer > 20 && l.kind !== 'bank');
    return { s, pre: lands.map((l) => l.g), post: lands.map((l) => Math.min(TUNING.gMax, l.g + TUNING.gainBase + TUNING.gainRubber * (1 - l.g / TUNING.gMax))) };
  };

  it('steady state: 0.75 s holds the cap; 1.0 s settles near 2.0; 1.2 s near 0.9 (g at touchdown, ±0.15)', () => {
    const a = steady(0.75), b = steady(1.0), c = steady(1.2);
    for (const r of [a, b, c]) expect(r.s.result?.kind).toBe('won');
    expect(Math.min(...a.post)).toBeCloseTo(TUNING.gMax, 9); // every landing refills to the cap
    for (const g of b.pre) expect(Math.abs(g - 2.0)).toBeLessThan(0.15);
    for (const g of c.pre) expect(Math.abs(g - 0.9)).toBeLessThan(0.15);
  });

  it('eaten at ≈1.35 s: standing 1.30 s on each pad survives, 1.40 s is eaten (cause still)', () => {
    // The airborne hold means the worst landing still refills g to gain(0) = 1.35 s, so the limit is the
    // dwell (landing → next takeoff). In hop *period* that is ≈1.35 + 0.26 s.
    for (let seed = 0; seed < 20; seed++) {
      expect(run(createSim(seed), dwell(1.3)).result?.kind).toBe('won');
      expect(run(createSim(seed), dwell(1.4)).result).toMatchObject({ kind: 'eaten', cause: 'still', culpritId: null });
    }
    expect(TUNING.gainBase + TUNING.gainRubber).toBeCloseTo(1.35, 12);
  });

  it('standing still: eaten exactly g0 after the hook, and 2 s from g = 2', () => {
    const s = createSim(3);
    until(s, (s) => s.frog.layer === 3 && s.frog.phase === 'idle', eager);
    const hook = events(s, 'hook')[0]!.tick;
    run(s, () => null);
    expect(events(s, 'eaten')).toEqual([{ t: 'eaten', tick: hook + 360, cause: 'still' }]);
    expect(s.frog.phase).toBe('eaten');
    expect(s.gator.phase).toBe('lunging');
    idle(s, 30);
    expect(s.gator.phase).toBe('sated');

    const t = createSim(3);
    until(t, (s) => isHooked(s) && s.frog.phase === 'idle', eager);
    until(t, (s) => s.gator.g <= 2.0);
    const t0 = t.tick;
    run(t, () => null);
    expect(Math.abs(t.result!.tick - t0 - 240)).toBeLessThanOrEqual(1);
  });

  it('near-miss: g hitting 0 airborne is held at 0, logged mid-air, and the landing gains the full 1.35', () => {
    const s = run(createSim(7), makeBot('nearMiss'));
    expect(s.result?.kind).toBe('won');
    const nm = events(s, 'nearMiss');
    expect(nm.length).toBeGreaterThan(10);
    const hops = events(s, 'hop'), lands = events(s, 'land');
    for (const e of nm) {
      const h = hops.filter((h) => h.tick <= e.tick).pop()!;
      const l = lands.find((l) => l.tick >= e.tick)!;
      expect(e.tick).toBeGreaterThan(h.tick);
      expect(e.tick).toBeLessThan(l.tick); // airborne
      expect(l).toMatchObject({ g: 0, nearMiss: true });
    }
    expect(s.log.filter((e) => e.t === 'eaten')).toEqual([]);
  });

  it('near-miss: a landing with 0 < g < 0.35 is a near-miss too; one event per hop', () => {
    const s = createSim(7);
    until(s, (s) => isHooked(s) && s.frog.layer >= 4 && s.frog.phase === 'idle', eager);
    until(s, (s) => s.gator.g <= hopTicks(s) * DT + 0.2);
    step(s, { press: safeSlot(s) });
    until(s, (s) => s.frog.phase === 'idle');
    const l = events(s, 'land').pop()!;
    expect(l.g).toBeGreaterThan(0);
    expect(l.g).toBeLessThan(TUNING.nearMissG);
    expect(l.nearMiss).toBe(true);
    expect(events(s, 'nearMiss')).toEqual([{ t: 'nearMiss', tick: l.tick, g: l.g }]);
  });
});

/** Run a slow, safe player to the first flank start. */
function toFlank(seed: number): SimState | null {
  const s = createSim(seed);
  const bot = periodic(1.25);
  until(s, (s) => s.gator.flank !== null, bot);
  return s.gator.flank ? s : null;
}

describe('flank (§4.3)', () => {
  it('rules over 300 seeds: k ≥ 12, g < 1.4, frog grounded, matches the last slot, F1, once per 4 layers', () => {
    let flanks = 0;
    for (let seed = 0; seed < 300; seed++) {
      const s = createSim(seed);
      const bot = periodic(1.25);
      let last = -Infinity;
      while (!s.result) {
        const before = s.gator.flank;
        const slot = s.frog.slot, frogPad = s.frog.padId, layer = s.frog.layer, phase = s.frog.phase;
        step(s, { press: bot(s) });
        const f = s.gator.flank;
        if (f && f !== before) {
          flanks++;
          const pad = s.river.pads[f.padId]!;
          expect(pad.layer).toBe(layer + 1);
          expect(pad.layer).toBeGreaterThanOrEqual(TUNING.flankFromLayer);
          expect(s.gator.g).toBeLessThan(TUNING.flankG);
          expect(phase).toBe('idle');
          expect(s.frog.padId).toBe(frogPad);
          expect(s.choices.find((c) => c.slot === slot || c.alsoAnswers.includes(slot))!.padId).toBe(f.padId);
          expect(s.river.layers[pad.layer]!.some((p) => p.id !== pad.id && p.kind === 'lily')).toBe(true); // F1
          expect(pad.layer - last).toBeGreaterThanOrEqual(TUNING.flankEvery);
          last = pad.layer;
        }
      }
      expect(s.result.kind).toBe('won');
    }
    expect(flanks).toBeGreaterThan(300);
  });

  it('telegraph 250 ms then armed: pad flanked, the ✕ chip stays in choices; landing there is eaten (cause flank)', () => {
    const s = toFlank(7)!;
    const f = s.gator.flank!;
    expect(s.gator.phase).toBe('surfacing');
    expect(f.armed).toBe(false);
    idle(s, 29);
    expect(f.armed).toBe(false);
    idle(s, 1);
    expect(f.armed).toBe(true);
    expect(s.gator.phase).toBe('flanking');
    expect(s.padStates[f.padId]!.state).toBe('flanked');
    expect(events(s, 'flankArmed').pop()).toEqual({ t: 'flankArmed', tick: f.startTick + 30, pad: f.padId });
    const c = s.choices.find((c) => c.padId === f.padId)!;
    step(s, { press: c.slot });
    run(s, () => null);
    expect(s.result).toMatchObject({ kind: 'eaten', cause: 'flank', culpritId: f.padId });
    expect(s.log.slice(-2).map((e) => e.t)).toEqual(['land', 'eaten']);
  });

  it('F2: a hop that starts during the telegraph is safe, and clears the flank at takeoff', () => {
    const s = toFlank(7)!;
    const f = s.gator.flank!;
    idle(s, 29);
    const c = s.choices.find((c) => c.padId === f.padId)!;
    step(s, { press: c.slot }); // the arming tick: the hop is judged first
    expect(s.gator.flank).toBeNull();
    expect(events(s, 'flankClear').pop()).toEqual({ t: 'flankClear', tick: s.tick, pad: f.padId });
    until(s, (s) => s.frog.phase === 'idle');
    expect(s.result === null || s.result.kind !== 'eaten' || s.result.cause !== 'flank').toBe(true);
    expect(s.frog.padId).toBe(f.padId);
  });

  it('F-004: the armed pad stays flanked through squash and air, so a retarget onto it keeps its tell', () => {
    const s = toFlank(7)!;
    const f = s.gator.flank!;
    idle(s, 30);
    const other = s.choices.find((c) => c.padId !== f.padId)!;
    const flankSlot = s.choices.find((c) => c.padId === f.padId)!.slot;
    step(s, { press: other.slot });
    expect(s.frog.phase).toBe('squash');
    expect(s.choices).toEqual([]);
    expect(s.padStates[f.padId]!.state).toBe('flanked'); // was reset to idle before the fix
    step(s, { press: flankSlot }); // retarget within 5 ticks
    expect(s.frog.targetId).toBe(f.padId);
    while (s.frog.phase === 'squash' || s.frog.phase === 'air') {
      expect(s.padStates[f.padId]!.state).toBe('flanked');
      step(s, { press: null });
    }
    expect(s.result).toMatchObject({ kind: 'eaten', cause: 'flank', culpritId: f.padId });
  });

  it('eaten standing still releases an armed flank pad', () => {
    const s = toFlank(7)!;
    const f = s.gator.flank!;
    run(s, () => null);
    expect(s.result).toMatchObject({ cause: 'still' });
    expect(s.padStates[f.padId]!.state).toBe('idle');
  });

  it('a flank clears when the frog lands anywhere else', () => {
    const s = toFlank(7)!;
    const f = s.gator.flank!;
    idle(s, 30);
    const other = s.choices.find((c) => c.padId !== f.padId && s.river.pads[c.padId]!.kind === 'lily')!;
    step(s, { press: other.slot });
    expect(s.gator.flank).not.toBeNull();
    until(s, (s) => s.frog.phase === 'idle');
    expect(s.gator.flank).toBeNull();
    expect(s.padStates[f.padId]!.state).toBe('idle');
    expect(events(s, 'flankClear').pop()!.tick).toBe(events(s, 'land').pop()!.tick);
  });
});

describe('gator body (§4.3 position, polish 13)', () => {
  it('head follows the trail target without teleporting; body keeps 5.5 wu spacing', () => {
    const s = createSim(7);
    let maxJump = 0;
    while (!s.result) {
      step(s, { press: periodic(1.0)(s) });
      const g = s.gator;
      maxJump = Math.max(maxJump, Math.hypot(g.head.x - g.headPrev.x, g.head.y - g.headPrev.y));
      let p = g.head;
      for (const b of g.body) {
        expect(Math.hypot(b.x - p.x, b.y - p.y)).toBeLessThanOrEqual(TUNING.bodySpacing + 1e-9);
        p = b;
      }
    }
    expect(maxJump).toBeLessThan(3); // < a third of a pad per tick, even surfacing at the hook
  });

  it('head leads: after each hop the heading turns before body segments 0 and 1 do (≥ 2 segments)', () => {
    let checked = 0, led = 0;
    const turned = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    for (let seed = 0; seed < 40; seed++) {
      const s = createSim(seed);
      until(s, (s) => isHooked(s) && s.frog.layer >= 8, periodic(1.0));
      const dir = (i: number) => {
        const g = s.gator;
        const a = i === 0 ? g.head : g.body[i - 1]!, b = g.body[i]!;
        return Math.atan2(a.y - b.y, a.x - b.x);
      };
      const bot = periodic(1.0);
      let mark = -1, h0 = 0, d0: number[] = [], th = -1;
      const tb = [-1, -1];
      const close = () => {
        if (th < 0 || th > hopTicks(s)) return; // the head did not react to this hop
        checked++;
        if (tb.every((t) => t < 0 || t > th)) led++;
      };
      while (!s.result) {
        const n = s.log.length;
        const h = s.gator.heading, d = [dir(0), dir(1)];
        step(s, { press: bot(s) });
        if (s.log.slice(n).some((e) => e.t === 'hop')) {
          if (mark > 0) close();
          [mark, h0, d0, th] = [s.tick, h, d, -1];
          tb.fill(-1);
        }
        if (mark > 0) {
          const el = s.tick - mark;
          if (th < 0 && turned(s.gator.heading, h0) > 0.15) th = el;
          for (const i of [0, 1]) if (tb[i]! < 0 && turned(dir(i), d0[i]!) > 0.15) tb[i] = el;
        }
      }
    }
    // Measured 952/975: the misses are near-straight hops where the drift of the head, not a look, turns it.
    expect(checked).toBeGreaterThan(200);
    expect(led / checked).toBeGreaterThanOrEqual(0.95);
  });
});
