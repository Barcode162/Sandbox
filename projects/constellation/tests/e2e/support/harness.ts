// tests/e2e/support/harness.ts — shared e2e harness (wave 0). Every spec uses `test` from here:
// it fails the test on any console error / pageerror, and provides `scan()` (axe, WCAG 2.2 AA)
// and `shot(name)` (viewport JPEG q80 into the evidence dir).
import { test as base, expect, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** EVIDENCE_DIR env; else the mission dossier's evidence/ if present; else ./evidence (gitignored). */
export function evidenceDir(): string {
  if (process.env.EVIDENCE_DIR) return path.resolve(process.env.EVIDENCE_DIR);
  const dossier = path.resolve(PROJECT, '..', '..', 'bureau', 'missions', 'M-0002-constellation', 'evidence');
  return existsSync(dossier) ? dossier : path.join(PROJECT, 'evidence');
}

interface Fixtures {
  consoleErrors: string[];
  scan: () => Promise<void>;
  shot: (name: string) => Promise<string>;
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
  scan: async ({ page }, use) => {
    await use(async () => {
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  },
  shot: async ({ page }, use) => {
    await use(async (name: string) => {
      const dir = path.join(evidenceDir(), 'screens');
      mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${name}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
      return file;
    });
  },
});

/** Load the app and wait for window.__constellation.ready. */
export async function boot(page: Page, url = './'): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => window.__constellation?.ready === true, undefined, { timeout: 15_000 });
}

export { expect };
