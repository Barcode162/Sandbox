import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimEvent, SimEventType, SimState, ViewState } from '../../../src/contracts';
import { asCtx, FakeContext, FakeNode, FakeOsc } from './fake-audio';

const hb = vi.hoisted(() => ({ phase: 0 }));
vi.mock(import('../../../src/sim/sim'), async (orig) => ({ ...(await orig()), heartbeatPhase: () => hb.phase }));

const { createAudio, DUCK_S } = await import('../../../src/audio/audio');
const { CUES, hopSweep, HOP_SEMITONES } = await import('../../../src/audio/cues');
const { tempoFor, STEPS_PER_BAR } = await import('../../../src/audio/music');
const { createSim } = await import('../../../src/sim/sim');

/** One sample of every event type. `satisfies` keeps this list complete as the union grows. */
const SAMPLES = {
  timerStart: { t: 'timerStart', tick: 1 },
  hop: { t: 'hop', tick: 1, from: 0, to: 1, slot: 'R', buffered: false },
  retarget: { t: 'retarget', tick: 2, to: 2, slot: 'L' },
  land: { t: 'land', tick: 31, pad: 1, layer: 1, kind: 'lily', g: 3.5, nearMiss: false },
  escape: { t: 'escape', tick: 40, pad: 1 },
  sinkStart: { t: 'sinkStart', tick: 40, pad: 1 },
  tilt: { t: 'tilt', tick: 40, pad: 1 },
  flip: { t: 'flip', tick: 50, pad: 1 },
  hook: { t: 'hook', tick: 90 },
  flankStart: { t: 'flankStart', tick: 100, pad: 3 },
  flankArmed: { t: 'flankArmed', tick: 130, pad: 3 },
  flankClear: { t: 'flankClear', tick: 160, pad: 3 },
  nearMiss: { t: 'nearMiss', tick: 170, g: 0.1 },
  eaten: { t: 'eaten', tick: 200, cause: 'still' },
  sunk: { t: 'sunk', tick: 200, pad: 4, kind: 'soggy' },
  win: { t: 'win', tick: 900, timeMs: 24180 },
} as const satisfies { [K in SimEventType]: Extract<SimEvent, { t: K }> };

const view = (over: Partial<ViewState> = {}): ViewState => ({
  phase: 'play', settings: { muted: false, reducedMotion: false }, prevBestMs: null, newBest: false, firstRun: true,
  nowMs: 0, resultAgeMs: 0, alpha: 0, ...over,
});

function rig() {
  const fake = new FakeContext();
  const make = vi.fn(() => asCtx(fake));
  const audio = createAudio(make);
  const sim: SimState = createSim(7);
  return { fake, make, audio, sim };
}

beforeEach(() => {
  hb.phase = 0;
});

describe('audio cue table (§8, SC3 juice audit)', () => {
  it('has a described cue for every SimEvent type and each one makes sound', () => {
    expect(Object.keys(CUES).sort()).toEqual(Object.keys(SAMPLES).sort());
    for (const [type, ev] of Object.entries(SAMPLES)) {
      const { fake, audio, sim } = rig();
      audio.unlock();
      audio.frame(sim, view(), []);
      const before = fake.nodes.length;
      audio.frame(sim, view(), [ev as SimEvent]);
      expect(CUES[type as SimEventType].sound.length, type).toBeGreaterThan(10);
      expect(fake.nodes.length - before, `${type} creates voices`).toBeGreaterThan(0);
    }
  });

  it('pitches the hop by slot, left below forward below right (polish 11)', () => {
    expect(HOP_SEMITONES).toEqual({ L: -2, F: 0, R: 3 });
    expect(hopSweep('F')).toEqual([320, 520]);
    expect(hopSweep('L')[0]).toBeLessThan(hopSweep('F')[0]);
    expect(hopSweep('R')[0]).toBeCloseTo(320 * 2 ** (3 / 12), 6);
    const { fake, audio, sim } = rig();
    audio.unlock();
    audio.frame(sim, view(), [SAMPLES.hop]);
    const [osc] = fake.oscsAt(hopSweep('R')[0]);
    expect(osc).toBeDefined();
    expect(osc!.frequency.calls[1]).toMatchObject({ op: 'exp', v: hopSweep('R')[1] });
  });

  it('plays the new-best bell ladder only when the view says newBest', () => {
    const count = (newBest: boolean) => {
      const { fake, audio, sim } = rig();
      audio.unlock();
      audio.frame(sim, view(), []);
      const n = fake.nodes.length;
      audio.frame(sim, view({ newBest }), [SAMPLES.win]);
      return fake.nodes.length - n;
    };
    expect(count(true)).toBeGreaterThan(count(false));
  });
});

