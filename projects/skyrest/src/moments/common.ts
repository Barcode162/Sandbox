// src/moments/common.ts — FROZEN (WO-001). Shared constants and helpers for moment scripts.
import type { MomentScript } from '../contracts.ts';

/** Fixed seed every moment starts from. */
export const MOMENT_SEED = 20261125;
/** Spec §11 capture sizes. */
export const MOMENT_VIEWPORTS = {
  portrait: { width: 430, height: 932 },
  desktop: { width: 1280, height: 720 },
  reference: { width: 802, height: 917 },
  landscape: { width: 932, height: 430 },
} as const;

/** Shared helper: from the canonical spawn, walk into range and land combo hit `n` (1..3), stopping `after` steps past it. */
export const comboTo = (n: 1 | 2 | 3, after: number): MomentScript => (api) => {
  api.setSeed(MOMENT_SEED);
  api.skipTitle();
  api.setFlags({ golemPassive: true });
  api.step(100); // golem wakes (scaffold timing; WO-004 tunes)
  let hits = 0;
  for (let i = 0; i < n; i++) {
    api.inject({ attack: true }, 1);
    const ok = api.stepUntil((s) => s.events.some((e) => e.type === 'hit' && e.target === 'golem'), 60);
    if (ok) hits++;
  }
  api.step(after);
  return `combo hits ${hits}/${n}`;
};
