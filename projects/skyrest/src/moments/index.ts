// src/moments/index.ts — FROZEN (WO-001). Merges each slice's frame-table scripts (experience.md §11).
// Ownership: world.ts = WO-002 (F2, F12, F13) · hero.ts = WO-003 (F3, F4, F6) · loop.ts = WO-004 (F1, F5, F7–F11).
import type { MomentId, MomentScript } from '../contracts.ts';
import { WORLD_MOMENTS } from './world.ts';
import { HERO_MOMENTS } from './hero.ts';
import { LOOP_MOMENTS } from './loop.ts';
export { MOMENT_SEED, MOMENT_VIEWPORTS, comboTo } from './common.ts';

export const MOMENT_IDS: readonly MomentId[] = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13'];
export const MOMENTS: Partial<Record<MomentId, MomentScript>> = { ...WORLD_MOMENTS, ...HERO_MOMENTS, ...LOOP_MOMENTS };
