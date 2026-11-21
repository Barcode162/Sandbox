// §12 music: D-major pentatonic, 84 BPM, 8-bar loops. Each state is a mix of layers; a state change
// is applied on the next bar line with an 800 ms linear crossfade. Notes are scheduled ahead on the
// AudioContext clock (lookahead), so frame jitter never reaches the groove.
import type { MusicState } from '../contracts/types';
import { createRng } from '../sim/rng';
import { tone, noise, type Voice } from './synth';

export const BPM = 84;
export const BEAT_S = 60 / BPM;
export const BAR_S = 4 * BEAT_S;
export const STEP_S = BEAT_S / 2; // 8th notes
export const STEPS_PER_BAR = 8;
export const LOOP_BARS = 8;
export const CROSSFADE_S = 0.8;
export const LOOKAHEAD_S = 0.25;

export type Layer = 'pluck' | 'sparse' | 'pad' | 'shaker' | 'bass' | 'kick' | 'tom' | 'drone' | 'taiko';
export const LAYERS: readonly Layer[] = ['pluck', 'sparse', 'pad', 'shaker', 'bass', 'kick', 'tom', 'drone', 'taiko'];

/** Layer levels per state (§12). Victory/Game-over: the stings play as cues, then silence. */
export const MUSIC_MIX: Readonly<Record<MusicState, Partial<Record<Layer, number>>>> = {
  silent: {},
  title: { pluck: 0.9, pad: 1 },
  intermission: { pad: 1, sparse: 0.85 },
  round: { pluck: 0.8, pad: 0.8, shaker: 1, bass: 1 },
  storm: { pluck: 0.8, pad: 0.7, shaker: 1, bass: 1, kick: 1, tom: 1 },
  boss: { drone: 1, taiko: 1, shaker: 0.5 },
  victory: {},
  gameover: {},
};

// D-major pentatonic material. Chords use only D E F# A B.
const CHORDS = [
  [293.66, 369.99, 440, 493.88], // D6
  [246.94, 293.66, 369.99, 440], // Bm7
  [329.63, 440, 493.88, 587.33], // E-A-B-D (Em7 without G)
  [220, 246.94, 329.63, 440], // Asus2
] as const;
const ROOTS = [73.42, 61.74, 82.41, 55] as const; // D2 B1 E2 A1
const PROGRESSION = [0, 1, 2, 3, 0, 1, 2, 0] as const;
const SCALE = [587.33, 659.25, 739.99, 880, 987.77, 1174.66] as const; // D5..D6

/** A fixed 64-step pluck melody (seeded, so every session hears the same tune). */
function buildMelody(): Int8Array {
  const r = createRng(84);
  const m = new Int8Array(LOOP_BARS * STEPS_PER_BAR).fill(-1);
  let idx = 2;
  for (let i = 0; i < m.length; i++) {
    const downbeat = i % STEPS_PER_BAR === 0;
    if (!downbeat && r.next() < 0.5) continue;
    idx = downbeat ? [0, 2, 3][r.int(3)] : Math.min(SCALE.length - 1, Math.max(0, idx + r.int(5) - 2));
    m[i] = idx;
  }
  return m;
}

export interface Music {
  setState(s: MusicState, now: number): void;
  /** Schedule notes up to now + LOOKAHEAD_S. Call every frame. */
  schedule(now: number): void;
  readonly state: MusicState;
  /** Time of the pending/last switch (bar line), for tests. */
  readonly switchAt: number;
  level(l: Layer): number;
}

export function nextBarLine(now: number, origin: number): number {
  if (now <= origin) return origin;
  return origin + Math.ceil((now - origin) / BAR_S - 1e-9) * BAR_S;
}

