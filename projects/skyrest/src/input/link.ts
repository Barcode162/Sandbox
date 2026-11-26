// src/input/link.ts — owned by WO-003. The one in-slice channel between input and the camera rig / touch HUD that
// the frozen interfaces don't carry: manual-orbit deltas (input → rig) and the latest frame (rig → touch HUD, for the
// skill cooldown sweep and phase-driven visibility). Plain mutable data, no allocation.
import type { FrameInfo } from '../contracts.ts';

export const LINK = {
  /** Accumulated manual-orbit degrees since the rig last read them (drag on empty screen, right-mouse, RS). */
  orbitDeg: 0,
  /** Degrees/second while Q/E (or the right stick) is held. */
  orbitRate: 0,
  /** performance.now() of the last orbit input (the rig springs back 2 s after). */
  orbitAt: -1e9,
  /** Listeners called once per rendered frame by the rig (after it has placed the camera). */
  frameListeners: [] as ((f: FrameInfo) => void)[],
};
