/** A recording stand-in for AudioContext: enough of Web Audio for the engine, no sound. */

export interface ParamCall {
  op: 'set' | 'lin' | 'exp' | 'target' | 'cancel';
  v: number;
  t: number;
}

export class FakeParam {
  calls: ParamCall[] = [];
  constructor(public value = 0) {}
  setValueAtTime(v: number, t: number) {
    this.calls.push({ op: 'set', v, t });
    this.value = v;
    return this;
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.calls.push({ op: 'lin', v, t });
    this.value = v;
    return this;
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    if (v <= 0) throw new RangeError('exponential ramp to a non-positive value');
    this.calls.push({ op: 'exp', v, t });
    this.value = v;
    return this;
  }
  setTargetAtTime(v: number, t: number) {
    this.calls.push({ op: 'target', v, t });
    return this;
  }
  cancelScheduledValues(t: number) {
    this.calls.push({ op: 'cancel', v: 0, t });
    return this;
  }
}

export class FakeNode {
  outs: unknown[] = [];
  constructor(public kind: string, public ctx: FakeContext) {
    ctx.nodes.push(this);
  }
  connect<T>(n: T): T {
    this.outs.push(n);
    return n;
  }
  disconnect() {
    this.outs = [];
  }
}

export class FakeSource extends FakeNode {
  starts: number[] = [];
  stops: number[] = [];
  onended: (() => void) | null = null;
  start(t = 0) {
    this.starts.push(t);
  }
  stop(t = 0) {
    this.stops.push(t);
  }
}

export class FakeOsc extends FakeSource {
  type = 'sine';
  frequency = new FakeParam(440);
  constructor(ctx: FakeContext) {
    super('osc', ctx);
  }
}

export class FakeContext {
  nodes: FakeNode[] = [];
  currentTime = 0;
  sampleRate = 8000;
  state: 'running' | 'suspended' | 'closed' = 'running';
  resumes = 0;
  destination = { kind: 'destination' };
  createGain() {
    return Object.assign(new FakeNode('gain', this), { gain: new FakeParam(1) });
  }
  createOscillator() {
    return new FakeOsc(this);
  }
  createBufferSource() {
    return Object.assign(new FakeSource('buffer', this), { buffer: null as unknown, loop: false });
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode('biquad', this), { type: 'lowpass', frequency: new FakeParam(350), Q: new FakeParam(1) });
  }
  createDynamicsCompressor() {
    return Object.assign(new FakeNode('compressor', this), {
      threshold: new FakeParam(-24), knee: new FakeParam(30), ratio: new FakeParam(12), attack: new FakeParam(0.003), release: new FakeParam(0.25),
    });
  }
  createBuffer(_ch: number, len: number, rate: number) {
    const data = new Float32Array(len);
    return { duration: len / rate, sampleRate: rate, length: len, getChannelData: () => data };
  }
  resume() {
    this.resumes++;
    this.state = 'running';
    return Promise.resolve();
  }
  oscs(): FakeOsc[] {
    return this.nodes.filter((n): n is FakeOsc => n instanceof FakeOsc);
  }
  /** Oscillators whose first scheduled frequency equals f (±0.01 Hz). */
  oscsAt(f: number): FakeOsc[] {
    return this.oscs().filter((o) => o.frequency.calls[0] && Math.abs(o.frequency.calls[0].v - f) < 0.01);
  }
}

export const asCtx = (f: FakeContext): AudioContext => f as unknown as AudioContext;
