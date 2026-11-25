// src/audio/index.ts — owned by WO-003. Web Audio synth: every SFX + music state is synthesized here and
// mapped from bus events here (including golem/coin/UI sounds). Unlock on first gesture (iOS).
// Scaffold: silent; logs ids so tests can assert sound fired.
import type { AudioEngine, CreateAudio, SfxId } from '../contracts.ts';

export const createAudio: CreateAudio = (bus, _settings) => {
  const log: SfxId[] = [];
  let unlocked = false;
  const engine: AudioEngine = {
    async unlock() {
      unlocked = true;
    },
    get unlocked() {
      return unlocked;
    },
    play(id) {
      log.push(id);
      if (log.length > 64) log.shift();
    },
    setMusic() {},
    setVolume() {},
    setPaused() {},
    log,
    dispose() {},
  };
  bus.on('swing', (e) => engine.play(e.combo === 1 ? 'swing1' : e.combo === 2 ? 'swing2' : 'swing3'));
  bus.on('hit', (e) => engine.play(e.target === 'hero' ? 'heroHurt' : e.crit ? 'crit' : 'hit'));
  bus.on('dodge', () => engine.play('dodge'));
  bus.on('impact', () => engine.play('golemSlam'));
  bus.on('coins', () => engine.play('coin'));
  return engine;
};
