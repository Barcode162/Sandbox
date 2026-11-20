import { describe, expect, it } from 'vitest';
import { defaultSave, loadSave, SAVE_KEY, writeSave } from '../../../src/save/save';

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
