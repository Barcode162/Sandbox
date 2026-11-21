// The §12 audio engine over any BaseAudioContext (a live AudioContext in the game, an
// OfflineAudioContext in the clipping check). Graph:
//   cue → category duck gain (alert/ui/fire/pop) → sfx bus ┐
//   music layers → pause lowpass → pause gain → music bus  ┴→ compressor → master (mute) → safety limiter → out
import type { AudioEngine, MusicState, Settings, SimEvent, UiSound } from '../contracts/types';
import { DEFAULT_SETTINGS } from '../app/settings';
import { STORM_FROM_ROUND } from '../data/waves';
import { BLOTS } from '../data/blots';
import { createCrackleBed, createRateGate, createVoiceLimiter } from './limiter';
import { CAPS, CATEGORIES, COMPRESSOR, DUCK, LIMITER, crackleGain, dbToGain, settingsToGains, type Category } from './mix';
import { createMusic, type Music } from './music';
import * as S from './synth';

export interface AudioEngineOptions {
  /** Called lazily on unlock(); return null when audio is unavailable. Must not throw (it is guarded anyway). */
  createContext: () => BaseAudioContext | null;
  /**
   * Context time (s) at which a cue triggered at real time `nowMs` starts. Default: as soon as possible
   * (`currentTime` + 5 ms). The offline check maps real time straight onto the render timeline.
   */
  startTime?: (ctx: BaseAudioContext, nowMs: number) => number;
  /** Where the master goes (default ctx.destination). The offline check can tap before the safety limiter. */
  connectOut?: (ctx: BaseAudioContext, master: AudioNode, limiter: AudioNode) => void;
}

/** Counters for tests and the offline check. */
export interface AudioDebug {
  readonly ready: boolean;
  readonly popVoices: number;
  readonly droppedPops: number;
  readonly crackles: number;
  readonly lastCrackleGain: number;
  readonly cues: Readonly<Record<string, number>>;
  readonly music: MusicState;
  readonly musicPinned: boolean;
  readonly paused: boolean;
  readonly gains: { music: number; sfx: number; master: number };
  readonly duck: Readonly<Record<Category, number>>;
}

export type FullAudioEngine = AudioEngine & { readonly debug: AudioDebug };

interface Graph {
  ctx: BaseAudioContext;
  voice: S.Voice;
  cat: Record<Category, GainNode>;
  sfx: GainNode;
  music: GainNode;
  pauseFilter: BiquadFilterNode;
  pauseGain: GainNode;
  master: GainNode;
  mus: Music;
}

const PAUSE = { lowpassHz: 800, gain: dbToGain(-6), tau: 0.03, openHz: 20000 } as const;

