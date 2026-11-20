/**
 * Music (§8): a kalimba-like FM ostinato, 4 bars of A-minor pentatonic in eighths, over a low reed drone.
 * Look-ahead scheduler driven from the render frame: notes are placed on the AudioContext clock
 * 120 ms ahead, so frame jitter never reaches the beat. OWNER: WO-004.
 *
 * - Tempo 100 + 28τ bpm, read only at bar starts (quantised, so the groove never lurches mid-bar).
 * - Shaker layer while τ > 0.4; melody layer from layer 33.
 * - Fail: the music lowpass falls to 300 Hz over 400 ms (chomp also ducks −9 dB over 600 ms).
 * - Win: the ostinato stops and resolves on the tonic chord.
 */
import { dB, type Synth } from './synth';

export const LOOKAHEAD_S = 0.12;
export const STEPS_PER_BAR = 8;
const A3 = 220;
const _ = null;

/** Semitones above A3 per eighth; 4 bars. */
export const OSTINATO: readonly (number | null)[] = [
  0, _, 7, _, 3, _, 7, 5,
  0, _, 7, _, 10, _, 7, 5,
  3, _, 10, _, 7, _, 10, 12,
  5, _, 12, _, 10, 7, 5, 3,
];

/** Semitones above A4 per eighth; enters at k ≥ 33. */
export const MELODY: readonly (number | null)[] = [
  12, _, _, _, 10, _, 7, _,
  10, _, _, _, 12, _, 15, _,
  15, _, 12, _, 10, _, _, _,
  7, _, 10, _, 12, _, _, _,
];

export const tempoFor = (tau: number): number => 100 + 28 * Math.min(1, Math.max(0, tau));

export interface Music {
  start(at: number): void;
  fail(at: number, chomp: boolean): void;
  win(at: number): void;
  /** New run: silence the ostinato and restore filter and level. */
  stop(): void;
  frame(now: number, tau: number, layer: number): void;
  /** Current tempo (changes only at bar starts). */
  readonly bpm: number;
  readonly playing: boolean;
  /** Steps scheduled so far this run (tests). */
  readonly steps: number;
}

export function createMusic(s: Synth, dest: AudioNode): Music {
  const ctx = s.ctx;
  const bus = ctx.createGain();
  bus.gain.value = 1;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 16000;
  filter.Q.value = 0.8;
  const duck = ctx.createGain();
  bus.connect(filter).connect(duck).connect(dest);

  let playing = false;
  let bpm = tempoFor(0);
  let nextAt = 0;
  let step = 0;
  let steps = 0;
  let tau = 0;
  let layer = 0;
  let drone: { oscs: OscillatorNode[]; gain: GainNode } | null = null;

  function startDrone(at: number) {
    const gain = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    lp.Q.value = 2;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(dB(-24), at + 1.5);
    const oscs = [
      { f: 110, type: 'sawtooth' as const },
      { f: 110 * 1.004, type: 'sawtooth' as const },
      { f: 55, type: 'triangle' as const },
    ].map(({ f, type }) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(lp);
      o.start(at);
      return o;
    });
    lp.connect(gain).connect(bus);
    drone = { oscs, gain };
  }

  function stopDrone(at: number, fade: number) {
    if (!drone) return;
    const d = drone;
    drone = null;
    d.gain.gain.cancelScheduledValues(at);
    d.gain.gain.setTargetAtTime(0.0001, at, fade / 4);
    for (const o of d.oscs) o.stop(at + fade + 0.05);
    d.oscs[0]!.onended = () => {
      for (const o of d.oscs) o.disconnect();
      d.gain.disconnect();
    };
  }

  function kalimba(at: number, f: number, gain: number) {
    s.fm({ at, dur: 0.55, f, ratio: 5.4, index: 1.2, indexDecay: 0.03, gain, dest: bus });
  }

  function scheduleStep(at: number) {
    const i = step % OSTINATO.length;
    if (i % STEPS_PER_BAR === 0) bpm = tempoFor(tau);
    const n = OSTINATO[i];
    if (n !== null && n !== undefined) kalimba(at, A3 * Math.pow(2, n / 12), dB(i % 4 === 0 ? -19 : -22));
    if (tau > 0.4) {
      s.noise({ at, dur: 0.035, filter: 'highpass', f0: 6500, gain: dB(i % 2 === 1 ? -28 : -33), dest: bus });
    }
    const m = MELODY[i];
    if (layer >= 33 && m !== null && m !== undefined) {
      s.fm({ at, dur: 0.7, f: 2 * A3 * Math.pow(2, m / 12), ratio: 3, index: 0.9, indexDecay: 0.12, gain: dB(-22), dest: bus });
    }
    step++;
    steps++;
    nextAt = at + 60 / bpm / 2;
  }

  return {
    get bpm() {
      return bpm;
    },
    get playing() {
      return playing;
    },
    get steps() {
      return steps;
    },
    start(at) {
      if (playing) return;
      playing = true;
      step = 0;
      bpm = tempoFor(tau);
      nextAt = at + 0.02;
      filter.frequency.cancelScheduledValues(at);
      filter.frequency.setValueAtTime(16000, at);
      duck.gain.cancelScheduledValues(at);
      duck.gain.setValueAtTime(1, at);
      startDrone(at);
    },
    fail(at, chomp) {
      filter.frequency.cancelScheduledValues(at);
      filter.frequency.setValueAtTime(Math.max(300, filter.frequency.value), at);
      filter.frequency.exponentialRampToValueAtTime(300, at + 0.4);
      if (chomp) {
        duck.gain.cancelScheduledValues(at);
        duck.gain.setValueAtTime(duck.gain.value || 1, at);
        duck.gain.linearRampToValueAtTime(dB(-9), at + 0.6);
      }
    },
    win(at) {
      playing = false;
      [0, 3, 7, 12].forEach((n, k) => kalimba(at + k * 0.035, A3 * Math.pow(2, n / 12), dB(-18)));
      stopDrone(at + 0.3, 2);
    },
    stop() {
      playing = false;
      steps = 0;
      const now = ctx.currentTime;
      stopDrone(now, 0.25);
      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(16000, now + 0.3);
      duck.gain.cancelScheduledValues(now);
      duck.gain.setValueAtTime(1, now + 0.3);
    },
    frame(now, t, k) {
      tau = t;
      layer = k;
      if (!playing) return;
      if (nextAt < now - 0.2) nextAt = now + 0.02; // stalled (tab throttled): rejoin, never burst
      while (nextAt < now + LOOKAHEAD_S) scheduleStep(Math.max(nextAt, now));
    },
  };
}
