// tests/e2e/support/harness.ts — FROZEN shared e2e harness (WO-001). Every spec imports `test` from here:
// fails on any console error / pageerror; `shot(name)` saves a viewport JPEG q80 to <evidence>/screens;
// `game` wraps window.__skyrest.
import { test as base, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Intent, Quality, RenderStats, ScreenBox, SimEvent, SimState } from '../../../src/contracts.ts';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** EVIDENCE_DIR env (e.g. the mission dossier's evidence/); else ./evidence (gitignored). */
export function evidenceDir(): string {
  return process.env.EVIDENCE_DIR ? path.resolve(process.env.EVIDENCE_DIR) : path.join(PROJECT, 'evidence');
}

export function writeEvidence(name: string, data: unknown): string {
  const file = path.join(evidenceDir(), name);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

/** Thin typed driver over window.__skyrest (all calls run in the page). */
export function driver(page: Page) {
  return {
    snapshot: () => page.evaluate(() => window.__skyrest!.snapshot()) as Promise<SimState>,
    setSeed: (seed: number) => page.evaluate((s) => window.__skyrest!.setSeed(s), seed),
    skipTitle: () => page.evaluate(() => window.__skyrest!.skipTitle()),
    setManual: (on: boolean) => page.evaluate((m) => window.__skyrest!.setManual(m), on),
    inject: (intent: Partial<Intent>, frames = 1) => page.evaluate(([i, f]) => window.__skyrest!.inject(i, f), [intent, frames] as const),
    step: (n: number) => page.evaluate((k) => window.__skyrest!.step(k), n),
    render: () => page.evaluate(() => window.__skyrest!.render()),
    stats: () => page.evaluate(() => window.__skyrest!.stats()) as Promise<RenderStats>,
    probe: () => page.evaluate(() => window.__skyrest!.probe()) as Promise<Record<string, ScreenBox>>,
    setQuality: (q: Quality) => page.evaluate((x) => window.__skyrest!.setQuality(x), q),
    setFlags: (f: Partial<SimState['flags']>) => page.evaluate((x) => window.__skyrest!.setFlags(x), f),
    events: () => page.evaluate(() => window.__skyrest!.events()) as Promise<SimEvent[]>,
    sfx: () => page.evaluate(() => window.__skyrest!.sfx()) as Promise<string[]>,
  };
}
export type Driver = ReturnType<typeof driver>;

interface Fixtures {
  consoleErrors: string[];
  shot: (name: string) => Promise<string>;
  game: Driver;
}

export const test = base.extend<Fixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    await use(errors);
    expect(errors, 'console errors').toEqual([]);
  },
  shot: async ({ page }, use) => {
    await use(async (name: string) => {
      const file = path.join(evidenceDir(), 'screens', `${name}.jpg`);
      mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
      return file;
    });
  },
  game: async ({ page }, use) => {
    await use(driver(page));
  },
});

/** Load the app and wait until window.__skyrest.ready (first frame rendered). */
export async function boot(page: Page, url = './'): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => window.__skyrest?.ready === true, undefined, { timeout: 20_000 });
}

/** Boot, freeze the real-time clock, skip the title and settle the canonical opening frame. */
export async function bootFight(page: Page, seed = 20261125, settle = 30): Promise<Driver> {
  await boot(page);
  const g = driver(page);
  await g.setManual(true);
  await g.setSeed(seed);
  await g.skipTitle();
  await g.step(settle);
  return g;
}

export const BUDGET = { drawCalls: 250, triangles: 1_000_000 } as const;
export const REQUIRED_PROBES = ['hero', 'golem', 'temple', 'bridge', 'arena'] as const;

export { expect };
