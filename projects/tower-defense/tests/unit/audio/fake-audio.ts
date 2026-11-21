// A recording stand-in for BaseAudioContext: enough of the Web Audio API for the engine, with every
// AudioParam automation call logged so tests can read the resulting gain/frequency at any time.

export type ParamEvent =
  | { kind: 'set'; v: number; t: number }
  | { kind: 'lin' | 'exp'; v: number; t: number }
  | { kind: 'target'; v: number; t: number; tau: number }
  | { kind: 'cancel'; t: number };

export class FakeParam {
  events: ParamEvent[] = [];
  constructor(public value = 0) {}
  setValueAtTime(v: number, t: number) { this.events.push({ kind: 'set', v, t }); this.value = v; return this; }
  linearRampToValueAtTime(v: number, t: number) { this.events.push({ kind: 'lin', v, t }); return this; }
  exponentialRampToValueAtTime(v: number, t: number) { this.events.push({ kind: 'exp', v, t }); return this; }
  setTargetAtTime(v: number, t: number, tau: number) { this.events.push({ kind: 'target', v, t, tau }); return this; }
  cancelScheduledValues(t: number) { this.events = this.events.filter((e) => e.t < t); this.events.push({ kind: 'cancel', t }); return this; }
  /** Highest value the automation reaches (envelope peak). */
  peak(): number { return Math.max(0, ...this.events.filter((e) => e.kind !== 'cancel').map((e) => (e as { v: number }).v)); }
  /** Last automation event of a kind. */
  last(kind?: ParamEvent['kind']): ParamEvent | undefined {
    const es = kind ? this.events.filter((e) => e.kind === kind) : this.events;
    return es[es.length - 1];
  }
}

export class FakeNode {
  outputs: FakeNode[] = [];
  constructor(public readonly ctx: FakeAudioContext, public readonly nodeType: string) { ctx.nodes.push(this); }
  connect<T>(n: T): T { this.outputs.push(n as unknown as FakeNode); return n; }
  disconnect() { this.outputs = []; }
}
export class FakeGain extends FakeNode { gain = new FakeParam(1); constructor(c: FakeAudioContext) { super(c, 'gain'); } }
export class FakeOsc extends FakeNode {
  type = 'sine'; frequency = new FakeParam(440); detune = new FakeParam(0); startAt = -1; stopAt = -1;
  constructor(c: FakeAudioContext) { super(c, 'osc'); }
  start(t = 0) { this.startAt = t; }
  stop(t = 0) { this.stopAt = t; }
}
export class FakeBiquad extends FakeNode {
  type = 'lowpass'; frequency = new FakeParam(350); Q = new FakeParam(1); gain = new FakeParam(0);
  constructor(c: FakeAudioContext) { super(c, 'biquad'); }
}
export class FakeSource extends FakeNode {
  buffer: unknown = null; startAt = -1; duration = 0;
  constructor(c: FakeAudioContext) { super(c, 'source'); }
  start(t = 0, _o = 0, d = 0) { this.startAt = t; this.duration = d; }
  stop() {}
}
export class FakeCompressor extends FakeNode {
  threshold = new FakeParam(-24); ratio = new FakeParam(12); knee = new FakeParam(30); attack = new FakeParam(0.003); release = new FakeParam(0.25);
  constructor(c: FakeAudioContext) { super(c, 'compressor'); }
}

export class FakeAudioContext {
  nodes: FakeNode[] = [];
  currentTime = 0;
  sampleRate = 8000;
  state = 'running';
  destination: FakeNode;
  constructor() { this.destination = new FakeNode(this, 'destination'); }
  createGain() { return new FakeGain(this); }
  createOscillator() { return new FakeOsc(this); }
  createBiquadFilter() { return new FakeBiquad(this); }
  createBufferSource() { return new FakeSource(this); }
  createDynamicsCompressor() { return new FakeCompressor(this); }
  createBuffer(_ch: number, len: number) { const d = new Float32Array(len); return { getChannelData: () => d, length: len }; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  of<T extends FakeNode>(cls: new (c: FakeAudioContext) => T): T[] { return this.nodes.filter((n): n is T => n instanceof cls); }
  /** Oscillators started at/after t0 whose initial frequency is within ±tol of hz. */
  oscAt(hz: number, tol = 0.031, type?: string): FakeOsc[] {
    return this.of(FakeOsc).filter((o) => {
      const f = (o.frequency.events.find((e) => e.kind === 'set') as { v: number } | undefined)?.v ?? 0;
      return Math.abs(f / hz - 1) <= tol && (!type || o.type === type);
    });
  }
  asBase(): BaseAudioContext { return this as unknown as BaseAudioContext; }
}

/** The gain node an oscillator drives (its envelope). */
export function envOf(o: FakeOsc): FakeGain {
  return o.outputs.find((n) => n instanceof FakeGain) as FakeGain;
}
