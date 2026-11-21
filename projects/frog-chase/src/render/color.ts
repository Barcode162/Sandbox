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
 * Pad fills by dim step 0..10 (F-008, §5.2 "reachable pads are the brightest objects"). Step 0 is full
 * value (reachable, occupied). Step d/10 lowers value by 28% and saturation by 30% at full dim: step 7
 * (pads ahead) is ≈80% value, 20% less saturated; step 10 is behind the frog. Hue is untouched.
 */
export const DIM_STEPS = 10;
function dimmed(hex: string, d: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const l = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  const v = 1 - 0.28 * d, s = 0.3 * d;
  const out = c.map((x) => Math.round(Math.max(0, Math.min(255, (x + (l - x) * s) * v))).toString(16).padStart(2, '0'));
  return `#${out.join('')}`;
}
const dimRamp = (hex: string) => Array.from({ length: DIM_STEPS + 1 }, (_, i) => dimmed(hex, i / DIM_STEPS));
export const PAD_FILL = dimRamp(PALETTE.pad);
export const PAD_LOW_FILL = dimRamp(PALETTE.padLow);
export const PAD_VEIN = dimRamp(PALETTE.padVein);
export const PAD_UNDER = dimRamp(PALETTE.padUnder);
/** Dim targets: pads ahead of the next layer, and pads behind the frog. */
export const DIM_AHEAD = 7;
export const DIM_BEHIND = 10;
/** Reachable pads: a 2 px paper rim at 40% (F-008). */
export const LIT_RIM = 'rgba(243,235,216,0.4)';

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
