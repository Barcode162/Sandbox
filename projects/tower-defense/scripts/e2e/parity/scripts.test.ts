// Headless reference run of the §8 scripts (board condition 2). Writes the RunSummary of each script to
// INKFOLD_PARITY_OUT (default evidence-local/playthrough/vitest.json); playthrough.mjs compares the browser to it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { playScript } from '../../../src/sim/bot';
import { LOSS_BY_ROUND, SCRIPT_SEED, SCRIPTS, WIN_MIN_SEEDS } from '../../../src/data/scripts';

it('runs the win and loss scripts headless and records their summaries', () => {
  const t0 = performance.now();
  const win = playScript(SCRIPTS.win, { seed: SCRIPT_SEED });
  const t1 = performance.now();
  const loss = playScript(SCRIPTS.loss, { seed: SCRIPT_SEED });
  const t2 = performance.now();
  const out = resolve(process.env.INKFOLD_PARITY_OUT ?? 'evidence-local/playthrough/vitest.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify({ seed: SCRIPT_SEED, win, loss, ms: { win: t1 - t0, loss: t2 - t1 } }, null, 2)}\n`);
  expect(win.outcome).toBe('victory');
  expect(win.lives).toBeGreaterThanOrEqual(WIN_MIN_SEEDS);
  expect(loss.outcome).toBe('defeat');
  expect(loss.round).toBeLessThanOrEqual(LOSS_BY_ROUND);
});
