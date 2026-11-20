// Shared drivers for the sim tests (not a test file itself).
import type { BotPolicy, SimEvent, SimState, Slot } from '../../../src/contracts';
import { safeSlot } from '../../../src/sim/bots';
import { createSim, hopTicks, step } from '../../../src/sim/sim';

export const MAX_TICKS = 120 * 180;

/** Run a policy until a result (or maxTicks). */
export function run(s: SimState, bot: BotPolicy, maxTicks = MAX_TICKS): SimState {
  while (!s.result && s.tick < maxTicks) step(s, { press: bot(s) });
  return s;
}

/** Step n ticks with no input. */
export function idle(s: SimState, n: number): void {
  for (let i = 0; i < n; i++) step(s, { press: null });
}

/** Step until pred(s) or limit; returns whether pred held. */
export function until(s: SimState, pred: (s: SimState) => boolean, bot: BotPolicy = () => null, limit = MAX_TICKS): boolean {
  while (!pred(s) && !s.result && s.tick < limit) step(s, { press: bot(s) });
  return pred(s);
}

/** Lands every `periodS` seconds (landing to landing) on a safe, unflanked pad. */
export function periodic(periodS: number): BotPolicy {
  return (s) => {
    if (s.result || s.frog.phase !== 'idle') return null;
    const wait = Math.round(periodS * 120) - hopTicks(s);
    return s.frog.landTick < 0 || s.tick + 1 - s.frog.landTick >= wait ? safeSlot(s) : null;
  };
}

/** Takes off `dwellS` seconds after each landing (landing → next press). */
export function dwell(dwellS: number): BotPolicy {
  const w = Math.round(dwellS * 120);
  return (s) => (!s.result && s.frog.phase === 'idle' && s.tick + 1 - Math.max(0, s.frog.landTick) >= w ? safeSlot(s) : null);
}

/** Hop to the first lily pad's slot immediately (fast, safe). */
export const eager: BotPolicy = (s) => (s.frog.phase === 'idle' && !s.result ? safeSlot(s) : null);

export function events<T extends SimEvent['t']>(s: SimState, t: T): Extract<SimEvent, { t: T }>[] {
  return s.log.filter((e): e is Extract<SimEvent, { t: T }> => e.t === t);
}

/** A sim parked on the south bank with a press queued for the next tick. */
export function fresh(seed = 7): SimState {
  return createSim(seed);
}

export function press(s: SimState, slot: Slot | null): void {
  step(s, { press: slot });
}
