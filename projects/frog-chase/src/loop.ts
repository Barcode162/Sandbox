/**
 * Fixed-timestep loop (§4.7). Implemented in WO-001; owner after wave 0: WO-002.
 * The sim runs in whole ticks of 1/TICK_HZ s; rendering gets alpha in [0,1) for interpolation.
 * 30, 60 and 144 Hz frame streams yield exactly TICK_HZ ticks per second (tests/unit/core/loop.test.ts).
 */
import { TICK_HZ } from './tuning';

export interface LoopHandlers {
  /** Run exactly one sim tick. */
  tick(): void;
  /** Draw; alpha = fraction of the next tick already elapsed. */
  render(alpha: number, frameDtMs: number): void;
}

export interface Loop {
  /** Advance by one render frame of dtMs. Returns how many ticks ran. */
  advance(dtMs: number): number;
  /** Drop accumulated time (after pause / tab hidden) so the sim never jumps. */
  reset(): void;
  /** When false, ticks are skipped (pause) but render still runs. */
  running: boolean;
}

/** maxTicksPerFrame caps catch-up (spiral of death); 30 = 250 ms of sim per frame. */
export function createLoop(h: LoopHandlers, maxTicksPerFrame = 30): Loop {
  // Accumulator in ms. EPS absorbs float error so 1000/30 ms frames yield exactly 4 ticks each.
  const TICK_MS = 1000 / TICK_HZ;
  const EPS = 1e-6;
  let acc = 0;
  const loop: Loop = {
    running: true,
    advance(dtMs: number): number {
      let n = 0;
      if (loop.running) {
        acc += Math.max(0, dtMs);
        while (acc >= TICK_MS - EPS && n < maxTicksPerFrame) {
          acc = Math.max(0, acc - TICK_MS);
          h.tick();
          n++;
        }
        if (acc >= TICK_MS - EPS) acc = 0; // stalled: drop the backlog instead of spiralling
      }
      h.render(loop.running ? Math.min(acc / TICK_MS, 0.999999) : 0, dtMs);
      return n;
    },
    reset() {
      acc = 0;
    },
  };
  return loop;
}