describe('audio lifecycle', () => {
  it('creates no AudioContext before the first gesture, and only one after', () => {
    const { make, audio, sim } = rig();
    audio.setMuted(true);
    audio.duck(true);
    audio.frame(sim, view(), [SAMPLES.hop]);
    audio.uiTick();
    expect(make).not.toHaveBeenCalled();
    expect(audio.debug()).toBeNull();
    audio.unlock();
    audio.unlock();
    expect(make).toHaveBeenCalledTimes(1);
  });

  it('runs silently with zero errors when Web Audio is missing or throws', () => {
    for (const make of [() => null, () => { throw new Error('NotAllowedError'); }]) {
      const audio = createAudio(make);
      const sim = createSim(7);
      expect(() => {
        audio.unlock();
        audio.frame(sim, view(), [SAMPLES.hop, SAMPLES.eaten]);
        audio.setMuted(true);
        audio.duck(true);
        audio.uiTick();
      }).not.toThrow();
      expect(audio.debug()).toBeNull();
    }
  });

  it('resumes a suspended context on gesture and schedules nothing while suspended', () => {
    const { fake, audio, sim } = rig();
    fake.state = 'suspended';
    fake.resume = () => Promise.resolve(); // stays suspended (no activation yet)
    audio.unlock();
    const n = fake.nodes.length;
    audio.frame(sim, view(), [SAMPLES.hop, SAMPLES.land]);
    expect(fake.nodes.length).toBe(n);
  });

  it('limits the master at −1 dBFS and routes everything through it', () => {
    const { fake, audio } = rig();
    audio.unlock();
    const comp = fake.nodes.find((n) => n.kind === 'compressor') as FakeNode & { threshold: { value: number }; ratio: { value: number } };
    expect(comp.threshold.value).toBe(-1);
    expect(comp.ratio.value).toBeGreaterThanOrEqual(20);
    const ceiling = comp.outs[0] as FakeNode & { gain: { value: number } };
    expect(ceiling.gain.value).toBeCloseTo(10 ** (-1 / 20), 6);
    expect(ceiling.outs[0]).toBe(fake.destination);
  });

  it('applies a mute set before unlock, and ducks to 0 over 120 ms on pause (§7.6)', () => {
    const { fake, audio } = rig();
    audio.setMuted(true);
    audio.unlock();
    expect(audio.debug()!.muted).toBe(true);
    const gains = fake.nodes.filter((n) => n.kind === 'gain') as (FakeNode & { gain: { value: number; calls: { op: string; v: number; t: number }[] } })[];
    expect(gains.some((g) => g.gain.value === 0)).toBe(true);
    fake.currentTime = 5;
    audio.duck(true);
    const ramp = gains.flatMap((g) => g.gain.calls).find((c) => c.op === 'lin' && c.v === 0 && Math.abs(c.t - (5 + DUCK_S)) < 1e-9);
    expect(DUCK_S).toBe(0.12);
    expect(ramp).toBeDefined();
  });
});

describe('music and heartbeat', () => {
  it('starts on timerStart at 100 bpm and changes tempo only at bar starts (100 + 28τ)', () => {
    const { fake, audio, sim } = rig();
    audio.unlock();
    sim.gator.tau = 0;
    audio.frame(sim, view(), [SAMPLES.timerStart]);
    expect(audio.debug()!.musicPlaying).toBe(true);
    expect(audio.debug()!.bpm).toBe(100);
    // Mid-bar threat rise: the bar in progress keeps its tempo.
    fake.currentTime = 0.5;
    sim.gator.tau = 1;
    audio.frame(sim, view(), []);
    expect(audio.debug()!.bpm).toBe(100);
    // One bar at 100 bpm = 8 eighths × 0.3 s = 2.4 s; past it the new tempo is in force.
    const bar = (STEPS_PER_BAR * 60) / 100 / 2;
    for (let t = 0.5; t < bar + 0.1; t += 1 / 60) {
      fake.currentTime = t;
      audio.frame(sim, view(), []);
    }
    expect(audio.debug()!.bpm).toBe(tempoFor(1));
    expect(tempoFor(1)).toBe(128);
  });

  it('thumps once per heartbeatPhase wrap, only while hunting with τ > 0.3 (polish 14)', () => {
    const { fake, audio, sim } = rig();
    audio.unlock();
    sim.gator.phase = 'chasing';
    const beat = (tau: number) => {
      sim.gator.tau = tau;
      hb.phase = 0.9;
      audio.frame(sim, view(), []);
      hb.phase = 0.05;
      audio.frame(sim, view(), []);
    };
    beat(0.8);
    expect(audio.debug()!.heartbeats).toBe(1);
    expect(fake.oscs().some((o: FakeOsc) => o.frequency.calls.some((c) => c.v === 55))).toBe(true);
    beat(0.25);
    expect(audio.debug()!.heartbeats).toBe(1);
    sim.gator.phase = 'dormant';
    beat(0.9);
    expect(audio.debug()!.heartbeats).toBe(1);
  });
});