export function createAudioEngine(opts: AudioEngineOptions): FullAudioEngine {
  let g: Graph | null = null;
  let failed = false;
  let settings: Settings = { ...DEFAULT_SETTINGS };
  let nowMs = 0;
  let paused = false;
  let musicWanted: MusicState = 'silent';
  let pinned = false; // title/silent set by the app: sim events do not move the music
  const popLimiter = createVoiceLimiter(CAPS.popVoices, CAPS.popWindowMs);
  const fireLimiter = createVoiceLimiter(CAPS.fireVoices, CAPS.fireWindowMs);
  const tinkLimiter = createVoiceLimiter(CAPS.tinkVoices, CAPS.tinkWindowMs);
  const landLimiter = createVoiceLimiter(CAPS.landVoices, CAPS.landWindowMs);
  const bed = createCrackleBed(CAPS.popWindowMs);
  const gate = createRateGate();
  const duckUntil: Record<Category, number> = { alert: 0, ui: 0, fire: 0, pop: 0 };
  const duckDb: Record<Category, number> = { alert: 0, ui: 0, fire: 0, pop: 0 };
  const duckApplied: Record<Category, number> = { alert: 1, ui: 1, fire: 1, pop: 1 };
  const cues: Record<string, number> = {};
  let popVoices = 0;
  let droppedPops = 0;
  let crackles = 0;
  let lastCrackleGain = 0;

  const startAt = (ctx: BaseAudioContext): number =>
    opts.startTime ? opts.startTime(ctx, nowMs) : ctx.currentTime + 0.005;

  function build(): Graph | null {
    if (g || failed) return g;
    try {
      const ctx = opts.createContext();
      if (!ctx) { failed = true; return null; }
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(COMPRESSOR.threshold, 0);
      comp.ratio.setValueAtTime(COMPRESSOR.ratio, 0);
      comp.knee.setValueAtTime(COMPRESSOR.knee, 0);
      comp.attack.setValueAtTime(COMPRESSOR.attack, 0);
      comp.release.setValueAtTime(COMPRESSOR.release, 0);
      const master = ctx.createGain();
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.setValueAtTime(LIMITER.threshold, 0);
      lim.ratio.setValueAtTime(LIMITER.ratio, 0);
      lim.knee.setValueAtTime(LIMITER.knee, 0);
      lim.attack.setValueAtTime(LIMITER.attack, 0);
      lim.release.setValueAtTime(LIMITER.release, 0);
      comp.connect(master);
      master.connect(lim);
      if (opts.connectOut) opts.connectOut(ctx, master, lim); else lim.connect(ctx.destination);
      const sfx = ctx.createGain();
      sfx.connect(comp);
      const music = ctx.createGain();
      music.connect(comp);
      const pauseGain = ctx.createGain();
      pauseGain.gain.setValueAtTime(1, 0);
      pauseGain.connect(music);
      const pauseFilter = ctx.createBiquadFilter();
      pauseFilter.type = 'lowpass';
      pauseFilter.frequency.setValueAtTime(PAUSE.openHz, 0);
      pauseFilter.Q.setValueAtTime(0.7, 0);
      pauseFilter.connect(pauseGain);
      const cat = {} as Record<Category, GainNode>;
      for (const c of CATEGORIES) {
        const n = ctx.createGain();
        n.gain.setValueAtTime(1, 0);
        n.connect(sfx);
        cat[c] = n;
      }
      const voice = S.makeVoice(ctx);
      g = { ctx, voice, cat, sfx, music, pauseFilter, pauseGain, master, mus: createMusic(voice, pauseFilter) };
      const gains = settingsToGains(settings);
      sfx.gain.setValueAtTime(gains.sfx, 0);
      music.gain.setValueAtTime(gains.music, 0);
      master.gain.setValueAtTime(gains.master, 0);
      if (paused) applyPause(g, true);
      if (musicWanted !== 'silent') g.mus.setState(musicWanted, ctx.currentTime);
      return g;
    } catch {
      failed = true;
      g = null;
      return null;
    }
  }

  /** Guard every graph operation: audio must never take the game down. */
  function safely(fn: (gr: Graph) => void): void {
    if (!g) return;
    try { fn(g); } catch { /* a closed or broken context: stay silent */ }
  }

  function count(name: string): void { cues[name] = (cues[name] ?? 0) + 1; }

  function duck(by: Category): void {
    const d = DUCK[by];
    for (const c of CATEGORIES) {
      const db = d.db[c];
      if (db === undefined) continue;
      if (nowMs >= duckUntil[c] || db < duckDb[c]) duckDb[c] = db;
      duckUntil[c] = Math.max(duckUntil[c], nowMs + d.ms);
    }
    applyDucks();
  }

  function applyDucks(): void {
    safely((gr) => {
      const t = gr.ctx.currentTime;
      for (const c of CATEGORIES) {
        const target = nowMs < duckUntil[c] ? dbToGain(duckDb[c]) : 1;
        if (target === duckApplied[c]) continue;
        duckApplied[c] = target;
        gr.cat[c].gain.setTargetAtTime(target, t, target < 1 ? 0.01 : 0.06);
      }
    });
  }

  /** Play a cue in a category, with ducking and a same-cue dedupe (UI + sim double triggers). */
  function cue(name: string, c: Category, play: (v: S.Voice, dest: AudioNode, t: number) => void, dedupeMs: number = CAPS.dedupeMs): void {
    if (!g) return;
    if (dedupeMs > 0 && !gate.pass(name, nowMs, dedupeMs)) return;
    safely((gr) => {
      play(gr.voice, gr.cat[c], startAt(gr.ctx));
      count(name);
    });
    if (c !== 'pop') duck(c);
  }

  function flushCrackle(): void {
    const extra = bed.flush(nowMs);
    if (!extra) return;
    lastCrackleGain = crackleGain(extra);
    crackles++;
    safely((gr) => S.crackle(gr.voice, gr.cat.pop, startAt(gr.ctx), lastCrackleGain, CAPS.crackleMs, CAPS.crackleHz));
  }

  function popCue(e: SimEvent & { type: 'pop' }): void {
    if (!g || BLOTS[e.kind].popHz <= 0) return;
    flushCrackle();
    if (!popLimiter.admit(nowMs)) { droppedPops++; bed.add(nowMs); return; }
    popVoices++;
    safely((gr) => S.pop(gr.voice, gr.cat.pop, startAt(gr.ctx), e.kind));
  }

  function limited(lim: typeof fireLimiter, name: string, c: Category, play: (v: S.Voice, d: AudioNode, t: number) => void): void {
    if (!g || !lim.admit(nowMs)) return;
    cue(name, c, play, 0);
  }

  function simMusic(s: MusicState): void {
    if (pinned) return;
    setMusicState(s);
  }

  function setMusicState(s: MusicState): void {
    musicWanted = s;
    safely((gr) => gr.mus.setState(s, gr.ctx.currentTime));
  }

  function sting(name: 'victory' | 'gameover'): void {
    cue(name, 'alert', name === 'victory' ? S.victorySting : S.gameOverSting, 3000);
  }

  function applyPause(gr: Graph, on: boolean): void {
    const t = gr.ctx.currentTime;
    gr.pauseFilter.frequency.setTargetAtTime(on ? PAUSE.lowpassHz : PAUSE.openHz, t, PAUSE.tau);
    gr.pauseGain.gain.setTargetAtTime(on ? PAUSE.gain : 1, t, PAUSE.tau);
  }

  const engine: FullAudioEngine = {
    unlock() {
      const gr = build();
      if (!gr) return;
      try {
        const live = gr.ctx as AudioContext;
        if (typeof live.resume === 'function' && live.state === 'suspended') live.resume().catch(() => undefined);
      } catch { /* ignore */ }
    },
    onSimEvent(e) {
      if (!g) return;
      switch (e.type) {
        case 'pop': popCue(e); break;
        case 'immune': limited(tinkLimiter, 'tink', 'pop', S.tink); break;
        case 'fire':
          if (!gate.pass(`fire${e.towerId}`, nowMs, 30)) break;
          if (e.attack === 'quill' || e.attack === 'lance') limited(fireLimiter, 'ternFire', 'fire', S.ternFire);
          else if (e.attack === 'jets') limited(fireLimiter, 'jets', 'fire', S.jetsFire);
          else if (e.attack === 'stone') limited(fireLimiter, 'frogFire', 'fire', S.frogFire);
          else if (e.attack === 'pulse') limited(fireLimiter, 'koiPulse', 'fire', S.koiPulse);
          else limited(fireLimiter, 'owlGlare', 'fire', S.owlGlare);
          break;
        // Koi pulses and Owl beams may also arrive as their own events; one sound per tower per tick.
        case 'pulse': if (gate.pass(`fire${e.towerId}`, nowMs, 30)) limited(fireLimiter, 'koiPulse', 'fire', S.koiPulse); break;
        case 'beam': if (gate.pass(`fire${e.towerId}`, nowMs, 30)) limited(fireLimiter, 'owlGlare', 'fire', S.owlGlare); break;
        case 'land': limited(landLimiter, 'frogLand', 'fire', S.frogLand); break;
        // place / upgrade / sell: the UI is the single source (game.ts calls ui() per action), never the sim event.
        case 'leak': cue('leak', 'alert', S.leak, CAPS.leakGapMs); break;
        case 'roundStart':
          cue('roundStart', 'ui', S.roundStart);
          simMusic(e.round >= STORM_FROM_ROUND ? 'storm' : 'round');
          break;
        case 'roundClear': cue('roundClear', 'ui', S.roundClear); simMusic('intermission'); break;
        case 'bossWarning': simMusic('boss'); break;
        case 'bossArrive': cue('bossArrive', 'alert', S.bossArrive, 1000); simMusic('boss'); break;
        case 'bossShed': cue('bossShed', 'alert', S.bossShed, 200); break;
        case 'bossDeath': cue('bossDeath', 'alert', S.bossDeath, 1000); break;
        case 'victory': sting('victory'); simMusic('victory'); break;
        case 'defeat': sting('gameover'); simMusic('gameover'); break;
        default: break; // spawn, hit, money, target, rejected, firstSeen, hitStop: visual only
      }
    },
    ui(s: UiSound) {
      switch (s) {
        case 'hover': cue('hover', 'ui', S.hover, 30); break;
        case 'click': cue('click', 'ui', S.click, 30); break;
        case 'invalid': cue('invalid', 'ui', S.invalid, 120); break;
        case 'place': cue('place', 'ui', S.place); break;
        case 'upgrade1': case 'upgrade2': case 'upgrade3': {
          const tier = Number(s.slice(-1));
          cue(s, 'ui', (v, d, t) => S.upgrade(v, d, t, tier));
          break;
        }
        case 'sell': cue('sell', 'ui', S.sell); break;
        case 'sealed': cue('sealed', 'ui', S.sealed, 120); break;
        // §10.8: each Effects change plays a pop at the new volume (bypasses the pop limiter).
        case 'sfxPreview': cue('sfxPreview', 'ui', (v, d, t) => S.pop(v, d, t, 'splat'), 60); break;
      }
    },
    setMusic(s) {
      pinned = s === 'title' || s === 'silent';
      if (s === 'victory' || s === 'gameover') sting(s);
      setMusicState(s);
    },
    applySettings(s) {
      settings = { ...s };
      const gains = settingsToGains(settings);
      safely((gr) => {
        const t = gr.ctx.currentTime;
        gr.sfx.gain.setTargetAtTime(gains.sfx, t, 0.02);
        gr.music.gain.setTargetAtTime(gains.music, t, 0.05);
        gr.master.gain.setTargetAtTime(gains.master, t, 0.01);
      });
    },
    setPaused(on) {
      if (on === paused) return;
      paused = on;
      safely((gr) => applyPause(gr, on));
    },
    update(now) {
      nowMs = now;
      if (!g) return;
      flushCrackle();
      applyDucks();
      safely((gr) => gr.mus.schedule(gr.ctx.currentTime));
    },
    get debug(): AudioDebug {
      return {
        ready: !!g, popVoices, droppedPops, crackles, lastCrackleGain, cues: { ...cues },
        music: musicWanted, musicPinned: pinned, paused, gains: settingsToGains(settings),
        duck: { ...duckApplied },
      };
    },
  };
  return engine;
}
