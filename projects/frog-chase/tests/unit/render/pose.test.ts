import { describe, expect, it } from 'vitest';
import type { Pad, PadRuntime, SimState, Vec2 } from '../../../src/contracts';
import { createSim, step } from '../../../src/sim/sim';
import { makeBot } from '../../../src/sim/bots';
import { makeTuning } from '../../../src/tuning';
import {
  BUBBLE_PERIOD_S,
  CURL_ROCK_PERIOD_S,
  bubbleAt,
  createFrogPose,
  createPadLook,
  curlRock,
  dipCurve,
  forwardChoice,
  frogPose,
  landDeform,
  padLook,
  type Bubble,
} from '../../../src/render/pose';

const restPos = (s: SimState) => (id: number, out: Vec2) => {
  const p = s.river.pads[id]!;
  out.x = p.x;
  out.y = p.y;
  return out;
};

const pad = (kind: Pad['kind'], over: Partial<Pad> = {}): Pad => ({ id: 3, layer: 6, index: 1, x: 50, y: 156, r: 10, kind, rot: 0.4, phase: 1.1, ...over });
const idle: PadRuntime = { state: 'idle', since: 0 };

describe('frog pose (§4.4, §6)', () => {
  it('polish 1: the tick a press lands on already shows the squash (same rendered frame)', () => {
    const s = createSim(7);
    for (let i = 0; i < 10; i++) step(s, { press: null });
    const pose = createFrogPose();
    frogPose(s, s.tick, restPos(s), pose);
    expect(pose.across).toBe(1);
    // One 16.7 ms frame = 2 ticks at 120 Hz; the press is consumed on the first.
    step(s, { press: 'F' });
    step(s, { press: null });
    frogPose(s, s.tick + 0.004, restPos(s), pose);
    expect(pose.stage).toBe('squash');
    expect(pose.across).toBeGreaterThan(1.1);
    expect(pose.along).toBeLessThan(0.9);
  });

  it('air arc: apex height 12 wu, scale 1.3, legs open; shadow rejoins at touchdown with no pop (polish 7)', () => {
    const s = createSim(7);
    step(s, { press: 'F' });
    const pose = createFrogPose();
    let peak = 0, peakScale = 0, legsAtPeak = 0, lastAirShadow = 0;
    while (s.frog.phase === 'squash' || s.frog.phase === 'air') {
      for (const a of [0, 0.25, 0.5, 0.75]) {
        frogPose(s, s.tick + a, restPos(s), pose);
        if (pose.h > peak) {
          peak = pose.h;
          peakScale = pose.scale;
          legsAtPeak = pose.legs;
        }
        if (pose.stage === 'air') lastAirShadow = pose.shadowH;
      }
      step(s, { press: null });
    }
    expect(peak).toBeGreaterThan(11.9);
    expect(peakScale).toBeCloseTo(1.3, 1);
    expect(legsAtPeak).toBe(1);
    frogPose(s, s.tick, restPos(s), pose);
    expect(pose.shadowH).toBe(3);
    expect(lastAirShadow - 3).toBeLessThan(1.6);
  });

  it('polish 6: idle eyes look at the forward choice', () => {
    const s = createSim(7);
    const pose = createFrogPose();
    frogPose(s, s.tick, restPos(s), pose);
    const fwd = s.river.pads[forwardChoice(s)!]!;
    expect(pose.lookX).toBe(fwd.x);
    expect(pose.lookY).toBe(fwd.y);
  });

  it('landing impact then one ≈4% overshoot, settled by 160 ms', () => {
    expect(landDeform(0)).toBe(1);
    expect(landDeform(39)).toBe(1);
    let min = 0;
    for (let ms = 40; ms <= 160; ms++) min = Math.min(min, landDeform(ms));
    expect(min * 0.14).toBeLessThan(-0.03);
    expect(min * 0.14).toBeGreaterThan(-0.05);
    expect(landDeform(160)).toBe(0);
  });

  it('a full bot crossing keeps every pose finite', () => {
    const s = createSim(7);
    const bot = makeBot('runner');
    const pose = createFrogPose();
    while (!s.result && s.tick < 20000) {
      step(s, { press: bot(s) });
      frogPose(s, s.tick + 0.5, restPos(s), pose);
      for (const v of [pose.x, pose.y, pose.h, pose.scale, pose.facing, pose.lookX]) expect(Number.isFinite(v)).toBe(true);
    }
    expect(s.result?.kind).toBe('won');
  });
});

