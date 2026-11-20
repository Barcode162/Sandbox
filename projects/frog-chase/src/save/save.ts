/**
 * Persistence: best time and settings in localStorage `lilyfield.v1` (§7.7). OWNER: WO-004.
 * Must never throw (private mode, quota, corrupt JSON → defaults).
 */
import type { SaveData } from '../contracts';

export const SAVE_KEY = 'lilyfield.v1';

export function defaultSave(): SaveData {
  return { version: 1, bestMs: null, muted: false, reducedMotion: null, runs: 0 };
}

export function loadSave(storage: Pick<Storage, 'getItem'> | null): SaveData {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const d = JSON.parse(raw) as Partial<SaveData>;
    if (d.version !== 1) return defaultSave();
    return { ...defaultSave(), ...d, version: 1 };
  } catch {
    return defaultSave();
  }
}

export function writeSave(storage: Pick<Storage, 'setItem'> | null, d: SaveData): void {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(d));
  } catch {
    /* storage unavailable: play on */
  }
}
