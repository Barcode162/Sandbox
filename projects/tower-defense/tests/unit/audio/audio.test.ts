// WO-005 audio units (§12, §16.18, §16.19): limiter, crackle, pitches, gain staging, settings → buses,
// ducking, pause, music bar-line crossfades, and the no-AudioContext path.
import { describe, expect, it } from 'vitest';
import type { BlotKind, SimEvent } from '../../../src/contracts/types';
import { createAudio, createAudioEngine } from '../../../src/audio';
import { createCrackleBed, createRateGate, createVoiceLimiter } from '../../../src/audio/limiter';
import { BUS_DB, VOICE, busGain, crackleGain, dbToGain, settingsToGains } from '../../../src/audio/mix';
import { BAR_S, CROSSFADE_S, MUSIC_MIX, nextBarLine } from '../../../src/audio/music';
import { createSettingsStore, DEFAULT_SETTINGS } from '../../../src/app/settings';
import { BLOTS } from '../../../src/data/blots';
import { FakeAudioContext, FakeBiquad, FakeCompressor, FakeGain, FakeOsc, envOf } from './fake-audio';

const pop = (kind: BlotKind = 'splat'): SimEvent => ({ type: 'pop', blotId: 1, kind, x: 0, y: 0, towerId: 1, pale: false });
const leak: SimEvent = { type: 'leak', blotId: 2, kind: 'dot', livesLost: 1 };

function rig() {
  const ctx = new FakeAudioContext();
  const audio = createAudioEngine({ createContext: () => ctx.asBase() });
  audio.unlock();
  const [comp, lim] = ctx.of(FakeCompressor);
  const intoComp = ctx.of(FakeGain).filter((g) => g.outputs.includes(comp));
  const [sfx, music] = intoComp;
  const master = ctx.of(FakeGain).find((g) => g.outputs.includes(lim))!;
  const cats = ctx.of(FakeGain).filter((g) => g.outputs.includes(sfx)); // alert, ui, fire, pop
  const pauseFilter = ctx.of(FakeBiquad)[0];
  return { ctx, audio, comp, lim, sfx, music, master, cats, pauseFilter };
}

describe('voice limiter (§12: 6 per 50 ms)', () => {
  it('admits 6 in a window, then frees slots as the window slides', () => {
    const l = createVoiceLimiter(6, 50);
    const got = Array.from({ length: 10 }, (_, i) => l.admit(i));
    expect(got.filter(Boolean)).toHaveLength(6);
    expect(l.admit(49)).toBe(false);
    expect(l.admit(50)).toBe(true); // the voice from t=0 has left the window
  });
  it('never has more than 6 admitted voices in any 50 ms window (randomised)', () => {
    const l = createVoiceLimiter(6, 50);
    let t = 0, seed = 7;
    const admitted: number[] = [];
    for (let i = 0; i < 3000; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      t += (seed % 9);
      if (l.admit(t)) admitted.push(t);
    }
    for (const a of admitted) expect(admitted.filter((b) => b > a - 50 && b <= a).length).toBeLessThanOrEqual(6);
  });
  it('crackle bed flushes once per window with the extra count', () => {
    const bed = createCrackleBed(50);
    bed.add(10); bed.add(12); bed.add(30);
    expect(bed.flush(40)).toBe(0);
    expect(bed.flush(60)).toBe(3);
    expect(bed.flush(200)).toBe(0);
  });
  it('rate gate spaces repeats', () => {
    const g = createRateGate();
    expect([g.pass('leak', 0, 100), g.pass('leak', 50, 100), g.pass('leak', 100, 100)]).toEqual([true, false, true]);
  });
});

describe('pops and the crackle bed', () => {
  it('caps a burst at 6 pop voices; the extras become one crackle at 0.1·log2(extra+1)', () => {
    const { ctx, audio } = rig();
    audio.update(1000);
    for (let i = 0; i < 10; i++) audio.onSimEvent(pop('splat'));
    expect(audio.debug.popVoices).toBe(6);
    expect(audio.debug.droppedPops).toBe(4);
    expect(ctx.oscAt(BLOTS.splat.popHz, 0.031, 'triangle')).toHaveLength(6);
    audio.update(1060);
    expect(audio.debug.crackles).toBe(1);
    expect(audio.debug.lastCrackleGain).toBeCloseTo(0.1 * Math.log2(5), 6);
    const band = ctx.of(FakeBiquad).filter((b) => b.type === 'bandpass' && (b.frequency.events[0] as { v: number }).v === 2000);
    expect(band).toHaveLength(1);
    expect(crackleGain(1000)).toBeLessThanOrEqual(VOICE.crackleMax);
  });
  it('each kind pops at its §12 pitch within ±3 % detune; Inkmaw has no pop note', () => {
    for (const kind of Object.keys(BLOTS) as BlotKind[]) {
      const { ctx, audio } = rig();
      audio.update(0);
      audio.onSimEvent(pop(kind));
      const hz = BLOTS[kind].popHz;
      if (hz === 0) { expect(audio.debug.popVoices).toBe(0); continue; }
      expect(ctx.oscAt(hz, 0.0301, 'triangle'), kind).toHaveLength(1);
    }
    expect([BLOTS.dot.popHz, BLOTS.drop.popHz, BLOTS.splat.popHz, BLOTS.splash.popHz, BLOTS.blotch.popHz, BLOTS.streak.popHz, BLOTS.wax.popHz, BLOTS.knot.popHz])
      .toEqual([880, 784, 659, 587, 523, 698, 440, 330]);
  });
});

