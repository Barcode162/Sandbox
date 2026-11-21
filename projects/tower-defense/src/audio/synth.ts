// Synthesis primitives and the §12 cue recipes. Every cue is built from oscillators and one shared
// noise buffer; nothing is sampled. Nodes stop themselves, so the graph never grows.
import type { BlotKind } from '../contracts/types';
import { BLOTS } from '../data/blots';
import { createRng, type Rng } from '../sim/rng';
import { VOICE } from './mix';

const FLOOR = 0.0001; // exponential ramps cannot reach 0

export interface Voice {
  readonly ctx: BaseAudioContext;
  readonly noise: AudioBuffer;
  readonly rng: Rng;
}

/** 1 s of seeded white noise, shared by every noise cue (random start offsets decorrelate them). */
export function makeNoise(ctx: BaseAudioContext, seed = 0x1ce): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const r = createRng(seed);
  for (let i = 0; i < len; i++) d[i] = r.next() * 2 - 1;
  return buf;
}

export function makeVoice(ctx: BaseAudioContext, seed = 0x5eed): Voice {
  return { ctx, noise: makeNoise(ctx), rng: createRng(seed) };
}

/** Attack-then-exponential-decay envelope on a fresh gain node. */
function env(v: Voice, dest: AudioNode, t: number, peak: number, attack: number, dur: number): GainNode {
  const g = v.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(FLOOR, t + Math.max(dur, attack + 0.001));
  g.connect(dest);
  return g;
}