describe('pad tells (§4.2)', () => {
  const t = makeTuning();
  const look = createPadLook();

  it('lily floats high (shadow 0.45r), soggy sits low (no shadow), curl floats with its flap', () => {
    expect(padLook(pad('lily'), idle, t, 0, 0, 0, Infinity, look).height).toBeCloseTo(4.5, 1);
    expect(padLook(pad('soggy'), idle, t, 0, 0, 0, Infinity, look).height).toBe(0);
    expect(padLook(pad('curl'), idle, t, 0, 0, 0, Infinity, look).height).toBeGreaterThan(4);
  });

  it('only the curl rotates; ±4° at a 0.9 s period (never the 2.1 s bob or 2.8 s sway: polish 5)', () => {
    let max = 0;
    for (let ms = 0; ms < 2000; ms += 5) {
      max = Math.max(max, Math.abs(curlRock(pad('curl'), ms / 1000)));
      expect(padLook(pad('lily'), idle, t, 0, ms / 1000, ms / 1000, Infinity, look).rock).toBe(0);
    }
    expect((max * 180) / Math.PI).toBeCloseTo(4, 1);
    expect(curlRock(pad('curl'), 0.3)).toBeCloseTo(curlRock(pad('curl'), 0.3 + CURL_ROCK_PERIOD_S), 9);
    expect([2.1, 2.8]).not.toContain(CURL_ROCK_PERIOD_S);
  });

  it('tells run on tell time, not ambient time (§10: reduced motion keeps them at full speed)', () => {
    const a = padLook(pad('curl'), idle, t, 0, 0.0, 0.2, Infinity, look).rock;
    const b = padLook(pad('curl'), idle, t, 0, 0.1, 0.2, Infinity, look).rock;
    expect(a).toBe(b);
  });

  it('polish 4: at least one soggy bubble is visible at every instant', () => {
    const b0: Bubble = { angle: 0, dist: 0, rise: 0, scale: 0, pop: 0 };
    const b1: Bubble = { ...b0 };
    for (let ms = 0; ms < 5000; ms += 1) {
      bubbleAt(pad('soggy'), 0, ms / 1000, b0);
      bubbleAt(pad('soggy'), 1, ms / 1000, b1);
      expect(Math.max(b0.scale, b1.scale)).toBeGreaterThan(0.1);
    }
    expect(BUBBLE_PERIOD_S).toBe(0.42);
  });

  it('landing dip: 6% and the shadow to 0.6×, recovered by 180 ms', () => {
    const peak = Math.max(...Array.from({ length: 180 }, (_, ms) => dipCurve(ms)));
    expect(peak).toBeCloseTo(1, 2);
    expect(dipCurve(180)).toBe(0);
    const l = padLook(pad('lily'), idle, t, 0, 0, 0, 36, look);
    expect(l.height).toBeCloseTo(4.5 * 0.6, 1);
  });

  it('curl flip: tilt for 120 ms, then scaleX 1 → −1 (underside) by 340 ms', () => {
    const rt: PadRuntime = { state: 'flipping', since: 0 };
    const at = (ms: number) => padLook(pad('curl'), rt, t, (ms * 120) / 1000, 0, 0, Infinity, look);
    expect(at(60).flip).toBe(1);
    expect(at(120).tilt).toBeCloseTo(1, 2);
    expect(at(230).flip).toBeLessThan(0.5);
    expect(at(345).flip).toBeCloseTo(-1, 5);
  });

  it('soggy sink eases in over soggySinkMs', () => {
    const rt: PadRuntime = { state: 'sinking', since: 0 };
    const at = (ms: number) => padLook(pad('soggy'), rt, t, (ms * 120) / 1000, 0, 0, Infinity, look).sink;
    expect(at(0)).toBe(0);
    expect(at(100)).toBeLessThan(0.2);
    expect(at(380)).toBe(1);
  });
});