describe('gain staging (§16.19)', () => {
  it('a leak is never quieter than a pop, measured on the voice envelopes', () => {
    expect(VOICE.leak).toBeGreaterThanOrEqual(VOICE.pop);
    const { ctx, audio } = rig();
    audio.update(0);
    audio.onSimEvent(pop('dot'));
    audio.update(500);
    audio.onSimEvent(leak);
    const popPeak = envOf(ctx.oscAt(880, 0.031, 'triangle')[0]).gain.peak();
    const leakPeak = envOf(ctx.oscAt(110, 0.001, 'sine')[0]).gain.peak();
    expect(leakPeak).toBeGreaterThanOrEqual(popPeak);
  });
  it('leaks play at most once per 100 ms', () => {
    const { audio } = rig();
    for (let t = 0; t < 300; t += 10) { audio.update(t); audio.onSimEvent(leak); }
    expect(audio.debug.cues.leak).toBe(3);
  });
  it('a leak ducks pops, fire and UI; the duck releases afterwards', () => {
    const { audio, cats } = rig();
    audio.update(0);
    audio.onSimEvent(leak);
    expect(audio.debug.duck.pop).toBeCloseTo(dbToGain(-8), 6);
    expect(audio.debug.duck.fire).toBeCloseTo(dbToGain(-6), 6);
    expect(audio.debug.duck.alert).toBe(1);
    expect(cats[3].gain.last('target')).toMatchObject({ v: dbToGain(-8) });
    audio.update(400);
    expect(audio.debug.duck.pop).toBe(1);
    expect(cats[3].gain.last('target')).toMatchObject({ v: 1 });
  });
  it('the master chain is the §12 compressor (−18, 4:1) then a safety limiter', () => {
    const { comp, lim, master, sfx, music } = rig();
    expect(comp.threshold.value).toBe(-18);
    expect(comp.ratio.value).toBe(4);
    expect(comp.outputs).toContain(master);
    expect(master.outputs).toContain(lim);
    expect(sfx.gain.value).toBeCloseTo(dbToGain(BUS_DB.sfx), 6);
    expect(music.gain.value).toBeCloseTo(dbToGain(BUS_DB.music), 6);
  });
});

describe('settings reach the buses (§10.8)', () => {
  it('default sliders give −14 dB music and −6 dB sfx; 0 is silence', () => {
    const g = settingsToGains(DEFAULT_SETTINGS);
    expect(20 * Math.log10(g.music)).toBeCloseTo(-14, 6);
    expect(20 * Math.log10(g.sfx)).toBeCloseTo(-6, 6);
    expect(busGain(0, 60, -14)).toBe(0);
    expect(busGain(100, 80, -6)).toBeGreaterThan(g.sfx);
  });
  it('store changes flow to the bus gains and mute zeroes the master', () => {
    const { audio, sfx, music, master } = rig();
    const store = createSettingsStore(null);
    store.subscribe((s) => audio.applySettings(s));
    store.set({ music: 30 });
    expect(music.gain.last('target')!).toMatchObject({ v: busGain(30, 60, -14) });
    store.set({ sfx: 0 });
    expect(sfx.gain.last('target')!).toMatchObject({ v: 0 });
    store.set({ muted: true });
    expect(master.gain.last('target')!).toMatchObject({ v: 0 });
    store.set({ muted: false });
    expect((master.gain.last('target') as { v: number }).v).toBeGreaterThan(0);
  });
  it('settings applied before unlock are used when the graph is built', () => {
    const ctx = new FakeAudioContext();
    const audio = createAudioEngine({ createContext: () => ctx.asBase() });
    audio.applySettings({ ...DEFAULT_SETTINGS, sfx: 40, muted: true });
    audio.unlock();
    const [comp] = ctx.of(FakeCompressor);
    const [sfx] = ctx.of(FakeGain).filter((g) => g.outputs.includes(comp));
    expect(sfx.gain.value).toBeCloseTo(busGain(40, 80, -6), 6);
    expect(audio.debug.gains.master).toBe(0);
  });
  it('the store sanitises corrupt storage and bad patches', () => {
    const mem = new Map<string, string>([['inkfold.settings.v1', JSON.stringify({ music: 'loud', sfx: 250, shake: -4, muted: 'yes', colourblind: true, junk: 1 })]]);
    const store = createSettingsStore({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) });
    expect(store.get()).toEqual({ ...DEFAULT_SETTINGS, sfx: 100, shake: 0, colourblind: true });
    store.set({ music: 33.6 });
    expect(JSON.parse(mem.get('inkfold.settings.v1')!).music).toBe(34);
    const broken = createSettingsStore({ getItem: () => '{not json', setItem: () => { throw new Error('quota'); } });
    expect(() => broken.set({ sfx: 10 })).not.toThrow();
    expect(broken.get().sfx).toBe(10);
  });
});

