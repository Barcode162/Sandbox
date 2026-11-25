// tests/unit/support/script.ts — FROZEN helpers (WO-001): run the pure sim headless from an input script.
import type { Intent, SimEvent, SimState } from '../../../src/contracts.ts';
import { createSim, stepSim } from '../../../src/core/sim.ts';
import { neutralIntent } from '../../../src/core/intent.ts';
import { setPhase } from '../../../src/core/flow.ts';

export type Script = ReadonlyArray<readonly [frames: number, intent: Partial<Intent>]>;

/** A sim already in phase 'fight'. */
export function fightSim(seed = 1): SimState {
  const s = createSim(seed);
  setPhase(s, 'intro');
  setPhase(s, 'fight');
  s.events.length = 0;
  return s;
}

/** Run a script; returns every event emitted. */
export function run(s: SimState, script: Script): SimEvent[] {
  const all: SimEvent[] = [];
  const it = neutralIntent();
  for (const [frames, patch] of script) {
    for (let f = 0; f < frames; f++) {
      Object.assign(it, neutralIntent(), patch);
      stepSim(s, it);
      all.push(...s.events);
    }
  }
  return all;
}

/** Press attack once then wait `gap` frames, `times` times. */
export const mash = (times: number, gap = 8): Script =>
  Array.from({ length: times }, () => [[1, { attack: true }], [gap, {}]] as const).flat();
