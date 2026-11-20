/**
 * Web Audio engine, all synthesized (§8). OWNER: WO-004.
 *
 * Graph: sfx / danger / ui / music / ambience buses → mix → mute → pause-duck → limiter (−1 dBFS) → out.
 * - No AudioContext exists until unlock() (first gesture). Without Web Audio every method is a no-op.
 * - Cues fire from new SimEvents (CUES, one per event type). Heartbeat thumps on each wrap of the sim's
 *   heartbeatPhase, the same clock the vignette pulses on (polish 14).
 * - Nothing is scheduled while the context is not running, so a suspended context never bursts later.
 */
import type { AudioEngine, SimEvent, SimState, ViewState } from '../contracts';
import { heartbeatPhase } from '../sim/sim';
import { CUES, cardWhoosh, heartbeat, uiTick, type Buses, type CueEnv } from './cues';
import { createMusic, type Music } from './music';
import { createSynth, dB, makeBrown, makeNoise, ramp01, type Synth } from './synth';

export const DUCK_S = 0.12;
/** Result card slides in at +250 ms (§7.3); its whoosh fires then. */
export const CARD_AT_MS = 250;

export interface GameAudio extends AudioEngine {
  /** UI paper tick (buttons, toggles). */
  uiTick(): void;
  /** Test/inspection view; null until unlocked. */
  debug(): { state: string; bpm: number; musicPlaying: boolean; muted: boolean; ducked: boolean; heartbeats: number; cues: number } | null;
}

type Ctor = new () => AudioContext;

function findContext(): Ctor | null {
  const g = globalThis as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return g.AudioContext ?? g.webkitAudioContext ?? null;
}

interface Live {
  ctx: AudioContext;
  s: Synth;
  bus: Buses;
  music: Music;
  ambience: AudioNode;
  mute: GainNode;
  duck: GainNode;
}

export function createAudio(make: () => AudioContext | null = defaultMake): GameAudio {
  let live: Live | null = null;
  let failed = false;
  let muted = false;
  let ducked = false;
  let lastSim: SimState | null = null;
  let lastBeat = 0;
  let heartbeats = 0;
  let cues = 0;
  let cardDone = false;
  let nextBird = 0;

  function build(ctx: AudioContext): Live {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.08;
    // The compressor adds automatic makeup gain; trim it back so the ceiling sits at −1 dBFS.
    const ceiling = ctx.createGain();
    ceiling.gain.value = dB(-1);
    const duck = ctx.createGain();
    duck.gain.value = ducked ? 0 : 1;
    const mute = ctx.createGain();
    mute.gain.value = muted ? 0 : 1;
    const mix = ctx.createGain();
    mix.gain.value = 0.9;
    mix.connect(mute).connect(duck).connect(limiter).connect(ceiling).connect(ctx.destination);

    const busAt = (db: number) => {
      const g = ctx.createGain();
      g.gain.value = dB(db);
      g.connect(mix);
      return g;
    };
    const bus: Buses = { sfx: busAt(0), danger: busAt(-2), ui: busAt(-4) };
    const musicBus = busAt(-3);
    const ambience = busAt(0);
    const s = createSynth(ctx, makeNoise(ctx));
    const music = createMusic(s, musicBus);
    startWater(ctx, makeBrown(ctx), ambience);
    nextBird = ctx.currentTime + 4 + Math.random() * 5;
    return { ctx, s, bus, music, ambience, mute, duck };
  }

  function running(): Live | null {
    return live && live.ctx.state === 'running' ? live : null;
  }

  function newRun(l: Live | null, sim: SimState) {
    lastSim = sim;
    lastBeat = heartbeatPhase(sim);
    cardDone = false;
    l?.music.stop();
  }

  return {
    unlock() {
      if (failed) return;
      if (!live) {
        try {
          const ctx = make();
          if (!ctx) {
            failed = true;
            return;
          }
          live = build(ctx);
        } catch {
          failed = true;
          live = null;
          return;
        }
      }
      if (live.ctx.state !== 'running') void live.ctx.resume().catch(() => undefined);
    },

    frame(sim: SimState, view: ViewState, events: readonly SimEvent[]) {
      if (sim !== lastSim) newRun(live, sim);
      const l = running();
      const beat = heartbeatPhase(sim);
      const wrapped = beat < lastBeat;
      lastBeat = beat;
      if (!l) return;
      const at = l.ctx.currentTime;
      if (events.length) {
        const env: CueEnv = { s: l.s, at, bus: l.bus, music: l.music, sim, view };
        for (const e of events) {
          (CUES[e.t].play as (ev: SimEvent, x: CueEnv) => void)(e, env);
          cues++;
        }
      }
      const g = sim.gator;
      const hunting = view.phase === 'play' && !sim.result && g.phase !== 'dormant' && g.phase !== 'sated' && g.phase !== 'retreating';
      if (hunting && wrapped && g.tau > 0.3) {
        heartbeat(l.s, at, ramp01(g.tau, 0.3, 1), l.bus.danger);
        heartbeats++;
      }
      if (view.phase === 'result' && !cardDone && view.resultAgeMs >= CARD_AT_MS) {
        cardDone = true;
        cardWhoosh(l.s, at, l.bus.ui);
      }
      l.music.frame(at, g.tau, sim.frog.layer);
      if (at >= nextBird) {
        bird(l.s, at, l.ambience);
        nextBird = at + 4 + Math.random() * 5;
      }
    },

    setMuted(m: boolean) {
      muted = m;
      if (!live) return;
      const p = live.mute.gain;
      const now = live.ctx.currentTime;
      p.cancelScheduledValues(now);
      p.setValueAtTime(p.value, now);
      p.linearRampToValueAtTime(m ? 0 : 1, now + 0.03);
    },

    duck(on: boolean) {
      ducked = on;
      if (!live) return;
      const p = live.duck.gain;
      const now = live.ctx.currentTime;
      p.cancelScheduledValues(now);
      p.setValueAtTime(p.value, now);
      p.linearRampToValueAtTime(on ? 0 : 1, now + DUCK_S);
    },

    uiTick() {
      const l = running();
      if (l) uiTick(l.s, l.ctx.currentTime, l.bus.ui);
    },

    debug() {
      if (!live) return null;
      return { state: live.ctx.state, bpm: live.music.bpm, musicPlaying: live.music.playing, muted, ducked, heartbeats, cues };
    },
  };
}

function defaultMake(): AudioContext | null {
  const C = findContext();
  return C ? new C() : null;
}

/** Ambience (§8): brown-noise water bed at −30 dB, its cutoff breathing slowly. */
function startWater(ctx: AudioContext, brown: AudioBuffer, dest: AudioNode): void {
  const src = ctx.createBufferSource();
  src.buffer = brown;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.13;
  const depth = ctx.createGain();
  depth.gain.value = 160;
  lfo.connect(depth).connect(lp.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(dB(-30), ctx.currentTime + 2);
  src.connect(lp).connect(g).connect(dest);
  src.start();
  lfo.start();
}

/** FM bird: two or three quick upward chirps (§8 ambience, every 4–9 s). */
function bird(s: Synth, at: number, dest: AudioNode): void {
  const n = 2 + Math.floor(Math.random() * 2);
  const base = 2300 + Math.random() * 900;
  for (let i = 0; i < n; i++) {
    s.fm({ at: at + i * 0.09, dur: 0.07, f: base, f1: base * 1.35, ratio: 2, index: 0.5, indexDecay: 0.05, gain: dB(-32), dest });
  }
}
