// src/core/flow.ts — owned by WO-004. Phase machine: title → intro → fight → victory | defeat → (retry) intro.
// FROZEN signatures: stepFlow, INTRO_FRAMES, RETRY_MIN_FRAMES.
// Timeline (experience.md §3/§8): the first intro is the title fade + camera glide (1 s), then control while the
// Guardian assembles; a retry / next wave is a 300 ms veil + a 1.2 s reform, the hero back in control at 1.0 s.
import type { Intent, Phase, SimState } from '../contracts.ts';
import { resetWave } from './sim.ts';

/** Steps from leaving the title (or pressing retry / next wave) to control. */
export const INTRO_FRAMES = 60;
/** Victory/defeat cards accept a press after this many steps (750 ms; the brief: retry in < 2 s). */
export const RETRY_MIN_FRAMES = 45;
/** Killing blow → SKY CLEARED card (sim steps; with the slow-mo this is ≈ 1.2 s on the wall clock). */
export const VICTORY_DELAY_FRAMES = 40;
/** Hero down → FALLEN card (600 ms knee drop + a beat). */
export const DEFEAT_DELAY_FRAMES = 70;

export function setPhase(s: SimState, phase: Phase): void {
  if (s.phase === phase) return;
  s.events.push({ type: 'phase', phase, prev: s.phase });
  s.phase = phase;
  s.phaseFrame = 0;
}

/** Start the next attempt now: next wave after a victory, the same wave otherwise. Coins are kept. */
export function restartWave(s: SimState): void {
  if (s.phase === 'victory') s.wave++;
  resetWave(s);
  s.golem.ext.reform = 1;
  setPhase(s, 'intro');
}

export function stepFlow(s: SimState, intent: Readonly<Intent>): void {
  switch (s.phase) {
    case 'title':
      if (intent.confirm || intent.attack) setPhase(s, 'intro');
      break;
    case 'intro':
      if (s.phaseFrame >= INTRO_FRAMES) setPhase(s, 'fight');
      break;
    case 'fight': {
      const g = s.golem;
      if (g.action === 'dead' || (g.action === 'dying' && g.actionFrame >= VICTORY_DELAY_FRAMES)) setPhase(s, 'victory');
      else if (s.hero.action === 'dead' && s.hero.actionFrame >= DEFEAT_DELAY_FRAMES) setPhase(s, 'defeat');
      break;
    }
    case 'victory':
    case 'defeat':
      if (s.phaseFrame >= RETRY_MIN_FRAMES && intent.confirm) restartWave(s);
      break;
  }
}
