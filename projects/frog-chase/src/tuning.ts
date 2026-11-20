/**
 * Tunables (§4.3, §4.4, §4.1) and the tick clock. Owner after wave 0: WO-002.
 * The keys and their meaning are frozen (src/contracts.ts Tuning); values may be tuned by WO-002.
 */
import type { Tuning } from './contracts';

/** Fixed simulation rate (§14.1 decision: 120 Hz). */
export const TICK_HZ = 120;
/** Seconds per tick. The gator gap decrements by exactly this each tick. */
export const DT = 1 / TICK_HZ;

/** ms → whole ticks, round-half-up. 60→7, 200→24 (landing at tick 31 = 258 ms), 150→18, 40→5, 250→30. */
export function ticks(ms: number): number {
  return Math.floor((ms * TICK_HZ) / 1000 + 0.5);
}

/** ticks → ms (for the timer and for display). */
export function ticksToMs(n: number): number {
  return (n * 1000) / TICK_HZ;
}

export const TUNING: Readonly<Tuning> = Object.freeze({
  g0: 3.0,
  gMax: 3.5,
  gainBase: 0.75,
  gainRubber: 0.6,
  flankG: 1.4,
  flankFromLayer: 12,
  flankEvery: 4,
  flankTelegraphMs: 250,
  nearMissG: 0.35,
  hookLayer: 3,
  tauSpan: 2.5,
  squashMs: 60,
  airMs: 200,
  settleMs: 120,
  bufferMs: 150,
  retargetMs: 40,
  soggyEscapeMs: 220,
  soggySinkMs: 380,
  curlTiltMs: 120,
  curlFlipMs: 220,
  lungeMs: 140,
  headOmega: 9,
  bodySegments: 9,
  bodySpacing: 5.5,
  layers: 36,
  pitch: 26,
  width: 100,
});

export function makeTuning(patch?: Partial<Tuning>): Tuning {
  return { ...TUNING, ...(patch ?? {}) };
}
