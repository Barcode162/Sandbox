// Web Audio engine (§12): buses, compressor, voice caps, crackle bed, ducking, music states. FROZEN signature.
// The context is created on the first unlock() (autoplay policy). Without Web Audio every call is a no-op.
import type { AudioEngine } from '../contracts/types';
import { createAudioEngine } from './engine';

export { createAudioEngine } from './engine';
export type { AudioDebug, AudioEngineOptions, FullAudioEngine } from './engine';

type Ctor = new (opts?: AudioContextOptions) => AudioContext;

function liveContext(): AudioContext | null {
  try {
    const g = globalThis as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
    const C = g.AudioContext ?? g.webkitAudioContext;
    return C ? new C({ latencyHint: 'interactive' }) : null;
  } catch {
    return null;
  }
}

export function createAudio(): AudioEngine {
  return createAudioEngine({ createContext: liveContext });
}
