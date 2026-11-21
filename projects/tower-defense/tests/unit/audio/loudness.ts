// F-028: a perceived-loudness meter for synth cues, read off the FakeAudioContext graph the real recipes build.
// Each voice is an oscillator or a noise source → (biquads) → an envelope gain. Its A-weighted power is
// computed in the frequency domain (sine: ½·A(f)²; white noise, variance ⅓: the mean of |H(f)|²·A(f)² over
// 0…Nyquist, with Web Audio's RBJ biquads at 48 kHz), scaled by the envelope² over time; the cue's loudness
// is the highest 50-ms A-weighted RMS, in dB. A model, not a recording, but it weighs exactly what the ear
// does to a 110 Hz sine against 2 kHz noise, which is the point of §16.19 "no pop louder than a leak".
import { FakeAudioContext, FakeBiquad, FakeGain, FakeOsc, FakeSource, type FakeNode, type FakeParam } from './fake-audio';

const FS = 48000;

/** IEC 61672 A-weighting, linear amplitude (0 dB at 1 kHz). */
export function aWeight(f: number): number {
  const f2 = f * f;
  const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return ra * 10 ** (2 / 20);
}

/** |H(f)|² of a Web Audio biquad (RBJ cookbook; lowpass/highpass Q is in dB per the spec). */
function biquadPower(type: string, f0: number, q: number, f: number): number {
  const w0 = (2 * Math.PI * f0) / FS;
  const Q = type === 'bandpass' ? q : 10 ** (q / 20);
  const al = Math.sin(w0) / (2 * Q), c = Math.cos(w0);
  let b: [number, number, number];
  if (type === 'bandpass') b = [al, 0, -al];
  else if (type === 'highpass') b = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  else if (type === 'lowpass') b = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else throw new Error(`biquad ${type} not modelled`);
  const a = [1 + al, -2 * c, 1 - al];
  const w = (2 * Math.PI * f) / FS;
  const re = (k: readonly number[]) => k[0] + k[1] * Math.cos(w) + k[2] * Math.cos(2 * w);
  const im = (k: readonly number[]) => -(k[1] * Math.sin(w) + k[2] * Math.sin(2 * w));
  return (re(b) ** 2 + im(b) ** 2) / (re(a) ** 2 + im(a) ** 2);
}

/** Value of a recorded automation at time t (set / linear / exponential ramps). */
function paramAt(p: FakeParam, t: number): number {
  let v = 0, tPrev = 0;
  for (const e of p.events) {
    if (e.kind === 'cancel' || e.kind === 'target') continue;
    if (t < e.t) {
      if (e.kind === 'set') return v;
      const k = (t - tPrev) / Math.max(1e-9, e.t - tPrev);
      if (e.kind === 'lin') return v + (e.v - v) * k;
      return v > 0 && e.v > 0 ? v * (e.v / v) ** k : v;
    }
    v = e.v; tPrev = e.t;
  }
  return v;
}

interface Voice { power: number; env: FakeGain; start: number; stop: number }

/** Every voice the graph holds: its A-weighted unit power and its envelope. */
function voices(ctx: FakeAudioContext): Voice[] {
  const out: Voice[] = [];
  const follow = (n: FakeNode, filters: FakeBiquad[]): { env: FakeGain; filters: FakeBiquad[] } | null => {
    for (const o of n.outputs) {
      if (o instanceof FakeGain) return { env: o, filters };
      if (o instanceof FakeBiquad) { const r = follow(o, [...filters, o]); if (r) return r; }
    }
    return null;
  };
  const bands = 4000;
  for (const n of ctx.nodes) {
    if (n instanceof FakeOsc) {
      const r = follow(n, []);
      if (!r) continue;
      const hz = n.frequency.value; // the start pitch (setValueAtTime); a later sweep is ignored
      let h = 1;
      for (const f of r.filters) h *= biquadPower(f.type, f.frequency.value, f.Q.value, hz);
      if (n.type !== 'sine' && n.type !== 'triangle') throw new Error(`osc ${n.type} not modelled`);
      // triangle: ≈ 0.81² of its power in the fundamental; the rest sits higher and is ignored (conservative)
      const shape = n.type === 'sine' ? 0.5 : 0.5 * 0.81 ** 2;
      out.push({ power: shape * aWeight(hz) ** 2 * h, env: r.env, start: n.startAt, stop: n.stopAt });
    } else if (n instanceof FakeSource) {
      const r = follow(n, []);
      if (!r) continue;
      let s = 0;
      for (let i = 1; i < bands; i++) {
        const f = (i * FS) / 2 / bands;
        let h = 1;
        for (const b of r.filters) h *= biquadPower(b.type, b.frequency.value, b.Q.value, f);
        s += h * aWeight(f) ** 2;
      }
      out.push({ power: (1 / 3) * (s / bands), env: r.env, start: n.startAt, stop: n.startAt + n.duration });
    }
  }
  return out;
}

/** Loudest 50-ms A-weighted RMS of everything in the graph, in dB(A) re full scale. */
export function loudnessDbA(ctx: FakeAudioContext, windowS = 0.05, spanS = 0.6): number {
  const dt = 0.0005;
  const n = Math.round(spanS / dt);
  const p = new Float64Array(n);
  for (const v of voices(ctx)) {
    for (let i = 0; i < n; i++) {
      const t = i * dt;
      if (t < v.start || t > v.stop) continue;
      const g = paramAt(v.env.gain, t);
      p[i] += v.power * g * g;
    }
  }
  const w = Math.round(windowS / dt);
  let acc = 0, best = 0;
  for (let i = 0; i < n; i++) {
    acc += p[i];
    if (i >= w) acc -= p[i - w];
    if (i >= w - 1) best = Math.max(best, acc / w);
  }
  return 10 * Math.log10(best);
}