describe('pause and music (§10.7, §12, §16.18)', () => {
  it('pause lowpasses the music to 800 Hz at −6 dB; resume restores within 160 ms', () => {
    const { audio, pauseFilter } = rig();
    audio.setPaused(true);
    expect(pauseFilter.frequency.last('target')).toMatchObject({ v: 800 });
    audio.setPaused(false);
    const t = pauseFilter.frequency.last('target') as { v: number; tau: number };
    expect(t.v).toBe(20000);
    expect(t.tau * Math.log(100)).toBeLessThanOrEqual(0.16); // 99 % settled
  });
  it('state changes land on the next bar line with an 800 ms crossfade', () => {
    const { ctx, audio } = rig();
    audio.setMusic('intermission');
    audio.update(0);
    const origin = 0.05;
    ctx.currentTime = 1.3;
    audio.setMusic('storm');
    const bar = nextBarLine(1.31, origin);
    expect(bar).toBeCloseTo(origin + BAR_S, 9);
    const layerGains = ctx.of(FakeGain).filter((g) => g.gain.events.some((e) => e.kind === 'lin' && Math.abs(e.t - (bar + CROSSFADE_S)) < 1e-9));
    expect(layerGains.length).toBeGreaterThanOrEqual(Object.keys(MUSIC_MIX.storm).length);
    for (const g of layerGains) expect(g.gain.events.find((e) => e.kind === 'set' && Math.abs(e.t - bar) < 1e-9)).toBeTruthy();
  });
  it('schedules notes ahead on the context clock and follows sim rounds', () => {
    const { ctx, audio } = rig();
    audio.onSimEvent({ type: 'roundStart', round: 3 });
    expect(audio.debug.music).toBe('round');
    const before = ctx.of(FakeOsc).length;
    for (let i = 0; i < 20; i++) { ctx.currentTime += 0.1; audio.update(i * 100); }
    expect(ctx.of(FakeOsc).length).toBeGreaterThan(before + 10);
    audio.onSimEvent({ type: 'roundStart', round: 16 });
    expect(audio.debug.music).toBe('storm');
    audio.onSimEvent({ type: 'bossArrive', blotId: 9, maxHp: 900 });
    expect(audio.debug.music).toBe('boss');
    audio.onSimEvent({ type: 'victory', lives: 60, pops: 9000, bestTowerId: 1 });
    expect(audio.debug.music).toBe('victory');
    expect(audio.debug.cues.victory).toBe(1);
    audio.setMusic('victory'); // the app may also call it: one sting only
    expect(audio.debug.cues.victory).toBe(1);
  });
  it('title music is pinned: attract-sim events do not move it', () => {
    const { audio } = rig();
    audio.setMusic('title');
    audio.onSimEvent({ type: 'roundStart', round: 1 });
    expect(audio.debug.music).toBe('title');
    audio.setMusic('intermission');
    audio.onSimEvent({ type: 'roundStart', round: 1 });
    expect(audio.debug.music).toBe('round');
  });
});

describe('no AudioContext (headless, autoplay-blocked)', () => {
  it('createAudio in Node is a silent no-op that never throws', () => {
    const a = createAudio();
    expect(() => {
      a.unlock(); a.applySettings(DEFAULT_SETTINGS); a.setMusic('round'); a.setPaused(true); a.setPaused(false);
      a.onSimEvent(pop()); a.onSimEvent(leak); a.ui('click'); a.ui('sfxPreview'); a.update(16);
    }).not.toThrow();
  });
  it('a throwing context factory or a broken graph stays silent', () => {
    const a = createAudioEngine({ createContext: () => { throw new Error('NotAllowedError'); } });
    expect(() => { a.unlock(); a.onSimEvent(pop()); a.update(1); }).not.toThrow();
    expect(a.debug.ready).toBe(false);
    const ctx = new FakeAudioContext();
    const b = createAudioEngine({ createContext: () => ctx.asBase() });
    b.unlock();
    ctx.createOscillator = () => { throw new Error('closed'); };
    expect(() => { b.onSimEvent(pop()); b.ui('upgrade3'); b.update(5); }).not.toThrow();
  });
});
