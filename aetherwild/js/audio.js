'use strict';
// ============================================================================
//  AETHERWILD — tiny procedural sound engine (WebAudio, no assets)
// ============================================================================
(function () {
  const G = window.G;
  const A = G.Audio = {
    ctx: null, vol: 0.5,
    start() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2; const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      // ambient wind bed
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
      const g = this.ctx.createGain(); g.gain.value = 0.035; src.connect(f); f.connect(g); g.connect(this.master); src.start();
      this.wind = g;
    },
    env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
    noiseHit(freq, q, dur, peak, type, at) {
      const c = this.ctx, t = c.currentTime + (at || 0);
      const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 0.8 + Math.random() * 0.4;
      const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); this.env(g, t, 0.004, dur, peak);
      s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    },
    tone(f0, f1, dur, peak, type, at) {
      const c = this.ctx, t = c.currentTime + (at || 0);
      const o = c.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      const g = c.createGain(); this.env(g, t, 0.01, dur, peak);
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.05);
    },
    play(name, pos, scale) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      let vol = 1;
      if (pos) { const d = Math.sqrt(G.dist2(pos.x, pos.z, G.camPos.x, G.camPos.z)); vol = G.clamp(1 - d / 60, 0, 1); if (vol <= 0.01) return; }
      const g = this.ctx.createGain(); g.gain.value = vol; g.connect(this.master); this.out = g;
      const sc = scale || 1;
      switch (name) {
        case 'chop': this.noiseHit(900, 1.2, 0.12, 0.6); this.tone(180, 90, 0.1, 0.25, 'triangle'); break;
        case 'mine': this.noiseHit(2600, 3, 0.08, 0.4); this.tone(900, 600, 0.12, 0.12, 'square'); break;
        case 'rustle': this.noiseHit(3000, 0.6, 0.18, 0.25, 'highpass'); break;
        case 'hit': this.noiseHit(600, 1, 0.1, 0.5); this.tone(160, 70, 0.12, 0.3, 'sawtooth'); break;
        case 'swish': this.noiseHit(1800, 0.8, 0.12, 0.12); break;
        case 'clank': this.tone(420, 380, 0.15, 0.15, 'square'); break;
        case 'step': this.noiseHit(400 + Math.random() * 200, 1.5, 0.06, 0.06, 'lowpass'); break;
        case 'stomp': this.tone(70 / sc + 30, 30, 0.25, 0.35, 'sine'); this.noiseHit(200, 1, 0.15, 0.2, 'lowpass'); break;
        case 'build': this.tone(220, 330, 0.1, 0.2, 'triangle'); this.tone(330, 440, 0.12, 0.15, 'triangle', 0.08); this.noiseHit(700, 1, 0.08, 0.25); break;
        case 'break': this.noiseHit(500, 0.5, 0.4, 0.6, 'lowpass'); this.tone(120, 40, 0.4, 0.3, 'sawtooth'); break;
        case 'door': this.tone(160, 120, 0.2, 0.2, 'triangle'); this.noiseHit(500, 2, 0.15, 0.1); break;
        case 'eat': for (let i = 0; i < 3; i++) this.noiseHit(1200, 2, 0.05, 0.25, 'bandpass', i * 0.09); break;
        case 'drink': for (let i = 0; i < 3; i++) this.tone(500 + i * 120, 300, 0.08, 0.15, 'sine', i * 0.1); break;
        case 'hurt': this.tone(300, 120, 0.25, 0.3, 'sawtooth'); break;
        case 'tame': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, f, 0.25, 0.18, 'triangle', i * 0.09)); break;
        case 'ko': this.tone(400, 80, 0.6, 0.25, 'sine'); break;
        case 'craft': this.tone(660, 880, 0.1, 0.15, 'triangle'); this.noiseHit(3000, 2, 0.05, 0.1); break;
        case 'chirp': this.tone(1800, 2600, 0.08, 0.12, 'sine'); this.tone(2000, 2900, 0.08, 0.1, 'sine', 0.1); break;
        case 'bite': this.noiseHit(400 / sc + 200, 1, 0.15, 0.5); this.tone(200 / sc + 40, 60, 0.15, 0.3, 'sawtooth'); break;
        case 'roar': {
          const base = 180 / sc + 40;
          this.tone(base * 1.6, base * 0.6, 0.9, 0.35, 'sawtooth'); this.tone(base * 1.2, base * 0.5, 0.9, 0.25, 'square'); this.noiseHit(base * 3, 0.7, 0.8, 0.3, 'lowpass'); break;
        }
        case 'ui': this.tone(880, 880, 0.04, 0.08, 'triangle'); break;
      }
    },
    update() {
      if (this.wind) this.wind.gain.value = 0.02 + 0.03 * G.clamp((G.camPos.y - 10) / 30, 0, 1);
    },
  };

  // ------------------------------------------------------------------ save/load
  const KEY = 'aetherwild_save_v1';
  G.hasSave = function () { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
  G.save = function (quiet) {
    if (!G.started || G.Player.dead) return;
    const data = {
      v: 1, tod: G.World.tod, player: G.Player.serialize(), inv: G.inv.toJSON(), stats: G.stats,
      build: G.Build.serialize(), tames: G.Creatures.serialize(),
    };
    try { localStorage.setItem(KEY, JSON.stringify(data)); if (!quiet) G.UI.toast('Game saved', null, 'good'); }
    catch (e) { if (!quiet) G.UI.toast('Could not save (storage blocked)', null, 'warn'); }
  };
  G.loadSave = function () {
    let data; try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { return false; }
    if (!data) return false;
    G.World.tod = data.tod; G.Player.load(data.player); G.inv.load(data.inv);
    G.stats = Object.assign(G.newStats(), data.stats);
    G.Build.load(data.build); G.Creatures.load(data.tames);
    return true;
  };
  G.wipeSave = function () { try { localStorage.removeItem(KEY); } catch (e) { } };
})();
