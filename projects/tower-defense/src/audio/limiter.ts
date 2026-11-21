// Voice limiting for §12 / §10.5: at most `max` voices in any sliding `windowMs` window.
// Pure and allocation-free after construction (a ring of admit timestamps), so it is unit-testable in Node.

export interface VoiceLimiter {
  /** True if a voice may start at `nowMs`; false means the caller drops it (and may count it as an extra). */
  admit(nowMs: number): boolean;
  /** Voices admitted inside the window ending at `nowMs`. */
  active(nowMs: number): number;
  reset(): void;
}

export function createVoiceLimiter(max: number, windowMs: number): VoiceLimiter {
  const ring = new Float64Array(Math.max(1, max));
  let head = 0; // index of the oldest admitted timestamp once the ring is full
  let filled = 0;
  return {
    admit(now) {
      if (filled < max) { ring[(head + filled) % max] = now; filled++; return true; }
      if (now - ring[head] >= windowMs) { ring[head] = now; head = (head + 1) % max; return true; }
      return false;
    },
    active(now) {
      let n = 0;
      for (let i = 0; i < filled; i++) if (now - ring[(head + i) % max] < windowMs) n++;
      return n;
    },
    reset() { head = 0; filled = 0; },
  };
}

/**
 * §12 crackle bed: pops refused by the limiter accumulate for one window, then flush as a single
 * burst whose gain grows with log2(extra + 1).
 */
export interface CrackleBed {
  /** A pop was refused at `nowMs`. */
  add(nowMs: number): void;
  /** If the open window has elapsed by `nowMs`, returns its extra count and closes it; otherwise 0. */
  flush(nowMs: number): number;
  readonly pending: number;
}

export function createCrackleBed(windowMs: number): CrackleBed {
  let openedAt = -1;
  let extras = 0;
  return {
    add(now) { if (openedAt < 0) openedAt = now; extras++; },
    flush(now) {
      if (openedAt < 0 || now - openedAt < windowMs) return 0;
      const n = extras;
      openedAt = -1;
      extras = 0;
      return n;
    },
    get pending() { return extras; },
  };
}

/** Minimum spacing between repeats of one cue (leak: 1 per 100 ms; UI/sim double triggers). */
export interface RateGate { pass(key: string, nowMs: number, minGapMs: number): boolean; reset(): void }

export function createRateGate(): RateGate {
  const last = new Map<string, number>();
  return {
    pass(key, now, gap) {
      const t = last.get(key);
      if (t !== undefined && now - t < gap && now >= t) return false;
      last.set(key, now);
      return true;
    },
    reset() { last.clear(); },
  };
}
