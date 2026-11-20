/**
 * Web Audio engine, all synthesized (§8). OWNER: WO-004.
 * STUB (WO-001): silent. The AudioContext must only be created/resumed inside unlock() (first gesture).
 */
import type { AudioEngine } from '../contracts';

export function createAudio(): AudioEngine {
  return {
    unlock() {},
    frame() {},
    setMuted() {},
    duck() {},
  };
}
