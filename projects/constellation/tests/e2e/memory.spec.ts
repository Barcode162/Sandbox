// Personal memories: ?memory=<name> (M-0003). The Owner's "update constellations" link.
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './support/harness.ts';
import { state } from './support/app.ts';

const MIND = JSON.parse(readFileSync(new URL('../../src/memories/mind.json', import.meta.url), 'utf8'));
const SEED = JSON.parse(readFileSync(new URL('../../src/seed/memory.json', import.meta.url), 'utf8'));
const KEY = 'constellation.memory.v1';

/** A copy of `doc` with one extra star, linked to `to`, as if the Owner stored it by hand. */
function withHandStar(doc: { nodes: unknown[]; relations: unknown[] }, to: string, label: string) {
  const copy = structuredClone(doc) as { nodes: Array<Record<string, unknown>>; relations: Array<Record<string, unknown>> };
  const now = Date.UTC(2026, 10, 24);
  copy.nodes.push({ id: 'hand-star', label, kind: 'note', value: 'mine', facets: {}, tags: [], created: now, updated: now });
  copy.relations.push({ id: 'hand-link', from: 'hand-star', to, type: 'association', weight: 1, directed: false, created: now });
  return copy;
}

async function ready(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => window.__constellation?.state?.().introDone === true, undefined, { timeout: 20_000 });
}

test('[M3-1] ?memory=mind opens the Owner\'s memory with its own lenses', async ({ page, scan }) => {
  await ready(page, './?memory=mind');
  const s = await state(page);
  expect(s.statsText).toBe(`${MIND.nodes.length} lights · ${MIND.relations.length} lines`);
  expect(s.lens).toBe('me');
  await expect(page.locator('.lens-pill')).toHaveText([/Me/, /Church/, /Science/]);
  expect(s.labelsShown).toBeGreaterThan(10);
  await scan();
});

test('[M3-2] an unknown name says so truthfully and never touches the main memory (F-003)', async ({ page }) => {
  await page.goto('./?seed=1');
  await page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: KEY, v: JSON.stringify(withHandStar(SEED, 'temperature', 'Marker')) });
  await ready(page, './?memory=nope');
  await expect(page.locator('.toast', { hasText: 'There\'s no memory called "nope" here, so your usual memory is shown.' })).toBeVisible();
  // The main memory opened (seed + the marker star); the line count is per lens, so only lights are compared.
  expect((await state(page)).statsText).toMatch(new RegExp(`^${SEED.nodes.length + 1} lights · `));
  const main = await page.evaluate((k) => localStorage.getItem(k), KEY);
  expect(main).toContain('"Marker"');
});

test('[M3-3] same file: the browser copy reopens and counts only the Owner\'s own stars (F-002)', async ({ page }) => {
  await ready(page, './?memory=mind'); // sets the stamp
  await page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: `${KEY}.mind`, v: JSON.stringify(withHandStar(MIND, 'trails', 'Hand star')) });
  await ready(page, './?memory=mind');
  expect((await state(page)).statsText).toBe(`${MIND.nodes.length + 1} lights · ${MIND.relations.length + 1} lines`);
  await expect(page.locator('.toast', { hasText: `Welcome back. ${MIND.nodes.length + 1} lights. The 1 you stored is where you left it.` })).toBeVisible({ timeout: 6000 });
});

test('[M3-4] a newer file replaces the browser copy but keeps hand-added stars aside (F-004)', async ({ page }) => {
  await ready(page, './?memory=mind');
  await page.evaluate(
    ({ k, v }) => {
      localStorage.setItem(k, v);
      localStorage.setItem(`${k}.stamp`, 'an-older-file');
    },
    { k: `${KEY}.mind`, v: JSON.stringify(withHandStar(MIND, 'trails', 'Hand star')) },
  );
  await ready(page, './?memory=mind');
  expect((await state(page)).statsText).toBe(`${MIND.nodes.length} lights · ${MIND.relations.length} lines`);
  const kept = page.locator('.toast', { hasText: 'Your memory was updated. "Hand star" was only in this browser, so a copy is kept aside.' });
  await expect(kept).toBeVisible();
  await expect(kept.getByRole('button', { name: 'Download it' })).toBeVisible();
  const previous = await page.evaluate((k) => localStorage.getItem(`${k}.previous`), `${KEY}.mind`);
  expect(previous).toContain('"Hand star"');
});
