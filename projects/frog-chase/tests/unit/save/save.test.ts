import { describe, expect, it } from 'vitest';
import { applyResult, defaultSave, loadSave, SAVE_KEY, writeSave } from '../../../src/save/save';

function memStore(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('save (§7.7 nothing is lost)', () => {
  it('round-trips and survives corrupt or missing storage', () => {
    const st = memStore();
    writeSave(st, { ...defaultSave(), bestMs: 24180, muted: true });
    expect(loadSave(st).bestMs).toBe(24180);
    expect(loadSave(memStore({ [SAVE_KEY]: '{not json' }))).toEqual(defaultSave());
    expect(loadSave(null)).toEqual(defaultSave());
    const throwing = { setItem: () => { throw new Error('quota'); } };
    expect(() => writeSave(throwing, defaultSave())).not.toThrow();
  });
});

describe('save validation and results (polish 20)', () => {
  it('drops wrongly typed fields instead of trusting them', () => {
    const st = memStore({ [SAVE_KEY]: JSON.stringify({ version: 1, bestMs: 'fast', muted: 'yes', reducedMotion: true, runs: -3 }) });
    expect(loadSave(st)).toEqual({ ...defaultSave(), reducedMotion: true });
    expect(loadSave(memStore({ [SAVE_KEY]: JSON.stringify({ version: 1, bestMs: -5 }) })).bestMs).toBeNull();
    expect(loadSave(memStore({ [SAVE_KEY]: JSON.stringify({ version: 2, bestMs: 100 }) }))).toEqual(defaultSave());
    expect(loadSave(memStore({ [SAVE_KEY]: 'null' }))).toEqual(defaultSave());
  });

  it('folds a run into the best time', () => {
    const won = (timeMs: number) => ({ kind: 'won' as const, cause: 'win' as const, tick: 1, timeMs, layer: 36, culpritId: null });
    const first = applyResult(defaultSave(), won(31200));
    expect(first).toMatchObject({ newBest: false, firstRun: true, save: { bestMs: 31200, runs: 1 } });
    expect(applyResult(first.save, won(24180))).toMatchObject({ newBest: true, firstRun: false, save: { bestMs: 24180 } });
    expect(applyResult(first.save, won(40000))).toMatchObject({ newBest: false, save: { bestMs: 31200 } });
    const lost = applyResult(first.save, { ...won(1000), kind: 'eaten', cause: 'still' });
    expect(lost).toMatchObject({ newBest: false, save: { bestMs: 31200, runs: 2 } });
  });
});
