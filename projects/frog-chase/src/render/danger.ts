/**
 * The danger signals driven by τ (§4.3), as pure functions so tests can pin them.
 * Eye scale 1 + 0.5τ; jaw angle 28°·smooth(r(τ, 0.4, 1)); vignette alpha 0.35τ pulsing on the heartbeat.
 */
import { remap, smooth } from './ease';

export const eyeScale = (tau: number): number => 1 + 0.5 * tau;
export const jawRad = (tau: number): number => ((28 * Math.PI) / 180) * smooth(remap(tau, 0.4, 1));

/**
 * Vignette alpha for threat τ at heartbeat phase `hb` (0..1, from sim `heartbeatPhase`, polish 14).
 * 0.45τ, floored at 0.10 once τ > 0.3 so it reads on a phone (F-011). The double thump is lub at the wrap
 * (phase 0, full alpha) and dub 120 ms later; between beats it rests at 72%. Everything comes from the
 * current sim, so a fresh run (τ = 0) shows none.
 */
export function vignetteAlpha(tau: number, hb: number): number {
  if (tau <= 0) return 0;
  const bpm = 60 + 80 * tau;
  const gap = (0.12 * bpm) / 60;
  const lub = Math.exp(-hb * 9);
  const dub = hb > gap ? 0.75 * Math.exp(-(hb - gap) * 9) : 0;
  const peak = Math.max(0.45 * tau, tau > 0.3 ? 0.1 : 0);
  return peak * (0.72 + 0.28 * Math.max(lub, dub));
}

/**
 * The 6 px jaw band on the bottom edge: solid at the lub (one flash per beat, ≤ 2.3 per second at
 * 140 bpm, inside §10's 3 per second), fading in with τ from 0.3 to 0.7.
 */
export function bottomBandAlpha(tau: number, hb: number): number {
  const k = Math.min(1, Math.max(0, (tau - 0.3) / 0.4));
  return k * Math.exp(-hb * 12);
}
