// Web Audio engine (§12): buses, compressor, voice caps, crackle bed, music states — STUB (WO-005). FROZEN signature.
import type { AudioEngine } from '../contracts/types';

export function createAudio(): AudioEngine {
  // TODO(WO-005). Must never throw when AudioContext is unavailable (headless, autoplay-blocked).
  return { unlock() {}, onSimEvent() {}, ui() {}, setMusic() {}, applySettings() {}, setPaused() {}, update() {} };
}
