// §12 mix: bus levels, compressor, per-cue peak gains, ducking priority, settings → bus gains.
// Pure numbers so the gain staging is unit-testable without an AudioContext.
import type { Settings } from '../contracts/types';
import { DEFAULT_SETTINGS } from '../app/settings';

export const dbToGain = (db: number): number => 10 ** (db / 20);
export const gainToDb = (g: number): number => (g <= 0 ? -Infinity : 20 * Math.log10(g));

/** §12: music bus −14 dB and sfx bus −6 dB at the default slider positions. */
export const BUS_DB = { music: -14, sfx: -6 } as const;
/** §12: master compressor threshold −18, ratio 4. */
export const COMPRESSOR = { threshold: -18, ratio: 4, knee: 6, attack: 0.002, release: 0.15 } as const;
/** Final safety stage after the compressor: a fast high-ratio limiter so the master never clips (§16.19). */
export const LIMITER = { threshold: -4, ratio: 20, knee: 0, attack: 0.001, release: 0.08 } as const;
/** Master trim before the safety limiter. */
export const MASTER_GAIN = 0.8;

/**
 * Slider (0..100) → linear bus gain. The default position gives the §12 bus level; the curve is
 * square-law in amplitude (≈ 40·log10 dB), so 0 is silence and 100 is a few dB above default.
 */
export function busGain(level: number, defaultLevel: number, defaultDb: number): number {
  const v = Math.min(100, Math.max(0, Number.isFinite(level) ? level : defaultLevel));
  if (v <= 0) return 0;
  return dbToGain(defaultDb) * (v / defaultLevel) ** 2;
}

export interface BusGains { music: number; sfx: number; master: number }
export function settingsToGains(s: Readonly<Settings>): BusGains {
  return {
    music: busGain(s.music, DEFAULT_SETTINGS.music, BUS_DB.music),
    sfx: busGain(s.sfx, DEFAULT_SETTINGS.sfx, BUS_DB.sfx),
    master: s.muted ? 0 : MASTER_GAIN,
  };
}

/** Ducking priority (§12): leak/boss > UI > tower fire > pops. Index = rank (0 highest). */
export type Category = 'alert' | 'ui' | 'fire' | 'pop';
export const CATEGORIES: readonly Category[] = ['alert', 'ui', 'fire', 'pop'];

/** When a cue of category K plays, each lower category dips by `db` for `ms`. Deeper for higher rank. */
export const DUCK: Readonly<Record<Category, { readonly db: Partial<Record<Category, number>>; readonly ms: number }>> = {
  alert: { db: { ui: -3, fire: -6, pop: -8 }, ms: 320 },
  ui: { db: { fire: -3, pop: -4 }, ms: 150 },
  fire: { db: { pop: -1.5 }, ms: 60 },
  pop: { db: {}, ms: 0 },
};

/**
 * Peak linear gain per cue at its category input (before the sfx bus). §16.19: no pop louder than a
 * leak — `leak` ≥ `pop` is asserted in tests/unit/audio, and so is the perceived (A-weighted) level of a
 * leak against the loudest crackle bed (F-028): the ear is ~19 dB less sensitive at the leak's 110 Hz
 * than at the crackle's 2 kHz, so the crackle ceiling is 0.3 and the leak carries a 1.2 kHz rattle body.
 */
export const VOICE = {
  pop: 0.2, popTick: 0.05, crackleMax: 0.3, tink: 0.07,
  ternFire: 0.16, jets: 0.12, frogFire: 0.3, frogLand: 0.22, koiNoise: 0.2, koiSine: 0.2 * dbToGain(-12), owl: 0.09,
  place: 0.18, placeThump: 0.32, invalid: 0.1, upgrade: 0.16, sell: 0.18, sellNotes: 0.14,
  leak: 0.55, leakRattle: 0.16, leakBody: 0.25, clack: 0.22, chime: 0.12,
  bossDrone: 0.22, bossDrum: 0.45, bossThud: 0.5, bossSplash: 0.25, bossTear: 0.3, bossBloom: 0.08,
  // §12 hover −30 dB at the output: −24 here plus the −6 dB sfx bus.
  hover: dbToGain(-24), click: 0.12, sting: 0.14,
} as const;

/** §12 pops: ≤ 6 voices per 50 ms; extras feed the crackle bed. Other cue caps keep R18 readable. */
export const CAPS = {
  popVoices: 6, popWindowMs: 50, crackleMs: 80, crackleHz: 2000,
  fireVoices: 4, fireWindowMs: 50, tinkVoices: 3, tinkWindowMs: 50, landVoices: 3, landWindowMs: 50,
  leakGapMs: 100, dedupeMs: 90,
} as const;

/** §12 crackle gain = 0.1 · log2(extra + 1), clamped so a pathological burst cannot dominate a leak. */
export function crackleGain(extra: number): number {
  return Math.min(VOICE.crackleMax, 0.1 * Math.log2(extra + 1));
}
