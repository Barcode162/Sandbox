// WO-001 contract smoke: the scaffold's frozen modules load, and the sim stays pure.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSim } from '../../../src/sim';
import { createFixedLoop } from '../../../src/app/loop';
import { createSettingsStore, DEFAULT_SETTINGS } from '../../../src/app/settings';
import { createRng } from '../../../src/sim/rng';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
}

describe('purity [A2]', () => {
  it('src/sim and src/data use no DOM, clock or Math.random', () => {
    const banned = /\b(Math\.random|Date\.now|new Date|performance\.|window\.|document\.|requestAnimationFrame|localStorage)\b/;
    for (const f of [...files('src/sim'), ...files('src/data')]) {
      const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(banned.test(code), f).toBe(false);
    }
  });
});

describe('sim factory', () => {
  it('starts at R1 intermission with 650 sheets and 100 seeds', () => {
    const s = createSim({ seed: 1 });
    expect(s.state).toMatchObject({ round: 1, phase: 'intermission', money: 650, lives: 100, tick: 0 });
    s.step();
    expect(s.state.tick).toBe(1);
  });
  it('rng is seeded and repeatable', () => {
    const a = createRng(42), b = createRng(42);
    expect([a.next(), a.next(), a.int(10)]).toEqual([b.next(), b.next(), b.int(10)]);
  });
});

describe('fixed loop (§11 Speed)', () => {
  const run = (hz: number, speed: 1 | 2, seconds: number) => {
    const loop = createFixedLoop();
    let steps = 0;
    for (let t = 0; t < seconds * hz; t++) steps += loop.frame(1000 / hz, speed, false);
    return steps;
  };
  it('30 Hz and 144 Hz render rates run the same number of ticks', () => {
    expect(Math.abs(run(30, 1, 10) - 600)).toBeLessThanOrEqual(1);
    expect(Math.abs(run(144, 1, 10) - 600)).toBeLessThanOrEqual(1);
    expect(Math.abs(run(30, 2, 10) - 1200)).toBeLessThanOrEqual(1);
  });
  it('paused runs zero steps', () => expect(createFixedLoop().frame(100, 1, true)).toBe(0));
});

describe('settings store (§10.8)', () => {
  it('defaults, persists, survives corrupt storage', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const s = createSettingsStore(storage);
    expect(s.get()).toEqual(DEFAULT_SETTINGS);
    s.set({ music: 10 });
    expect(createSettingsStore(storage).get().music).toBe(10);
    mem.set('inkfold.settings.v1', '{nope');
    expect(createSettingsStore(storage).get()).toEqual(DEFAULT_SETTINGS);
  });
});
