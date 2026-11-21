import { describe, expect, it } from 'vitest';
import type { RunResult } from '../../../src/contracts';
import { cardCopy, formatTime, showStamp, tornClip } from '../../../src/ui/format';

const res = (over: Partial<RunResult>): RunResult => ({ kind: 'eaten', cause: 'still', tick: 0, timeMs: 14820, layer: 17, culpritId: null, ...over });
const v = { prevBestMs: 27410, newBest: false, firstRun: false };

describe('timer format (§7.2)', () => {
  it('seconds with 2 decimals, m:ss.cc from a minute, floored', () => {
    expect(formatTime(0)).toBe('0.00');
    expect(formatTime(12345)).toBe('12.34');
    expect(formatTime(59999)).toBe('59.99');
    expect(formatTime(62100)).toBe('1:02.10');
    expect(formatTime(24180)).toBe('24.18');
  });
});

describe('card copy (§7.3–7.5, §9)', () => {
  it('eaten: progress line and the hint names the real cause (polish 16)', () => {
    const still = cardCopy(res({ cause: 'still' }), v, 36);
    expect(still.title).toBe('Chomped!');
    expect(still.line).toBe('17 of 36 pads · 14.82');
    expect(still.hint).toBe('Keep hopping. It hates fast frogs.');
    expect(cardCopy(res({ cause: 'flank' }), v, 36).hint).toBe('Watch for eyes beside a pad.');
  });

  it('sunk: soggy vs curl titles and callouts', () => {
    const s = cardCopy(res({ kind: 'sunk', cause: 'soggy', culpritId: 4 }), v, 36);
    expect(s.title).toBe('Soggy pad!');
    expect(s.callouts).toEqual(['no shadow', 'bubbles', 'no notch']);
    expect(s.hint).toBe('No shadow. Bubbles. Sneaky.');
    const c = cardCopy(res({ kind: 'sunk', cause: 'curl', culpritId: 4 }), v, 36);
    expect(c.title).toBe('Curled pad!');
    expect(c.callouts).toEqual(['curled edge', 'rocks']);
    // One vocabulary on the curl card (F-016).
    expect(c.hint).toBe('Curled edge. Rocks. Sneaky.');
  });

  it('win: new best shows from → to; a first run says "First time" and never stamps (polish 20)', () => {
    const win = res({ kind: 'won', cause: 'win', timeMs: 24180, layer: 37 });
    const nb = cardCopy(win, { ...v, newBest: true }, 36);
    expect(nb.title).toBe('Made it!');
    expect(nb.titleTime).toBe('24.18');
    expect(nb.line).toBe('best 27.41 → 24.18');
    expect(nb.bestFromTo).toEqual(['27.41', '24.18']);
    const first = cardCopy(res({ kind: 'won', cause: 'win', timeMs: 31200 }), { prevBestMs: null, newBest: false, firstRun: true }, 36);
    expect(first.line).toBe('First time: 31.20');
    expect(showStamp({ prevBestMs: null, newBest: true, firstRun: true })).toBe(false);
    expect(showStamp({ prevBestMs: 27410, newBest: true, firstRun: false })).toBe(true);
    expect(cardCopy(res({ kind: 'won', cause: 'win', timeMs: 28000 }), v, 36).line).toBe('So close to your best.');
  });

  it('every line keeps to the voice: at most 7 words', () => {
    for (const r of [res({}), res({ cause: 'flank' }), res({ kind: 'sunk', cause: 'soggy' }), res({ kind: 'sunk', cause: 'curl' })]) {
      const c = cardCopy(r, v, 36);
      for (const line of [c.title, c.hint, c.footer]) if (line) expect(line.split(/\s+/).length).toBeLessThanOrEqual(7);
    }
  });

  it('torn edges are valid clip-path polygons', () => {
    expect(tornClip('top', 10, 3, 1)).toMatch(/^polygon\(.*100% 100%, 0% 100%\)$/);
    expect(tornClip('bottom', 10, 3, 1)).toMatch(/calc\(100% - /);
  });
});
