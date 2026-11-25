// src/core/settings.ts — FROZEN (WO-001). Settings with localStorage persistence (guarded for node).
import type { Settings, SettingsStore } from '../contracts.ts';

export const SETTINGS_KEY = 'skyrest.settings.v1';

export function defaultSettings(): Settings {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { volume: 0.8, music: 0.5, quality: 'auto', reduceShake: reduced, reduceFlash: false, showStats: false };
}

export function createSettings(initial?: Partial<Settings>): SettingsStore {
  let s: Settings = { ...defaultSettings(), ...load(), ...initial };
  const subs: ((s: Readonly<Settings>) => void)[] = [];
  return {
    get: () => s,
    set(patch) {
      s = { ...s, ...patch };
      try {
        globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(s));
      } catch {
        /* private mode: keep in memory */
      }
      for (const fn of subs.slice()) fn(s);
    },
    subscribe(fn) {
      subs.push(fn);
      return () => {
        const i = subs.indexOf(fn);
        if (i >= 0) subs.splice(i, 1);
      };
    },
  };
}

function load(): Partial<Settings> {
  try {
    const raw = globalThis.localStorage?.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Partial<Settings>) : {};
  } catch {
    return {};
  }
}
