// src/audio/index.ts — owned by WO-003. Web Audio synthesis only (experience.md §7): every SFX recipe, procedural
// music (88 BPM D-major pentatonic; title / fight / phase-2 / victory / fallen), ambience (wind, falls, birds), bus
// mapping from sim events, ducking, iOS unlock on the first gesture, pause freeze with a 200 ms fade back.
// The id log works before unlock so tests can assert sounds fired without hearing them.
import type { AudioEngine, CreateAudio, MusicState, SfxId } from '../contracts.ts';
import { makeRng } from '../core/rng.ts';

const dB = (d: number) => Math.pow(10, d / 20);
const D_PENTA = [62, 64, 66, 69, 71]; // D E F# A B (MIDI)
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
/** Chords (MIDI roots + voicing) cycling every 2 bars: D, Bm, G, A — pentatonic-friendly. */
const CHORDS = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 64]];

type Layer = 'title' | 'fight' | 'p2';

export const createAudio: CreateAudio = (bus, settings) => {
  const log: SfxId[] = [];
  const rnd = makeRng(77);
  let ac: AudioContext | null = null;
  let master!: GainNode, musicBus!: GainNode, sfxBus!: GainNode, ambBus!: GainNode, duck!: GainNode;
  let noiseBuf!: AudioBuffer;
  let unlocked = false;
  let paused = false;
  let music: MusicState = 'off';
  let layer: Layer = 'title';
  let enraged = false;
  let voicesFoot = 0;
  let sched = 0;
  let nextBeat = 0;
  let beat = 0;
  let birdAt = 0;
  let telegraphNodes: { stop(): void } | null = null;

  const vol = () => settings.get().volume;
  const mus = () => settings.get().music;

  // ───────── building blocks ─────────
  function env(g: GainNode, t: number, peak: number, attack: number, dur: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, peak: number, dest: AudioNode, attack = 0.004, detune = 0): OscillatorNode {
    const o = ac!.createOscillator();
    const g = ac!.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    o.detune.value = detune;
    env(g, t, peak, attack, dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t: number, dur: number, type: BiquadFilterType, f0: number, f1: number, q: number, peak: number, dest: AudioNode, attack = 0.003): void {
    const s = ac!.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ac!.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ac!.createGain();
    env(g, t, peak, attack, dur);
    s.connect(f).connect(g).connect(dest);
    s.start(t, rnd() * 1.5);
    s.stop(t + dur + 0.05);
  }
  function duckMusic(t: number): void {
    duck.gain.cancelScheduledValues(t);
    duck.gain.setValueAtTime(duck.gain.value, t);
    duck.gain.linearRampToValueAtTime(dB(-6), t + 0.03);
    duck.gain.setValueAtTime(dB(-6), t + 0.3);
    duck.gain.linearRampToValueAtTime(1, t + 0.6);
  }

  // ───────── SFX recipes (§7) ─────────
  function hit(t: number, k: number, p: number): void {
    tone('triangle', 180 * p, 90 * p, t, 0.08 * 1.6, 0.7 * k, sfxBus);
    noise(t, 0.02, 'highpass', 3000, 3000, 0.7, 0.5 * k, sfxBus);
    tone('sine', 2200 * p, 2100 * p, t + 0.005, 0.06, 0.18 * k, sfxBus);
    tone('square', 2200 * p, 2000 * p, t + 0.005, 0.03, 0.04 * k, sfxBus);
  }
  function slam(t: number, k: number): void {
    tone('sine', 70, 35, t, 0.4, 0.9 * k, sfxBus, 0.006);
    noise(t, 0.5, 'lowpass', 800, 200, 0.8, 0.55 * k, sfxBus);
    for (let i = 0; i < 12; i++) noise(t + 0.05 + i * 0.03 + rnd() * 0.02, 0.025, 'bandpass', 1800 + rnd() * 2000, 1500, 3, 0.12 * k, sfxBus);
    duckMusic(t);
  }
  const RECIPES: Record<SfxId, (t: number, g: number, p: number) => void> = {
    swing1: (t, g, p) => noise(t, 0.14, 'bandpass', 2400 * p, 800 * p, 1.4, 0.5 * g, sfxBus, 0.01),
    swing2: (t, g, p) => noise(t, 0.14, 'bandpass', 2400 * 1.12 * p, 800 * 1.12 * p, 1.4, 0.5 * g, sfxBus, 0.01),
    swing3: (t, g, p) => {
      noise(t, 0.2, 'bandpass', 2400 * 0.9 * p, 700 * 0.9 * p, 1.2, 0.6 * g, sfxBus, 0.015);
      tone('sine', 300, 140, t, 0.2, 0.15 * g, sfxBus);
    },
    hit: (t, g, p) => hit(t, g, p),
    crit: (t, g, p) => {
      hit(t, g, p);
      tone('sine', 1320, 1320, t + 0.01, 0.4, 0.22 * g, sfxBus, 0.003);
      tone('sine', 1980, 1980, t + 0.01, 0.4, 0.14 * g, sfxBus, 0.003);
      duckMusic(t);
    },
    dodge: (t, g, p) => noise(t, 0.26, 'lowpass', 1200 * p, 300 * p, 0.7, 0.45 * g, sfxBus, 0.02),
    perfectDodge: (t, g) => {
      noise(t, 0.3, 'bandpass', 3000, 6000, 2, 0.25 * g, sfxBus, 0.02);
      tone('sine', 1568, 2093, t, 0.35, 0.16 * g, sfxBus);
    },
    skill: (t, g) => {
      const f = ac!.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 900;
      f.Q.value = 1.2;
      f.connect(sfxBus);
      tone('sawtooth', 300, 900, t, 0.36, 0.3 * g, f, 0.02);
      noise(t, 0.36, 'bandpass', 900, 2600, 1, 0.4 * g, sfxBus, 0.03);
    },
    skillReady: (t, g) => tone('sine', 2600, 2600, t, 0.25, 0.14 * g, sfxBus, 0.002),
    footstep: (t, g, p) => {
      if (voicesFoot >= 4) return;
      voicesFoot++;
      setTimeout(() => voicesFoot--, 60);
      noise(t, 0.03, 'lowpass', 900 * p, 500 * p, 0.7, 0.22 * g, sfxBus);
    },
    heroHurt: (t, g) => {
      const f = ac!.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 660;
      f.Q.value = 2;
      f.connect(sfxBus);
      tone('square', 330, 260, t, 0.12, 0.22 * g, f);
      tone('sine', 110, 60, t, 0.16, 0.5 * g, sfxBus);
    },
    heroFall: (t, g) => {
      tone('triangle', 440, 220, t, 0.6, 0.2 * g, sfxBus, 0.02);
      tone('sine', 90, 45, t + 0.3, 0.4, 0.4 * g, sfxBus);
    },
    golemWake: (t, g) => {
      for (let i = 0; i < 14; i++) tone('triangle', 600 + rnd() * 120, 400, t + i * 0.12, 0.03, 0.18 * g, sfxBus);
      // Two-tone horn (a fifth), low-passed saws.
      const f = ac!.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      f.connect(sfxBus);
      tone('sawtooth', mtof(50), mtof(50), t + 1.8, 1.1, 0.22 * g, f, 0.08);
      tone('sawtooth', mtof(57), mtof(57), t + 1.8, 1.1, 0.18 * g, f, 0.08, 6);
    },
    golemWindup: (t, g) => tone('sine', 55, 60, t, 0.9, 0.3 * g, sfxBus, 0.4),
    golemSlam: (t, g) => slam(t, g),
    golemSweep: (t, g) => noise(t, 0.4, 'lowpass', 600, 180, 0.8, 0.6 * g, sfxBus, 0.06),
    golemToss: (t, g) => noise(t, 0.35, 'lowpass', 500, 900, 0.8, 0.4 * g, sfxBus, 0.05),
    boulderLand: (t, g) => slam(t, g * dB(-6)),
    shockwave: (t, g) => noise(t + 0.02, 0.45, 'bandpass', 400, 160, 1.2, 0.3 * g, sfxBus, 0.02),
    golemStep: (t, g) => tone('sine', 60, 40, t, 0.14, 0.35 * g, sfxBus),
    golemHurt: (t, g) => tone('sine', 120, 80, t, 0.15, 0.3 * g, sfxBus),
    golemStagger: (t, g) => {
      tone('sine', 220, 110, t, 0.5, 0.25 * g, sfxBus, 0.02);
      for (let i = 0; i < 3; i++) tone('sine', 1760 + i * 220, 1760 + i * 220, t + 0.1 + i * 0.08, 0.2, 0.06 * g, sfxBus);
    },
    golemRoar: (t, g) => {
      const f = ac!.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(1200, t + 0.9);
      f.connect(sfxBus);
      for (const d of [-14, 0, 13]) tone('sawtooth', 70, 64, t, 1.0, 0.25 * g, f, 0.12, d);
      tone('sine', 50, 30, t, 0.6, 0.8 * g, sfxBus);
      duckMusic(t);
    },
    golemCrumble: (t, g) => {
      for (let i = 0; i < 14; i++) tone('sine', 90 + rnd() * 60, 45, t + (i / 14) * 0.9 + rnd() * 0.04, 0.12, 0.35 * g, sfxBus);
      tone('sine', 220, 70, t, 1.4, 0.12 * g, sfxBus, 0.02);
      duckMusic(t);
    },
    minionSpawn: (t, g) => tone('triangle', 500, 900, t, 0.12, 0.15 * g, sfxBus),
    minionHit: (t, g) => tone('triangle', 360, 200, t, 0.06, 0.2 * g, sfxBus),
    coin: (t, g, p) => {
      tone('sine', 1568 * p, 1568 * p, t, 0.08, 0.12 * g, sfxBus, 0.002);
      tone('sine', 2093 * p, 2093 * p, t + 0.04, 0.08, 0.1 * g, sfxBus, 0.002);
    },
    uiClick: (t, g) => tone('sine', 1000, 1000, t, 0.04, 0.15 * g, sfxBus, 0.002),
    uiOpen: (t, g) => {
      tone('sine', 880, 880, t, 0.05, 0.12 * g, sfxBus, 0.002);
      tone('sine', 1320, 1320, t + 0.05, 0.06, 0.12 * g, sfxBus, 0.002);
    },
    uiBack: (t, g) => {
      tone('sine', 1320, 1320, t, 0.05, 0.12 * g, sfxBus, 0.002);
      tone('sine', 880, 880, t + 0.05, 0.06, 0.12 * g, sfxBus, 0.002);
    },
    hint: (t, g) => tone('sine', 1760, 1760, t, 0.18, 0.08 * g, sfxBus, 0.005),
    victory: (t, g) => stinger(t, [[62, 66, 69], [67, 71, 74], [62, 69, 76]], 0.42, g),
    defeat: (t, g) => stinger(t, [[69, 62], [64, 57]], 0.6, g),
  };
  function stinger(t: number, chords: number[][], step: number, g: number): void {
    chords.forEach((ch, i) => {
      for (const m of ch) {
        tone('triangle', mtof(m), mtof(m), t + i * step, step * 2.2, 0.08 * g, musicBus, 0.01);
        tone('sine', mtof(m + 12), mtof(m + 12), t + i * step, step * 1.6, 0.03 * g, musicBus, 0.005);
      }
    });
  }

  // ───────── music (lookahead scheduler) ─────────
  const bpm = () => (layer === 'p2' ? 96 : 88);
  function scheduleBeat(t: number, b: number): void {
    if (music === 'off' || music === 'victory') return;
    const spb = 60 / bpm();
    const bar = Math.floor(b / 4);
    const chord = CHORDS[Math.floor(bar / 2) % 4]!;
    // Pad: a new chord every 2 bars (two detuned triangles per voice, slow attack).
    if (b % 8 === 0) for (const m of chord) for (const d of [-7, 7]) tone('triangle', mtof(m), mtof(m), t, spb * 8.4, 0.035, musicBus, 0.6, d);
    // Bell arpeggio on 8ths (title + fight), 16ths in phase 2.
    const sub = layer === 'p2' ? 4 : 2;
    for (let s = 0; s < sub; s++) {
      if (layer !== 'p2' && (b + s) % 3 === 2) continue;
      const n = D_PENTA[(b * sub + s * 3 + bar) % 5]! + 12;
      const tt = t + (s * spb) / sub;
      tone('sine', mtof(n), mtof(n), tt, 0.5, layer === 'title' ? 0.05 : 0.035, musicBus, 0.003);
      tone('sine', mtof(n) * 3.01, mtof(n) * 3.01, tt, 0.18, 0.008, musicBus, 0.002);
    }
    if (layer === 'title') return;
    // Plucked bass + low taiko pulse.
    if (b % 2 === 0) tone('triangle', mtof(chord[0]! - 12), mtof(chord[0]! - 12), t, spb * 0.9, 0.16, musicBus, 0.004);
    if (b % 4 === 0 || b % 4 === 3) {
      tone('sine', 70, 42, t, 0.32, 0.4, musicBus, 0.003);
      noise(t, 0.06, 'lowpass', 400, 200, 0.7, 0.15, musicBus);
    }
    if (layer === 'p2') {
      // Frame drum on the off-beats.
      noise(t + spb / 2, 0.08, 'bandpass', 900, 500, 1.5, 0.12, musicBus);
      tone('sine', 140, 90, t + spb / 2, 0.1, 0.15, musicBus);
    }
  }
  function tick(): void {
    if (!ac || paused) return;
    const now = ac.currentTime;
    while (nextBeat < now + 0.15) {
      scheduleBeat(nextBeat, beat++);
      nextBeat += 60 / bpm();
    }
    // Birds every 4–9 s (FM sine 2–4 kHz).
    if (now > birdAt) {
      birdAt = now + 4 + rnd() * 5;
      const f = 2000 + rnd() * 2000;
      for (let i = 0; i < 2 + Math.floor(rnd() * 3); i++) {
        const t = now + 0.05 + i * 0.13;
        const o = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
        o.frequency.value = f;
        m.frequency.value = 30 + rnd() * 30;
        mg.gain.value = f * 0.15;
        m.connect(mg).connect(o.frequency);
        env(g, t, 0.05, 0.01, 0.09);
        o.connect(g).connect(ambBus);
        o.start(t);
        m.start(t);
        o.stop(t + 0.12);
        m.stop(t + 0.12);
      }
    }
  }
  function startAmbience(): void {
    // Wind: noise, LP 400 Hz, 0.1 Hz swell. Falls: band-passed hiss.
    const mk = (type: BiquadFilterType, f: number, q: number, gain: number, lfo: number) => {
      const s = ac!.createBufferSource();
      s.buffer = noiseBuf;
      s.loop = true;
      const flt = ac!.createBiquadFilter();
      flt.type = type;
      flt.frequency.value = f;
      flt.Q.value = q;
      const g = ac!.createGain();
      g.gain.value = gain;
      if (lfo > 0) {
        const o = ac!.createOscillator(), og = ac!.createGain();
        o.frequency.value = lfo;
        og.gain.value = gain * 0.6;
        o.connect(og).connect(g.gain);
        o.start();
      }
      s.connect(flt).connect(g).connect(ambBus);
      s.start();
    };
    mk('lowpass', 400, 0.5, 0.5, 0.1);
    mk('bandpass', 2500, 0.6, 0.08, 0);
  }

  function applyVolume(): void {
    if (!ac) return;
    const t = ac.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(paused ? 0 : vol(), t, 0.05);
    musicBus.gain.setTargetAtTime(dB(-14) * 2 * mus(), t, 0.05);
  }

  function telegraph(frames: number): void {
    if (!ac || paused) return;
    telegraphNodes?.stop();
    const t = ac.currentTime, dur = frames / 60;
    const o = ac.createOscillator(), trem = ac.createOscillator(), tg = ac.createGain(), g = ac.createGain();
    o.frequency.value = 55;
    trem.frequency.value = 6;
    tg.gain.value = 0.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    trem.connect(tg).connect(g.gain);
    o.connect(g).connect(sfxBus);
    const hum = ac.createOscillator(), hg = ac.createGain();
    hum.type = 'triangle';
    hum.frequency.setValueAtTime(220, t);
    hum.frequency.exponentialRampToValueAtTime(330, t + dur);
    env(hg, t, 0.07, dur * 0.8, dur + 0.15);
    hum.connect(hg).connect(sfxBus);
    for (const n of [o, trem, hum]) {
      n.start(t);
      n.stop(t + dur + 0.2);
    }
    telegraphNodes = { stop: () => g.gain.setTargetAtTime(0.0001, ac!.currentTime, 0.02) };
  }

  const engine: AudioEngine = {
    async unlock() {
      if (!ac) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        ac = new Ctor({ latencyHint: 'interactive' });
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -10;
        comp.ratio.value = 4;
        comp.connect(ac.destination);
        master = ac.createGain();
        master.gain.value = vol();
        master.connect(comp);
        duck = ac.createGain();
        duck.connect(master);
        musicBus = ac.createGain();
        musicBus.gain.value = dB(-14) * 2 * mus();
        musicBus.connect(duck);
        sfxBus = ac.createGain();
        sfxBus.gain.value = dB(-6);
        sfxBus.connect(master);
        ambBus = ac.createGain();
        ambBus.gain.value = dB(-18);
        ambBus.connect(master);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
        startAmbience();
        nextBeat = ac.currentTime + 0.1;
        birdAt = ac.currentTime + 3;
        sched = window.setInterval(tick, 25);
        // iOS: play a silent buffer inside the gesture.
        const s = ac.createBufferSource();
        s.buffer = ac.createBuffer(1, 1, 22050);
        s.connect(ac.destination);
        s.start();
      }
      if (ac.state !== 'running' && !paused) await ac.resume().catch(() => undefined);
      unlocked = ac.state === 'running' || unlocked;
      if (music === 'off') engine.setMusic('title');
    },
    get unlocked() {
      return unlocked;
    },
    play(id, opts) {
      log.push(id);
      if (log.length > 64) log.shift();
      if (!ac || paused || ac.state !== 'running') return;
      RECIPES[id](ac.currentTime + 0.005, opts?.gain ?? 1, opts?.pitch ?? 1);
    },
    setMusic(state) {
      const prev = music;
      music = state;
      if (state === 'title') layer = 'title';
      else if (state === 'fight') layer = enraged ? 'p2' : 'fight';
      if (ac && state !== prev && (state === 'title' || state === 'fight') && musicBus) {
        // Crossfade feel: dip and swell back over 1.5 s.
        const t = ac.currentTime;
        musicBus.gain.cancelScheduledValues(t);
        musicBus.gain.setValueAtTime(musicBus.gain.value, t);
        musicBus.gain.linearRampToValueAtTime(dB(-14) * 0.6 * mus(), t + 0.4);
        musicBus.gain.linearRampToValueAtTime(dB(-14) * 2 * mus(), t + 1.5);
      }
    },
    setVolume() {
      applyVolume();
    },
    setPaused(p) {
      if (p === paused) return;
      paused = p;
      if (!ac) return;
      const t = ac.currentTime;
      if (p) {
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.05);
        setTimeout(() => paused && ac?.suspend(), 70);
      } else {
        void ac.resume().then(() => {
          const n = ac!.currentTime;
          master.gain.cancelScheduledValues(n);
          master.gain.setValueAtTime(0, n);
          master.gain.linearRampToValueAtTime(vol(), n + 0.2);
          nextBeat = Math.max(nextBeat, n + 0.05);
        });
      }
    },
    log,
    dispose() {
      clearInterval(sched);
      for (const ev of ['pointerdown', 'touchend', 'keydown'] as const) removeEventListener(ev, gesture, true);
      document.removeEventListener('visibilitychange', onVisible);
      void ac?.close();
    },
  };

  // Unlock on the first gesture anywhere, and keep listening: iOS Safari moves the context to 'interrupted' /
  // 'suspended' on lock screen, app switch or a call, and only a gesture may resume it (review F-002). Any tap or key
  // while not paused brings sound back, in every phase (title, intro, victory, defeat included).
  const gesture = () => {
    if (!ac) void engine.unlock();
    else if (ac.state !== 'running' && ac.state !== 'closed' && !paused) void ac.resume().catch(() => undefined);
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible' && ac && ac.state !== 'running' && ac.state !== 'closed' && !paused) void ac.resume().catch(() => undefined);
  };
  for (const ev of ['pointerdown', 'touchend', 'keydown'] as const) addEventListener(ev, gesture, true);
  document.addEventListener('visibilitychange', onVisible);
  settings.subscribe(() => applyVolume());

  // ───────── event → sound map ─────────
  let coinsSeq = 0;
  bus.on('phase', (e) => {
    if (e.phase === 'title') engine.setMusic('title');
    else if (e.phase === 'intro' && e.prev === 'title') engine.play('uiOpen');
    else if (e.phase === 'fight') {
      enraged = false;
      engine.setMusic('fight');
    } else if (e.phase === 'victory') {
      engine.play('victory');
      engine.setMusic('victory');
      setTimeout(() => music === 'victory' && engine.setMusic('title'), 1800);
    } else if (e.phase === 'defeat') {
      engine.play('defeat');
      engine.setMusic('title');
    }
  });
  bus.on('swing', (e) => engine.play(e.combo === 1 ? 'swing1' : e.combo === 2 ? 'swing2' : 'swing3', { pitch: e.combo === 3 ? 0.9 : 1 }));
  bus.on('hit', (e) => {
    if (e.target === 'hero') return engine.play('heroHurt');
    if (e.attacker !== 'hero') return;
    engine.play(e.crit ? 'crit' : 'hit', { pitch: 0.95 + rnd() * 0.1 });
    if (e.target === 'minion') engine.play('minionHit');
  });
  bus.on('dodge', () => engine.play('dodge'));
  bus.on('perfectDodge', () => engine.play('perfectDodge'));
  bus.on('skill', () => engine.play('skill'));
  bus.on('skillReady', () => engine.play('skillReady'));
  bus.on('footstep', (e) => engine.play(e.who === 'golem' ? 'golemStep' : 'footstep', { pitch: 0.9 + rnd() * 0.2 }));
  bus.on('telegraph', (e) => {
    log.push('golemWindup');
    if (log.length > 64) log.shift();
    telegraph(e.frames);
  });
  bus.on('impact', (e) => {
    telegraphNodes?.stop();
    if (e.attack === 'sweep') engine.play('golemSweep');
    else if (e.attack === 'toss') engine.play('boulderLand');
    else {
      engine.play('golemSlam');
      engine.play('shockwave');
    }
  });
  bus.on('toss', () => engine.play('golemToss'));
  bus.on('wake', () => engine.play('golemWake'));
  bus.on('stagger', (e) => e.target === 'golem' && engine.play('golemStagger'));
  bus.on('enrage', () => {
    enraged = true;
    layer = 'p2';
    engine.play('golemRoar');
  });
  bus.on('spawn', (e) => e.target === 'minion' && engine.play('minionSpawn'));
  bus.on('death', (e) => engine.play(e.target === 'hero' ? 'heroFall' : e.target === 'golem' ? 'golemCrumble' : 'minionHit'));
  bus.on('coins', () => {
    // One log entry; the arrival blips follow the HUD's coin flight (650 ms + 25 ms stagger), +1 semitone per 5 coins.
    engine.play('coin');
    if (!ac || paused) return;
    const seq = ++coinsSeq;
    const t0 = ac.currentTime + 0.65;
    for (let i = 1; i < 40; i++) {
      const p = Math.pow(2, Math.min(12, Math.floor(i / 5)) / 12);
      setTimeout(() => {
        if (seq === coinsSeq && ac && !paused) RECIPES.coin(ac.currentTime, 0.8, p);
      }, (t0 - ac.currentTime + i * 0.025) * 1000);
    }
  });

  return engine;
};
