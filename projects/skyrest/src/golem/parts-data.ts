// src/golem/parts-data.ts — owned by WO-004. The Stone Guardian's 14 boulders (experience.md §4.5): rest layout,
// sizes, rune faces, moss, assembly order. Pure data (the pose module and tests read it without three).

export type RuneGlyph = 'chevron' | 'ring' | 'bars' | 'crack' | 'eye';

export interface PartSpec {
  name: string;
  /** Rest position in golem-local space (+z = forward, y up, metres). */
  rest: [number, number, number];
  /** Half extents. */
  size: [number, number, number];
  /** 0 = boulder, 1 = rounded box (head). */
  boxy: number;
  seed: number;
  /** Flattened face for a rune: direction (part-local) + glyph + plane size. */
  rune?: { dir: [number, number, number]; glyph: RuneGlyph; size: number; group: RuneGroup };
  /** Fraction of the top surface that is moss (0..1). */
  moss: number;
  /** Order in the assembly (0 = first, feet) and in rune ignition. */
  order: number;
  /** Which bones it follows. */
  role: 'pelvis' | 'torso' | 'head' | 'shoulder' | 'arm' | 'fist' | 'thigh' | 'foot' | 'back';
  side: -1 | 0 | 1;
}
export type RuneGroup = 'chest' | 'fistL' | 'fistR' | 'shoulders' | 'crack';

// Golem-local +x is the golem's LEFT hand (it faces +z); side +1 = left, -1 = right.
export const PARTS: PartSpec[] = [
  { name: 'footL', rest: [0.54, 0.27, 0.12], size: [0.46, 0.3, 0.54], boxy: 0.3, seed: 11, moss: 0.15, order: 0, role: 'foot', side: 1 },
  { name: 'footR', rest: [-0.54, 0.27, 0.12], size: [0.46, 0.3, 0.54], boxy: 0.3, seed: 12, moss: 0.15, order: 1, role: 'foot', side: -1 },
  { name: 'thighL', rest: [0.5, 0.74, 0], size: [0.44, 0.42, 0.42], boxy: 0, seed: 13, moss: 0.2, order: 2, role: 'thigh', side: 1 },
  { name: 'thighR', rest: [-0.5, 0.74, 0], size: [0.44, 0.42, 0.42], boxy: 0, seed: 14, moss: 0.2, order: 3, role: 'thigh', side: -1 },
  { name: 'pelvis', rest: [0, 1.12, 0], size: [0.72, 0.44, 0.54], boxy: 0.2, seed: 15, moss: 0.25, order: 4, role: 'pelvis', side: 0 },
  {
    name: 'torso', rest: [0, 1.92, 0], size: [0.92, 0.74, 0.64], boxy: 0.25, seed: 16, moss: 0.4, order: 5, role: 'torso', side: 0,
    rune: { dir: [0, 0.05, 1], glyph: 'chevron', size: 0.7, group: 'chest' },
  },
  { name: 'back', rest: [0, 2.3, -0.6], size: [0.48, 0.44, 0.4], boxy: 0, seed: 17, moss: 0.55, order: 6, role: 'back', side: 0 },
  { name: 'armL', rest: [1.4, 1.76, 0.05], size: [0.42, 0.48, 0.42], boxy: 0, seed: 18, moss: 0.2, order: 7, role: 'arm', side: 1 },
  { name: 'armR', rest: [-1.4, 1.76, 0.05], size: [0.42, 0.48, 0.42], boxy: 0, seed: 19, moss: 0.2, order: 8, role: 'arm', side: -1 },
  {
    name: 'fistL', rest: [1.9, 0.92, 0.22], size: [0.66, 0.68, 0.62], boxy: 0.15, seed: 20, moss: 0.3, order: 9, role: 'fist', side: 1,
    rune: { dir: [0.35, 0.05, 1], glyph: 'ring', size: 0.54, group: 'fistL' },
  },
  {
    name: 'fistR', rest: [-1.9, 0.92, 0.22], size: [0.66, 0.68, 0.62], boxy: 0.15, seed: 21, moss: 0.3, order: 10, role: 'fist', side: -1,
    rune: { dir: [-0.35, 0.05, 1], glyph: 'ring', size: 0.54, group: 'fistR' },
  },
  {
    name: 'shoulderL', rest: [1.08, 2.42, 0], size: [0.62, 0.54, 0.58], boxy: 0.1, seed: 22, moss: 0.65, order: 11, role: 'shoulder', side: 1,
    rune: { dir: [0.55, 0.1, 0.85], glyph: 'bars', size: 0.34, group: 'shoulders' },
  },
  {
    name: 'shoulderR', rest: [-1.08, 2.42, 0], size: [0.62, 0.54, 0.58], boxy: 0.1, seed: 23, moss: 0.65, order: 12, role: 'shoulder', side: -1,
    rune: { dir: [-0.55, 0.1, 0.85], glyph: 'bars', size: 0.34, group: 'shoulders' },
  },
  { name: 'head', rest: [0, 3.0, 0.1], size: [0.46, 0.38, 0.38], boxy: 0.85, seed: 24, moss: 0.5, order: 13, role: 'head', side: 0 },
];