export function createMusic(v: Voice, out: AudioNode): Music {
  const ctx = v.ctx;
  const melody = buildMelody();
  const gains = {} as Record<Layer, GainNode>;
  const inputs = {} as Record<Layer, AudioNode>;
  for (const l of LAYERS) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, 0);
    g.connect(out);
    gains[l] = g;
    inputs[l] = g;
  }
  for (const [l, hz] of [['pad', 1100], ['drone', 320]] as const) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(hz, 0);
    f.connect(gains[l]);
    inputs[l] = f;
  }
  const from: Record<Layer, number> = Object.fromEntries(LAYERS.map((l) => [l, 0])) as Record<Layer, number>;
  const to: Record<Layer, number> = { ...from };
  let state: MusicState = 'silent';
  let origin = -1; // bar-0 time on the context clock; -1 = clock not started
  let nextStep = 0;
  let switchAt = 0;

  const audible = (l: Layer, t: number): boolean =>
    t < switchAt ? from[l] > 0 : to[l] > 0 || t < switchAt + CROSSFADE_S;

  function playStep(k: number, t: number): void {
    const step = k % STEPS_PER_BAR;
    const bar = Math.floor(k / STEPS_PER_BAR) % LOOP_BARS;
    const chord = PROGRESSION[bar];
    const m = melody[(bar * STEPS_PER_BAR + step) % melody.length];
    if (audible('pluck', t) && m >= 0) tone(v, inputs.pluck, t, SCALE[m], 0.28, 0.11, { type: 'triangle', attack: 0.003 });
    if (audible('sparse', t) && (step === 0 || (step === 5 && bar % 2 === 1))) {
      tone(v, inputs.sparse, t, step === 0 ? CHORDS[chord][3] * 2 : SCALE[m >= 0 ? m : 3], 0.5, 0.1, { type: 'triangle', attack: 0.004 });
    }
    if (audible('pad', t) && step === 0) {
      for (const hz of CHORDS[chord]) padNote(inputs.pad, t, hz, 0.035);
    }
    if (audible('shaker', t)) {
      noise(v, inputs.shaker, t, 0.03, step % 2 ? 0.06 : 0.035, { filter: 'highpass', hz: 6000, q: 0.7, attack: 0.002 });
    }
    if (audible('bass', t) && step % 2 === 0) {
      const octave = step === 6 && (bar === 3 || bar === 7) ? 2 : 1;
      tone(v, inputs.bass, t, ROOTS[chord] * octave, 0.24, 0.2, { type: 'triangle', attack: 0.006 });
    }
    if (audible('kick', t) && (step === 0 || step === 4)) tone(v, inputs.kick, t, 120, 0.25, 0.45, { to: 45, attack: 0.002 });
    if (audible('tom', t) && bar === LOOP_BARS - 1 && step >= 4) {
      tone(v, inputs.tom, t, [200, 170, 140, 120][step - 4], 0.18, 0.25, { to: 90, attack: 0.002 });
    }
    if (audible('drone', t) && step === 0) {
      padNote(inputs.drone, t, 61.74, 0.07, 'sawtooth');
      padNote(inputs.drone, t, 92.5, 0.05, 'sawtooth');
      padNote(inputs.drone, t, 146.83, 0.03, 'triangle');
    }
    if (audible('taiko', t) && (step === 0 || (step === 6 && bar % 2 === 1))) {
      const p = step === 0 ? 0.42 : 0.2;
      tone(v, inputs.taiko, t, 95, 0.4, p, { to: 48, attack: 0.002 });
      noise(v, inputs.taiko, t, 0.09, p * 0.35, { filter: 'lowpass', hz: 700, q: 0.7, attack: 0.001 });
    }
  }

  /** Sustained bar-long note with a soft attack and an overlapping release. */
  function padNote(dest: AudioNode, t: number, hz: number, peak: number, type: OscillatorType = 'triangle'): void {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.5);
    g.gain.setValueAtTime(peak, t + BAR_S - 0.2);
    g.gain.linearRampToValueAtTime(0, t + BAR_S + 0.4);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + BAR_S + 0.45);
  }

  return {
    setState(s, now) {
      if (s === state) return;
      if (origin < 0) { origin = now + 0.05; nextStep = 0; }
      const at = nextBarLine(now + 0.01, origin);
      if (at !== switchAt || now >= switchAt) {
        // A new switch: the old target becomes the fade's start level.
        for (const l of LAYERS) from[l] = to[l];
      }
      switchAt = at;
      state = s;
      for (const l of LAYERS) {
        to[l] = MUSIC_MIX[s][l] ?? 0;
        const p = gains[l].gain;
        p.cancelScheduledValues(at);
        p.setValueAtTime(from[l], at);
        p.linearRampToValueAtTime(to[l], at + CROSSFADE_S);
      }
    },
    schedule(now) {
      if (origin < 0) return;
      if (origin + nextStep * STEP_S < now - 0.05) nextStep = Math.ceil((now - origin) / STEP_S); // tab was asleep
      while (origin + nextStep * STEP_S < now + LOOKAHEAD_S) {
        const t = origin + nextStep * STEP_S;
        if (LAYERS.some((l) => audible(l, t))) playStep(nextStep, t);
        nextStep++;
      }
    },
    get state() { return state; },
    get switchAt() { return switchAt; },
    level: (l) => to[l],
  };
}
