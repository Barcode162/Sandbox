/**
 * One cue per SimEvent type (§8, SC3 juice audit). OWNER: WO-004.
 * The table is a mapped type over SimEventType: a new event without a cue fails the typecheck.
 * Levels are the §8 table's dB values; the mix order chomp/splash > hop/land > danger > music > ambience
 * comes from those levels plus the bus trims in audio.ts.
 */
import type { SimEvent, SimEventType, SimState, Slot, ViewState } from '../contracts';
import type { Music } from './music';
import { dB, semis, type Synth } from './synth';

export interface Buses {
  /** Hops, landings, splashes, chomp. */
  sfx: AudioNode;
  /** Heartbeat, hiss, growl. */
  danger: AudioNode;
  ui: AudioNode;
}

export interface CueEnv {
  s: Synth;
  at: number;
  bus: Buses;
  music: Music;
  sim: SimState;
  view: ViewState;
}

export interface Cue<K extends SimEventType> {
  /** What the player hears, for the juice audit. */
  readonly sound: string;
  play(ev: Extract<SimEvent, { t: K }>, x: CueEnv): void;
}

export type CueTable = { readonly [K in SimEventType]: Cue<K> };

/** Polish 11: hop pitch rises left → right so the ear learns the slot. */
export const HOP_SEMITONES: Readonly<Record<Slot, number>> = { L: -2, F: 0, R: 3 };

/** Takeoff sweep for a slot, Hz: 320 → 520 transposed. */
export function hopSweep(slot: Slot): [number, number] {
  const k = semis(HOP_SEMITONES[slot]);
  return [320 * k, 520 * k];
}

function hop(x: CueEnv, slot: Slot, level: number): void {
  const [f0, f1] = hopSweep(slot);
  x.s.tone({ at: x.at, dur: 0.07, f0, f1, gain: dB(level), dest: x.bus.sfx });
  x.s.noise({ at: x.at, dur: 0.005, filter: 'highpass', f0: 2500, gain: dB(level - 4), dest: x.bus.sfx });
}

function lilyLand(x: CueEnv, level = -10): void {
  x.s.noise({ at: x.at, dur: 0.06, filter: 'bandpass', f0: 1800, q: 4, gain: dB(level + 4), dest: x.bus.sfx });
  x.s.tone({ at: x.at, dur: 0.03, f0: 600, f1: 300, gain: dB(level), dest: x.bus.sfx });
}

function bubbles(x: CueEnv, n: number, lo: number, hi: number, span: number, level: number, dest: AudioNode): void {
  for (let i = 0; i < n; i++) {
    const f = lo + Math.random() * (hi - lo);
    x.s.tone({ at: x.at + (span * (i + Math.random() * 0.6)) / n, dur: 0.045, f0: f, f1: f * 1.6, gain: dB(level), dest });
  }
}

function splash(x: CueEnv, level: number): void {
  x.s.noise({ at: x.at, dur: 0.25, filter: 'lowpass', f0: 3000, f1: 400, gain: dB(level), dest: x.bus.sfx });
  bubbles(x, 4, 250, 600, 0.35, level - 10, x.bus.sfx);
}

