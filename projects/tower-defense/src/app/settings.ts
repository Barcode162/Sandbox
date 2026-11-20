// Settings store (§10.8), persisted to localStorage with try/catch. Implemented in WO-001; owned by WO-005.
import type { Settings, SettingsStore } from '../contracts/types';

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  music: 60, sfx: 80, shake: 100, reduceMotion: false, colourblind: false, autoStart: false, muted: false,
};
const KEY = 'inkfold.settings.v1';

export function createSettingsStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()): SettingsStore {
  let cur: Settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = storage?.getItem(KEY);
    if (raw) cur = { ...cur, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { /* corrupt or blocked storage: defaults */ }
  const subs = new Set<(s: Readonly<Settings>) => void>();
  return {
    get: () => cur,
    set(patch) {
      cur = { ...cur, ...patch };
      try { storage?.setItem(KEY, JSON.stringify(cur)); } catch { /* quota / privacy mode */ }
      for (const fn of subs) fn(cur);
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}

function safeStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