export interface ToneOpts { type?: OscillatorType; to?: number; attack?: number; detune?: number }
export function tone(v: Voice, dest: AudioNode, t: number, hz: number, dur: number, peak: number, o: ToneOpts = {}): void {
  const osc = v.ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(hz, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  if (o.detune) osc.detune.setValueAtTime(o.detune, t);
  osc.connect(env(v, dest, t, peak, o.attack ?? 0.002, dur));
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export interface NoiseOpts { filter: BiquadFilterType; hz: number; to?: number; q?: number; attack?: number }
export function noise(v: Voice, dest: AudioNode, t: number, dur: number, peak: number, o: NoiseOpts): void {
  const src = v.ctx.createBufferSource();
  src.buffer = v.noise;
  const f = v.ctx.createBiquadFilter();
  f.type = o.filter;
  f.frequency.setValueAtTime(o.hz, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  f.Q.setValueAtTime(o.q ?? 0.9, t);
  src.connect(f);
  f.connect(env(v, dest, t, peak, o.attack ?? 0.002, dur));
  src.start(t, v.rng.range(0, 0.9), dur + 0.03);
}

const NOTE = { G4: 392, C4: 261.63, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, D5: 587.33, Fs5: 739.99, A5: 880, B5: 987.77 } as const;

/** §12 pop: triangle blip 40 ms at the kind's pitch ±3 % + a 15 ms noise tick high-passed at 3 kHz. */
export function pop(v: Voice, dest: AudioNode, t: number, kind: BlotKind): number {
  const hz = BLOTS[kind].popHz * (1 + v.rng.range(-0.03, 0.03));
  tone(v, dest, t, hz, 0.04, VOICE.pop, { type: 'triangle' });
  noise(v, dest, t, 0.015, VOICE.popTick, { filter: 'highpass', hz: 3000, q: 0.7, attack: 0.001 });
  return hz;
}

export function crackle(v: Voice, dest: AudioNode, t: number, gain: number, durMs: number, hz: number): void {
  noise(v, dest, t, durMs / 1000, gain, { filter: 'bandpass', hz, q: 1.2, attack: 0.004 });
}

export function tink(v: Voice, dest: AudioNode, t: number): void {
  const f = v.ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.setValueAtTime(1500, t);
  f.connect(dest);
  tone(v, f, t, 2093, 0.03, VOICE.tink, { type: 'square', attack: 0.001 });
}

export const ternFire = (v: Voice, d: AudioNode, t: number): void =>
  noise(v, d, t, 0.06, VOICE.ternFire, { filter: 'bandpass', hz: 2400, to: 1200, q: 2.2, attack: 0.004 });
export const jetsFire = (v: Voice, d: AudioNode, t: number): void =>
  noise(v, d, t, 0.09, VOICE.jets, { filter: 'bandpass', hz: 1800, to: 900, q: 1.6, attack: 0.008 });
export const frogFire = (v: Voice, d: AudioNode, t: number): void =>
  tone(v, d, t, 140, 0.12, VOICE.frogFire, { to: 70, attack: 0.004 });
export const frogLand = (v: Voice, d: AudioNode, t: number): void =>
  noise(v, d, t, 0.09, VOICE.frogLand, { filter: 'lowpass', hz: 800, q: 0.8, attack: 0.003 });

export function koiPulse(v: Voice, d: AudioNode, t: number): void {
  noise(v, d, t, 0.22, VOICE.koiNoise, { filter: 'lowpass', hz: 4000, to: 600, q: 0.7, attack: 0.01 });
  tone(v, d, t, 330, 0.22, VOICE.koiSine, { attack: 0.01 });
}

export function owlGlare(v: Voice, d: AudioNode, t: number): void {
  tone(v, d, t, 1320, 0.3, VOICE.owl, { attack: 0.002 });
  tone(v, d, t, 1980, 0.3, VOICE.owl * 0.7, { attack: 0.002 });
}

export function place(v: Voice, d: AudioNode, t: number): void {
  for (let i = 0; i < 3; i++) noise(v, d, t + i * 0.03, 0.012, VOICE.place, { filter: 'bandpass', hz: 2600, q: 1, attack: 0.001 });
  tone(v, d, t, 180, 0.12, VOICE.placeThump, { to: 110, attack: 0.003 });
}

export function invalid(v: Voice, d: AudioNode, t: number): void {
  tone(v, d, t, 160, 0.04, VOICE.invalid, { type: 'square', attack: 0.002 });
  tone(v, d, t + 0.06, 160, 0.04, VOICE.invalid, { type: 'square', attack: 0.002 });
}

/** §12 upgrade: C5-E5-G5 arpeggio with one note per tier; tier 3 adds C6. */
export function upgrade(v: Voice, d: AudioNode, t: number, tier: number): void {
  const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].slice(0, Math.min(4, Math.max(1, tier) + 1));
  notes.forEach((hz, i) => tone(v, d, t + i * 0.07, hz, 0.18, VOICE.upgrade, { type: 'triangle', attack: 0.003 }));
}

export function sell(v: Voice, d: AudioNode, t: number): void {
  noise(v, d, t, 0.12, VOICE.sell, { filter: 'bandpass', hz: 3200, to: 900, q: 0.8, attack: 0.004 });
  tone(v, d, t + 0.06, NOTE.G4, 0.14, VOICE.sellNotes, { type: 'triangle' });
  tone(v, d, t + 0.16, NOTE.C4, 0.2, VOICE.sellNotes, { type: 'triangle' });
}

/**
 * §12 leak: sine 110 Hz 200 ms + a seed rattle of 5 clicks, over a 1.2 kHz bandpassed rattle body
 * (F-028) so the alert carries where the ear is sensitive, above any crackle bed at R18.
 */
export function leak(v: Voice, d: AudioNode, t: number): void {
  tone(v, d, t, 110, 0.2, VOICE.leak, { attack: 0.004 });
  noise(v, d, t, 0.16, VOICE.leakBody, { filter: 'bandpass', hz: 1200, q: 1, attack: 0.004 });
  for (let i = 0; i < 5; i++) noise(v, d, t + 0.02 + i * 0.028 + v.rng.range(0, 0.008), 0.008, VOICE.leakRattle, { filter: 'highpass', hz: 2500, q: 0.7, attack: 0.0005 });
}

export function roundStart(v: Voice, d: AudioNode, t: number): void {
  tone(v, d, t, 600, 0.07, VOICE.clack, { type: 'triangle', attack: 0.001 });
  tone(v, d, t + 0.09, 900, 0.07, VOICE.clack, { type: 'triangle', attack: 0.001 });
}

export function roundClear(v: Voice, d: AudioNode, t: number): void {
  [NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.B5].forEach((hz, i) => tone(v, d, t + i * 0.09, hz, 0.5, VOICE.chime, { attack: 0.004 }));
}

/** §12 boss arrival: saw 55 Hz drone, lowpass 200→900 Hz over 2 s, then 3 drum hits. */
export function bossArrive(v: Voice, d: AudioNode, t: number): void {
  const f = v.ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(200, t);
  f.frequency.exponentialRampToValueAtTime(900, t + 2);
  f.connect(d);
  const osc = v.ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(55, t);
  const g = v.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(VOICE.bossDrone, t + 0.4);
  g.gain.setValueAtTime(VOICE.bossDrone, t + 1.8);
  g.gain.exponentialRampToValueAtTime(FLOOR, t + 2.4);
  osc.connect(g);
  g.connect(f);
  osc.start(t);
  osc.stop(t + 2.45);
  for (let i = 0; i < 3; i++) drum(v, d, t + 2 + i * 0.36, VOICE.bossDrum);
}

function drum(v: Voice, d: AudioNode, t: number, peak: number): void {
  tone(v, d, t, 95, 0.35, peak, { to: 48, attack: 0.002 });
  noise(v, d, t, 0.08, peak * 0.4, { filter: 'lowpass', hz: 900, q: 0.7, attack: 0.001 });
}

export function bossShed(v: Voice, d: AudioNode, t: number): void {
  tone(v, d, t, 82, 0.3, VOICE.bossThud, { to: 50, attack: 0.002 });
  noise(v, d, t + 0.02, 0.35, VOICE.bossSplash, { filter: 'bandpass', hz: 1400, to: 500, q: 0.6, attack: 0.005 });
}

/** §12 boss death: 600 ms tear noise + a D-major chord bloom over 1.5 s. */
export function bossDeath(v: Voice, d: AudioNode, t: number): void {
  noise(v, d, t, 0.6, VOICE.bossTear, { filter: 'bandpass', hz: 4500, to: 700, q: 0.9, attack: 0.01 });
  for (const hz of [293.66, 369.99, 440, 587.33]) tone(v, d, t + 0.3, hz, 1.5, VOICE.bossBloom, { type: 'triangle', attack: 0.35 });
}

export const hover = (v: Voice, d: AudioNode, t: number): void => tone(v, d, t, 4000, 0.008, VOICE.hover, { attack: 0.001 });
export const click = (v: Voice, d: AudioNode, t: number): void => tone(v, d, t, 1200, 0.02, VOICE.click, { type: 'triangle', attack: 0.001 });

export function sealed(v: Voice, d: AudioNode, t: number): void {
  tone(v, d, t, 220, 0.06, VOICE.invalid, { type: 'triangle', attack: 0.002 });
  noise(v, d, t, 0.03, VOICE.invalid * 0.6, { filter: 'lowpass', hz: 1200, attack: 0.001 });
}

/** §12 game over: descending minor 4 notes over 1.6 s (D minor: A4 F4 D4 A3). */
export function gameOverSting(v: Voice, d: AudioNode, t: number): void {
  [440, 349.23, 293.66, 220].forEach((hz, i) => tone(v, d, t + i * 0.36, hz, 0.55, VOICE.sting, { type: 'triangle', attack: 0.01 }));
}

/** §12 victory: pentatonic run + chord, 2.4 s. */
export function victorySting(v: Voice, d: AudioNode, t: number): void {
  [587.33, 659.25, 739.99, 880, 987.77, 1174.66].forEach((hz, i) => tone(v, d, t + i * 0.1, hz, 0.3, VOICE.sting, { type: 'triangle' }));
  for (const hz of [293.66, 369.99, 440, 587.33, 739.99]) tone(v, d, t + 0.7, hz, 1.7, VOICE.sting * 0.6, { type: 'triangle', attack: 0.05 });
}
