// Settings store (§10.8), persisted to localStorage with try/catch. Implemented in WO-001; owned by WO-005.
// Stored and patched values are sanitised: sliders are clamped to 0..100 integers, toggles must be booleans,
// unknown keys are dropped, so corrupt storage can never reach the audio buses or the shake.
import type { Settings, SettingsStore } from '../contracts/types';

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  music: 60, sfx: 80, shake: 100, reduceMotion: false, colourblind: false, autoStart: false, muted: false,
};
const KEY = 'inkfold.settings.v1';
const SLIDERS = ['music', 'sfx', 'shake'] as const;
const TOGGLES = ['reduceMotion', 'colourblind', 'autoStart', 'muted'] as const;

/** Merge `patch` onto `base`, keeping only valid values. */
export function sanitizeSettings(base: Readonly<Settings>, patch: unknown): Settings {
  const out: Settings = { ...base };
  if (!patch || typeof patch !== 'object') return out;
  const p = patch as Record<string, unknown>;
  for (const k of SLIDERS) {
    const v = p[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.round(Math.min(100, Math.max(0, v)));
  }
  for (const k of TOGGLES) if (typeof p[k] === 'boolean') out[k] = p[k] as boolean;
  return out;
}

export function createSettingsStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()): SettingsStore {
  let cur: Settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = storage?.getItem(KEY);
    if (raw) cur = sanitizeSettings(cur, JSON.parse(raw));
  } catch { /* corrupt or blocked storage: defaults */ }
  const subs = new Set<(s: Readonly<Settings>) => void>();
  return {
    get: () => cur,
    set(patch) {
      cur = sanitizeSettings(cur, patch);
      try { storage?.setItem(KEY, JSON.stringify(cur)); } catch { /* quota / privacy mode */ }
      for (const fn of subs) fn(cur);
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}

function safeStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
