/**
 * The visual juice table (§6, SC3 juice audit). One row per SimEventType: the typecheck fails if an
 * event type is added without a visual answer. The renderer reads the generic fields (hit-stop, shake)
 * from here and dispatches the bespoke effects by `fx`.
 */
import type { SimEventType } from '../contracts';

export type VisualFx =
  | 'timerShows'
  | 'chipInvert'
  | 'chipMove'
  | 'landSplash'
  | 'escapeJolt'
  | 'bubbleBurst'
  | 'curlTilt'
  | 'curlFlip'
  | 'gatorSurface'
  | 'flankEyesRise'
  | 'flankJaws'
  | 'flankSink'
  | 'jawClack'
  | 'chomp'
  | 'splashCrown'
  | 'bloomBurst';

export interface VisualCue {
  fx: VisualFx;
  /** Render-only freeze (the sim keeps running, §6). Applied when the cue's moment arrives. */
  hitStopMs: number;
  /** Peak shake in CSS px (always < 8, §6) and its exponential decay time. 0 under reduced motion. */
  shakePx: number;
  shakeMs: number;
  /** What the player sees, for the juice audit. */
  note: string;
}

export const VISUAL_CUES: Record<SimEventType, VisualCue> = {
  timerStart: { fx: 'timerShows', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'HUD timer appears at 0.00; wordmark lifts away' },
  hop: { fx: 'chipInvert', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Squash on the same frame; pressed chip inverts for 80 ms; other chips drop' },
  retarget: { fx: 'chipMove', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Inverted chip jumps to the new target; body re-faces' },
  land: { fx: 'landSplash', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Pad dips 6%, 2 ripple rings, 6 droplets that land on water' },
  escape: { fx: 'escapeJolt', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: '3 px upward jolt on takeoff, ring of bubbles left behind' },
  sinkStart: { fx: 'bubbleBurst', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: '10 bubble particles burst at the soggy rim; pad starts going under' },
  tilt: { fx: 'curlTilt', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Curl lifts its fold edge 25°; frog slides toward it' },
  flip: { fx: 'curlFlip', hitStopMs: 0, shakePx: 1.5, shakeMs: 120, note: 'Pad flips to its pale underside; frog flung 10 wu outward' },
  hook: { fx: 'gatorSurface', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Splash behind, two eye domes rise and blink' },
  flankStart: { fx: 'flankEyesRise', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Eyes rise beside the pad over 250 ms (pop ease)' },
  flankArmed: { fx: 'flankJaws', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Chip morphs to an ink ✕, open jaws frame the pad' },
  flankClear: { fx: 'flankSink', hitStopMs: 0, shakePx: 0, shakeMs: 0, note: 'Flank eyes sink with a blow of bubbles' },
  nearMiss: { fx: 'jawClack', hitStopMs: 60, shakePx: 3, shakeMs: 150, note: 'Jaws snap shut 0.3P behind; 60 ms freeze; tooth tips flash one frame' },
  eaten: { fx: 'chomp', hitStopMs: 90, shakePx: 8, shakeMs: 300, note: '90 ms freeze, 140 ms lunge, jaws close over the frog, 12 droplets' },
  sunk: { fx: 'splashCrown', hitStopMs: 0, shakePx: 2, shakeMs: 150, note: 'Splash crown: 14 particles, 2 rings, silhouette sinks to water-deep' },
  win: { fx: 'bloomBurst', hitStopMs: 120, shakePx: 0, shakeMs: 0, note: '120 ms freeze, 24 bloom petals, gator sinks, route trace, zoom out' },
};

/** Hit-stop and shake for one event, honouring reduced motion (§6: shake off, hit-stops stay). */
export function cueImpulse(type: SimEventType, reducedMotion: boolean): { hitStopMs: number; shakePx: number; shakeMs: number } {
  const c = VISUAL_CUES[type];
  return { hitStopMs: c.hitStopMs, shakePx: reducedMotion ? 0 : Math.min(c.shakePx, 7.99), shakeMs: c.shakeMs };
}
