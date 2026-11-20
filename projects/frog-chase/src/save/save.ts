/**
 * Persistence: best time and settings in localStorage `lilyfield.v1` (§7.7 "nothing is lost"). OWNER: WO-004.
 * Must never throw (private mode, quota, corrupt JSON → defaults). Every field is validated on load,
 * so a hand-edited or half-written save can never put NaN into the HUD.
 */
import type { RunResult, SaveData } from '../contracts';

export const SAVE_KEY = 'lilyfield.v1';

export function defaultSave(): SaveData {
  return { version: 1, bestMs: null, muted: false, reducedMotion: null, runs: 0 };
}

const finitePos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Keep each field only if it has the right type; anything else falls back to its default. */
export function sanitize(d: unknown): SaveData {
  const out = defaultSave();
  if (!d || typeof d !== 'object') return out;
  const o = d as Record<string, unknown>;
  if (o.version !== 1) return out;
  if (finitePos(o.bestMs)) out.bestMs = o.bestMs;
  if (typeof o.muted === 'boolean') out.muted = o.muted;
  if (typeof o.reducedMotion === 'boolean') out.reducedMotion = o.reducedMotion;
  if (typeof o.runs === 'number' && Number.isInteger(o.runs) && o.runs >= 0) out.runs = o.runs;
  return out;
}

export function loadSave(storage: Pick<Storage, 'getItem'> | null): SaveData {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return sanitize(JSON.parse(raw));
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

export interface ResultOutcome {
  save: SaveData;
  /** A win that beat an existing best (never on a first-ever win, polish 20). */
  newBest: boolean;
  /** No best existed before this run: a win reads "First time: 31.20". */
  firstRun: boolean;
}

/** Fold a finished run into the save. Pure: returns a new SaveData. */
export function applyResult(save: SaveData, result: RunResult): ResultOutcome {
  const prev = save.bestMs;
  const won = result.kind === 'won' && finitePos(result.timeMs);
  const newBest = won && prev !== null && result.timeMs < prev;
  const bestMs = won && (prev === null || result.timeMs < prev) ? result.timeMs : prev;
  return { save: { ...save, bestMs, runs: save.runs + 1 }, newBest, firstRun: prev === null };
}
