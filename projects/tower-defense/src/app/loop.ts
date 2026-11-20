// Fixed-timestep accumulator (§11 Speed). Implemented in WO-001; owned by WO-004 afterwards.
// Determinism: the sim is tick-keyed, so the render rate only changes how many steps run per frame.
import { SIM_HZ, type Speed } from '../contracts/types';
import { MAX_STEPS_PER_FRAME } from '../data/feel';

export interface FixedLoop {
  /** Feed real frame time; returns how many sim steps to run now. */
  frame(realDtMs: number, speed: Speed, paused: boolean): number;
  /** Interpolation 0..1 for rendering between the previous and current tick. */
  readonly alpha: number;
  reset(): void;
}

export function createFixedLoop(stepMs = 1000 / SIM_HZ): FixedLoop {
  let acc = 0;
  let alpha = 0;
  return {
    frame(dt, speed, paused) {
      if (paused) return 0;
      acc += Math.min(Math.max(dt, 0), 250) * speed;
      let n = Math.floor(acc / stepMs + 1e-9);
      if (n > MAX_STEPS_PER_FRAME) { n = MAX_STEPS_PER_FRAME; acc = 0; } else acc -= n * stepMs;
      alpha = Math.min(1, acc / stepMs);
      return n;
    },
    get alpha() { return alpha; },
    reset() { acc = 0; alpha = 0; },
  };
}
