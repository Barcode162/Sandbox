// src/core/flow.ts — owned by WO-004. Phase machine: title → intro → fight → victory | defeat → (retry) intro.
// FROZEN signatures: stepFlow, INTRO_FRAMES, RETRY_MIN_FRAMES.
import type { Intent, Phase, SimState } from '../contracts.ts';
import { resetWave } from './sim.ts';

export const INTRO_FRAMES = 60;
/** Victory/defeat screens accept retry after this many steps (brief: retry in < 2 s). */
export const RETRY_MIN_FRAMES = 45;
const END_DELAY_FRAMES = 90;

export function setPhase(s: SimState, phase: Phase): void {
  if (s.phase === phase) return;
  s.events.push({ type: 'phase', phase, prev: s.phase });
  s.phase = phase;
  s.phaseFrame = 0;
}

export function stepFlow(s: SimState, intent: Readonly<Intent>): void {
  switch (s.phase) {
    case 'title':
      if (intent.confirm || intent.attack) setPhase(s, 'intro');
      break;
    case 'intro':
      if (s.phaseFrame >= INTRO_FRAMES) setPhase(s, 'fight');
      break;
    case 'fight':
      if (s.golem.action === 'dead' || (s.golem.action === 'dying' && s.golem.actionFrame >= END_DELAY_FRAMES)) setPhase(s, 'victory');
      else if (s.hero.action === 'dead' && s.hero.actionFrame >= END_DELAY_FRAMES) setPhase(s, 'defeat');
      break;
    case 'victory':
    case 'defeat':
      if (s.phaseFrame >= RETRY_MIN_FRAMES && intent.confirm) {
        if (s.phase === 'victory') s.wave++;
        resetWave(s);
        setPhase(s, 'intro');
      }
      break;
  }
}