export const CUES: CueTable = {
  timerStart: {
    sound: 'Music ostinato and reed drone begin on hop-1 takeoff',
    play: (_e, x) => x.music.start(x.at),
  },
  hop: {
    sound: 'Sine sweep 320→520 Hz/70 ms + 5 ms click; L −2, F 0, R +3 st',
    play: (e, x) => hop(x, e.slot, -12),
  },
  retarget: {
    sound: 'Softer takeoff sweep at the new slot pitch',
    play: (e, x) => hop(x, e.slot, -16),
  },
  land: {
    sound: 'Lily/curl: 1.8 kHz noise tap + 600→300 Hz drop; soggy: 400 Hz gurgle + 5 blips; bank: sand thud',
    play: (e, x) => {
      if (e.kind === 'soggy') {
        x.s.noise({ at: x.at, dur: 0.3, filter: 'lowpass', f0: 400, q: 6, gain: dB(-8), dest: x.bus.sfx });
        bubbles(x, 5, 800, 1400, 0.3, -18, x.bus.sfx);
      } else if (e.kind === 'bank') {
        x.s.noise({ at: x.at, dur: 0.08, filter: 'lowpass', f0: 900, f1: 300, gain: dB(-8), dest: x.bus.sfx });
        x.s.tone({ at: x.at, dur: 0.06, f0: 200, f1: 110, gain: dB(-12), dest: x.bus.sfx });
      } else lilyLand(x);
    },
  },
  escape: {
    sound: 'Rising whistle, sine 700→1100 Hz over 150 ms',
    play: (_e, x) => x.s.tone({ at: x.at, dur: 0.15, f0: 700, f1: 1100, attack: 0.02, gain: dB(-16), dest: x.bus.sfx }),
  },
  sinkStart: {
    sound: 'Slow low bubbles as the pad goes under',
    play: (_e, x) => bubbles(x, 4, 300, 700, 0.38, -18, x.bus.sfx),
  },
  tilt: {
    sound: 'Short paper creak, triangle 180→140 Hz',
    play: (_e, x) => x.s.tone({ at: x.at, dur: 0.12, f0: 180, f1: 140, type: 'triangle', lowpass: 900, gain: dB(-16), dest: x.bus.sfx }),
  },
  flip: {
    sound: 'Paper fwip: highpass noise sweep 2→6 kHz over 90 ms',
    play: (_e, x) => x.s.noise({ at: x.at, dur: 0.09, filter: 'highpass', f0: 2000, f1: 6000, q: 2, gain: dB(-10), dest: x.bus.sfx }),
  },
  hook: {
    sound: 'Gator surfaces: 80 Hz sine bloop over 200 ms + bubbles',
    play: (_e, x) => {
      x.s.tone({ at: x.at, dur: 0.2, f0: 120, f1: 80, glide: 0.08, gain: dB(-8), dest: x.bus.danger });
      bubbles(x, 4, 200, 450, 0.3, -18, x.bus.danger);
    },
  },
  flankStart: {
    sound: 'Rising filtered-noise hiss over 250 ms',
    play: (_e, x) => x.s.noise({ at: x.at, dur: 0.25, filter: 'bandpass', f0: 1200, f1: 3500, q: 3, shape: 'swell', gain: dB(-10), dest: x.bus.danger }),
  },
  flankArmed: {
    sound: 'Low growl, saw 70 Hz through a lowpass',
    play: (_e, x) => x.s.tone({ at: x.at, dur: 0.16, f0: 76, f1: 64, type: 'sawtooth', lowpass: 420, gain: dB(-14), dest: x.bus.danger }),
  },
  flankClear: {
    sound: 'Soft release blip, the eyes slip under',
    play: (_e, x) => x.s.tone({ at: x.at, dur: 0.08, f0: 320, f1: 200, gain: dB(-22), dest: x.bus.danger }),
  },
  nearMiss: {
    sound: 'Jaw clack (two 20 ms 140 Hz square clicks, 40 ms apart) + reverse swell',
    play: (_e, x) => {
      x.s.noise({ at: x.at, dur: 0.18, filter: 'bandpass', f0: 500, f1: 2500, q: 1, shape: 'swell', gain: dB(-14), dest: x.bus.sfx });
      for (const dt of [0, 0.04]) {
        x.s.tone({ at: x.at + dt, dur: 0.02, f0: 140, type: 'square', attack: 0.001, gain: dB(-8), dest: x.bus.sfx });
      }
    },
  },
  eaten: {
    sound: 'Chomp: 110 Hz saw bite (120 ms) through a lowpass + noise crunch; music ducks −9 dB and darkens',
    play: (_e, x) => {
      x.s.tone({ at: x.at, dur: 0.12, f0: 110, f1: 70, type: 'sawtooth', lowpass: 700, attack: 0.002, gain: dB(-4), dest: x.bus.sfx });
      x.s.noise({ at: x.at + 0.01, dur: 0.1, filter: 'lowpass', f0: 2500, f1: 600, q: 1.5, gain: dB(-8), dest: x.bus.sfx });
      x.music.fail(x.at, true);
    },
  },
  sunk: {
    sound: 'Fall in water: 250 ms noise, lowpass 3 k→400 Hz, bubble tail; music darkens',
    play: (_e, x) => {
      splash(x, -8);
      x.music.fail(x.at, false);
    },
  },
  win: {
    sound: 'FM marimba C5 D5 E5 G5 A5 C6, 70 ms apart, + chime; new best adds a 4-note bell ladder a 5th up',
    play: (_e, x) => {
      const run = [72, 74, 76, 79, 81, 84];
      run.forEach((m, i) => x.s.fm({ at: x.at + i * 0.07, dur: 0.5, f: midi(m), ratio: 4, index: 1.6, indexDecay: 0.06, gain: dB(-12), dest: x.bus.sfx }));
      const end = x.at + run.length * 0.07;
      x.s.fm({ at: end, dur: 1.4, f: midi(96), ratio: 3.5, index: 0.8, indexDecay: 0.4, gain: dB(-18), dest: x.bus.sfx });
      if (x.view.newBest) {
        [79, 81, 83, 86].forEach((m, i) => x.s.fm({ at: end + 0.12 + i * 0.11, dur: 1.1, f: midi(m), ratio: 3.5, index: 1.1, indexDecay: 0.3, gain: dB(-14), dest: x.bus.sfx }));
      }
      x.music.win(end + 0.1);
    },
  },
};

export const midi = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** UI paper tick (§8 UI row): 8 ms of noise. */
export function uiTick(s: Synth, at: number, dest: AudioNode): void {
  s.noise({ at, dur: 0.008, filter: 'highpass', f0: 3000, gain: dB(-16), dest });
}

/** Card slide whoosh (§8 UI row). */
export function cardWhoosh(s: Synth, at: number, dest: AudioNode): void {
  s.noise({ at, dur: 0.22, filter: 'bandpass', f0: 300, f1: 1800, q: 1.2, shape: 'swell', gain: dB(-18), dest });
}

/** Heartbeat (§8): two thumps 55 / 45 Hz, 70 ms each, 120 ms apart, at gain 0.6·r(τ, 0.3, 1) under −14 dB. */
export function heartbeat(s: Synth, at: number, amount: number, dest: AudioNode): void {
  const g = 0.6 * amount * dB(-14);
  if (g <= 0) return;
  s.tone({ at, dur: 0.07, f0: 70, f1: 55, glide: 0.02, attack: 0.004, gain: g, dest });
  s.tone({ at: at + 0.12, dur: 0.07, f0: 58, f1: 45, glide: 0.02, attack: 0.004, gain: g * 0.8, dest });
}
