/** Colour mixing done once at load (never per frame). */
import { PALETTE } from './palette';

const parse = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mix two #rrggbb colours, t in 0..1, returning #rrggbb. */
export function mix(a: string, b: string, t: number): string {
  const A = parse(a), B = parse(b);
  const c = (i: number) => Math.round(A[i]! + (B[i]! - A[i]!) * t).toString(16).padStart(2, '0');
  return `#${c(0)}${c(1)}${c(2)}`;
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Rec. 709 luma of a palette colour, 0..255 (used by the grayscale test design and tests). */
export function luma(hex: string): number {
  const [r, g, b] = parse(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** A ramp of n+1 colours from a to b. */
export function ramp(a: string, b: string, n: number): string[] {
  return Array.from({ length: n + 1 }, (_, i) => mix(a, b, i / n));
}

/**
 * Pad fills by "light level": index 0 = lit (reachable: brightest objects on screen, §5.2),
 * 1 = normal, 2..4 = dimmer (behind the frog / far ahead). Dimming leans toward deep water, not black.
 */
const LEVELS = [-0.08, 0, 0.12, 0.22, 0.32];
const lift = (hex: string) => LEVELS.map((l) => (l < 0 ? mix(hex, PALETTE.paper, -l) : mix(hex, PALETTE.waterDeep, l)));
export const PAD_FILL = lift(PALETTE.pad);
export const PAD_LOW_FILL = lift(PALETTE.padLow);
export const PAD_VEIN = lift(PALETTE.padVein);
export const PAD_UNDER = lift(PALETTE.padUnder);
/** Sink ramp (soggy going under): pad-low → water-deep, 10 steps. */
export const SINK_RAMP = ramp(PALETTE.padLow, PALETTE.waterDeep, 10);
export const FROG_SINK = ramp(PALETTE.frog, PALETTE.waterDeep, 10);
export const FROG_DARK_SINK = ramp(PALETTE.frogDark, PALETTE.waterDeep, 10);
export const GATOR_RISE = ramp(PALETTE.waterDeep, PALETTE.gator, 10);
export const LOG_FILL = mix(PALETTE.bank, PALETTE.ink, 0.42);
export const LOG_END = mix(PALETTE.bank, PALETTE.ink, 0.25);
export const PEBBLE = [mix(PALETTE.bank, PALETTE.ink, 0.18), mix(PALETTE.bank, PALETTE.paper, 0.35), mix(PALETTE.bank, PALETTE.ink, 0.3)];
export const SAND_LINE = mix(PALETTE.bank, PALETTE.ink, 0.12);
export const REED_DARK = mix(PALETTE.reed, PALETTE.ink, 0.25);
export const SHADOW = rgba(PALETTE.ink, 0.38);
