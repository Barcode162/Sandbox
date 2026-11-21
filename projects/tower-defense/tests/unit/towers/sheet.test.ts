// WO-003 done-when: the 4 × 12 sprite sheet rendered in headless Chromium, saved to
// evidence-local/screens/towers-sheet.jpg, and every cell differs from its left neighbour by ≥ 2 % of its pixels.
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { build } from 'vite';
import { chromium } from 'playwright-core';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');

async function bundle(): Promise<string> {
  const out = await build({
    configFile: false, logLevel: 'silent', root: ROOT,
    build: { write: false, minify: false, lib: { entry: join(ROOT, 'tests/unit/towers/sheet-entry.ts'), formats: ['iife'], name: 'SheetEntry', fileName: 'sheet' } },
  });
  const res = Array.isArray(out) ? out[0] : out;
  const chunk = (res as { output: { type: string; code?: string }[] }).output.find((o) => o.type === 'chunk');
  if (!chunk?.code) throw new Error('sheet bundle produced no chunk');
  return chunk.code;
}

describe('towers sheet (Chromium)', () => {
  it('draws 4 × 12 visibly distinct cells (≥ 2 % pixels vs the left neighbour) with no console errors', async () => {
    const code = await bundle();
    const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      const errors: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setContent('<!doctype html><body style="margin:0;background:#000"><canvas id="c" width="1280" height="720"></canvas></body>');
      await page.addScriptTag({ content: code });
      const diffs = await page.evaluate(() => (window as unknown as { sheet: { diffs(): number[][] } }).sheet.diffs());
      const dir = join(ROOT, 'evidence-local', 'screens');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: join(dir, 'towers-sheet.jpg'), type: 'jpeg', quality: 80 });
      await page.evaluate(() => (window as unknown as { sheet: { draw(ms: number): void } }).sheet.draw(1234));
      await page.screenshot({ path: join(dir, 'towers-sheet-motion.jpg'), type: 'jpeg', quality: 80 });
      for (const t of [150, 212]) {
        await page.evaluate((n) => (window as unknown as { battle(n: number): string[] }).battle(n), t);
        await page.screenshot({ path: join(dir, `towers-battle-${t}.jpg`), type: 'jpeg', quality: 80 });
      }
      const min = Math.min(...diffs.flat());
      console.log(`towers-sheet: min neighbour diff ${(min * 100).toFixed(2)} %`, diffs.map((r) => r.map((v) => (v * 100).toFixed(1)).join(' ')).join(' | '));
      expect(errors).toEqual([]);
      expect(diffs).toHaveLength(4);
      for (const row of diffs) { expect(row).toHaveLength(11); for (const v of row) expect(v).toBeGreaterThanOrEqual(0.02); }
    } finally {
      await browser.close();
    }
  }, 60_000);
});
