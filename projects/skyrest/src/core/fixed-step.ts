// src/core/fixed-step.ts — FROZEN (WO-001). Fixed 60 Hz accumulator decoupled from render rate.
// Behaviour is identical at 30 and 144 render Hz (tests/unit/fixed-step.test.ts).

export const STEP_HZ = 60;
export const STEP_S = 1 / STEP_HZ;
/** Never simulate more than this many steps per rendered frame (spiral-of-death guard: 0.25 s). */
export const MAX_STEPS_PER_FRAME = 15;

export interface FixedStepper {
  /** Feed real elapsed seconds; calls step() 0..MAX times; returns the interpolation alpha in [0, 1). */
  advance(dtSeconds: number, step: () => void): number;
  reset(): void;
  readonly accumulator: number;
}

export function createFixedStepper(): FixedStepper {
  let acc = 0;
  return {
    advance(dt, step) {
      acc += Math.max(0, dt);
      let n = 0;
      while (acc >= STEP_S && n < MAX_STEPS_PER_FRAME) {
        step();
        acc -= STEP_S;
        n++;
      }
      if (n === MAX_STEPS_PER_FRAME && acc >= STEP_S) acc = 0; // drop the backlog rather than spiral
      return acc / STEP_S;
    },
    reset() {
      acc = 0;
    },
    get accumulator() {
      return acc;
    },
  };
}
