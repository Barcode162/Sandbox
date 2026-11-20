/**
 * Tiny synthesis kit over raw Web Audio (§8). OWNER: WO-004.
 * Every voice is fire-and-forget: built, scheduled, stopped and disconnected when it ends.
 */

export const dB = (db: number): number => Math.pow(10, db / 20);
export const semis = (n: number): number => Math.pow(2, n / 12);
/** r(x, a, b) of the spec: clamp((x − a)/(b − a), 0, 1). */
export const ramp01 = (x: number, a: number, b: number): number => Math.min(1, Math.max(0, (x - a) / (b - a)));

const FLOOR = 0.0001;

export interface Synth {
  readonly ctx: AudioContext;
  /** Pitched voice: frequency glides f0 → f1 over `glide` s (default the whole note). */
  tone(o: ToneOpts): void;
  /** Filtered noise: cutoff glides f0 → f1. */
  noise(o: NoiseOpts): void;
  /** Two-operator FM (kalimba, marimba, bell, bird). */
  fm(o: FmOpts): void;
}

export interface ToneOpts {
  at: number;
  dur: number;
  f0: number;
  f1?: number;
  glide?: number;
  type?: OscillatorType;
  gain: number;
  attack?: number;
  dest: AudioNode;
  /** Optional lowpass on the voice. */
  lowpass?: number;
}

export interface NoiseOpts {
  at: number;
  dur: number;
  filter: BiquadFilterType;
  f0: number;
  f1?: number;
  q?: number;
  gain: number;
  attack?: number;
  /** 'exp' (default) decays; 'swell' rises to the end (reverse swell, hiss). */
  shape?: 'exp' | 'swell';
  dest: AudioNode;
}

export interface FmOpts {
  at: number;
  dur: number;
  f: number;
  /** Modulator frequency = f · ratio. */
  ratio: number;
  /** Peak modulation depth as a multiple of f; decays over `indexDecay` s. */
  index: number;
  indexDecay: number;
  gain: number;
  attack?: number;
  /** Carrier glide target (bird chirps). */
  f1?: number;
  dest: AudioNode;
}

function envelope(g: AudioParam, at: number, attack: number, dur: number, peak: number, shape: 'exp' | 'swell' = 'exp'): void {
  g.setValueAtTime(FLOOR, at);
  if (shape === 'swell') {
    g.exponentialRampToValueAtTime(peak, at + dur * 0.92);
    g.linearRampToValueAtTime(0, at + dur);
    return;
  }
  g.linearRampToValueAtTime(peak, at + attack);
  g.exponentialRampToValueAtTime(FLOOR, at + dur);
}

function cleanup(src: AudioScheduledSourceNode, nodes: AudioNode[]): void {
  src.onended = () => {
    for (const n of nodes) n.disconnect();
  };
}

export function createSynth(ctx: AudioContext, noiseBuffer: AudioBuffer): Synth {
  return {
    ctx,
    tone(o) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = o.type ?? 'sine';
      osc.frequency.setValueAtTime(o.f0, o.at);
      if (o.f1 !== undefined && o.f1 !== o.f0) osc.frequency.exponentialRampToValueAtTime(o.f1, o.at + (o.glide ?? o.dur));
      envelope(g.gain, o.at, o.attack ?? 0.003, o.dur, o.gain);
      const nodes: AudioNode[] = [osc, g];
      if (o.lowpass) {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = o.lowpass;
        osc.connect(lp).connect(g);
        nodes.push(lp);
      } else osc.connect(g);
      g.connect(o.dest);
      osc.start(o.at);
      osc.stop(o.at + o.dur + 0.02);
      cleanup(osc, nodes);
    },
    noise(o) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      // Random read offset so repeated hits never sound like the same sample.
      const offset = Math.random() * Math.max(0, noiseBuffer.duration - o.dur - 0.05);
      const f = ctx.createBiquadFilter();
      f.type = o.filter;
      f.Q.value = o.q ?? 0.7;
      f.frequency.setValueAtTime(o.f0, o.at);
      if (o.f1 !== undefined && o.f1 !== o.f0) f.frequency.exponentialRampToValueAtTime(o.f1, o.at + o.dur);
      const g = ctx.createGain();
      envelope(g.gain, o.at, o.attack ?? 0.002, o.dur, o.gain, o.shape);
      src.connect(f).connect(g).connect(o.dest);
      src.start(o.at, offset, o.dur + 0.03);
      src.stop(o.at + o.dur + 0.03);
      cleanup(src, [src, f, g]);
    },
    fm(o) {
      const car = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const depth = ctx.createGain();
      const g = ctx.createGain();
      car.frequency.setValueAtTime(o.f, o.at);
      if (o.f1 !== undefined) car.frequency.exponentialRampToValueAtTime(o.f1, o.at + o.dur);
      mod.frequency.setValueAtTime(o.f * o.ratio, o.at);
      if (o.f1 !== undefined) mod.frequency.exponentialRampToValueAtTime(o.f1 * o.ratio, o.at + o.dur);
      depth.gain.setValueAtTime(o.f * o.index, o.at);
      depth.gain.exponentialRampToValueAtTime(Math.max(1, o.f * o.index * 0.02), o.at + o.indexDecay);
      mod.connect(depth).connect(car.frequency);
      envelope(g.gain, o.at, o.attack ?? 0.002, o.dur, o.gain);
      car.connect(g).connect(o.dest);
      const end = o.at + o.dur + 0.02;
      car.start(o.at);
      mod.start(o.at);
      car.stop(end);
      mod.stop(end);
      cleanup(car, [car, mod, depth, g]);
    },
  };
}

/** White noise, 2 s, made once at unlock. */
export function makeNoise(ctx: AudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 2);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Brown noise (integrated white), 4 s loop, for the water bed. */
export function makeBrown(ctx: AudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 4);
  const fade = Math.floor(ctx.sampleRate * 0.05);
  const raw = new Float32Array(len + fade);
  let last = 0;
  for (let i = 0; i < raw.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    raw[i] = last * 3.5;
  }
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  d.set(raw.subarray(0, len));
  // The head fades in from the samples that follow the tail, so the loop seam is continuous.
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    d[i] = raw[i]! * k + raw[len + i]! * (1 - k);
  }
  return b;
}
