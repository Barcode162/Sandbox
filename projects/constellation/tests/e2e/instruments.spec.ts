// [E6] budgets and the search frame (F11); [E7] keyboard map, visible focus and reduced motion.
import { readFileSync } from 'node:fs';
import { expect, test } from './support/harness.ts';
import { frames, idle, open, pause, setClock, state } from './support/app.ts';

test.describe.configure({ timeout: 90_000 });

test('[E6] perf: 500 generated points hold ≥ 30 fps under SwiftShader', async ({ page }) => {
  await open(page, './?stress=500');
  await page.waitForTimeout(2500);
  const stats = await page.evaluate(() => window.__constellation!.stats());
  expect(stats.nodes).toBe(500);
  expect(stats.fps).toBeGreaterThanOrEqual(30);
  // The stress memory is never autosaved over the user's memory.
  expect(await page.evaluate(() => localStorage.getItem('constellation.memory.v1'))).toBeNull();
});

test('[E6] search: "boil" lights by depth within 150 ms, and Results mirror the glow (F11)', async ({ page, scan, shot }) => {
  await open(page);
  const ms = await page.evaluate(async () => {
    const input = document.getElementById('search') as HTMLInputElement;
    const t = performance.now();
    input.value = 'boil';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise<void>((resolve) => {
      const tick = () => (window.__constellation!.state!().activationCounts ? resolve() : requestAnimationFrame(tick));
      tick();
    });
    await new Promise((r) => requestAnimationFrame(r));
    return performance.now() - t;
  });
  expect(ms).toBeLessThanOrEqual(150);
  await page.waitForTimeout(400);
  const s = await state(page);
  expect(s.activationCounts).toEqual([2, 4, 12, 11]);
  await expect(page.locator('#drawer .summary')).toHaveText('Matches (2) · 1 hop (4) · 2 hops (12) · 3 hops (11)');
  await expect(page.locator('#drawer .rgroup').first()).toContainText('Boiling Point');
  await expect(page.locator('#drawer .rgroup').first()).toContainText('boiling-curve.csv');
  await page.mouse.move(1430, 890);
  await shot('F11-search-1440');
  await scan();
  // No match copy.
  await page.locator('#search').fill('quark');
  await expect(page.locator('#drawer')).toContainText('Nothing here remembers "quark". Try a shorter word, or store it (N).');
});

test('[E7] keyboard: every instrument by Tab / Enter / Esc with visible focus; Esc unwinds one layer', async ({ page, scan }) => {
  await open(page);
  const focusRing = () =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, outline: cs.outlineStyle, width: cs.outlineWidth };
    });
  // Tab reaches the skip link, then the lens pills.
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const f = await focusRing();
  expect(f.outline).toBe('solid');
  expect(f.width).toBe('2px');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');

  // / focuses search; Esc leaves it.
  await page.keyboard.press('/');
  await expect(page.locator('#search')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#search')).not.toBeFocused();

  // R → From; type, Tab, type, Enter finds the route.
  await page.keyboard.press('r');
  await expect(page.locator('#route-from')).toBeFocused();
  await page.keyboard.type('A');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Z');
  await page.keyboard.press('Enter');
  await expect(page.locator('#route-verdict')).toHaveText('25 hops → 3 hops · 88% shorter');
  await page.locator('#route-to').blur();
  // Esc: route first, then the drawer.
  await page.keyboard.press('Escape');
  expect((await state(page)).route).toBeNull();
  await expect(page.locator('#drawer')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer')).toBeHidden();

  // P → pathways; Tab to Run, Enter runs it.
  await page.keyboard.press('p');
  await expect(page.locator('#tab-pathways')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('.pcard').first().getByRole('button', { name: /^Run/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__constellation!.state!().traceIndex >= 1, undefined, { timeout: 20_000 });
  await page.keyboard.press('Escape'); // stops the run
  await page.keyboard.press('Escape'); // closes the drawer
  await expect(page.locator('#drawer')).toBeHidden();

  // Arrow keys select; [ ] cycle neighbours; Enter opens the inspector; announcements are live.
  await page.locator('body').focus();
  await page.keyboard.press('ArrowRight');
  const first = (await state(page)).selected;
  expect(first).toBeTruthy();
  await page.keyboard.press(']');
  const second = (await state(page)).selected;
  expect(second).not.toBe(first);
  await page.keyboard.press('Enter');
  await expect(page.locator('#inspector')).toBeVisible();
  await expect(page.locator('#announcer')).not.toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(page.locator('#inspector')).toBeHidden();

  // N opens the Store sheet (focus on Name); Esc closes it.
  await page.keyboard.press('n');
  await expect(page.locator('#store-name')).toBeFocused();
  await scan();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.sheet')).toHaveCount(0);

  // L links the selection; Esc cancels link mode.
  await page.locator('body').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('l');
  await expect(page.locator('.linkbar')).toBeVisible();
  await page.keyboard.type('Soup');
  await page.keyboard.press('Enter');
  await expect(page.locator('.popover')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.popover')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.linkbar')).toHaveCount(0);

  // ? key map; Ctrl+Z with nothing to undo is calm.
  await page.keyboard.press('?');
  await expect(page.locator('dialog.keymap')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.keymap')).toHaveCount(0);
  await page.keyboard.press('Control+z');
  await expect(page.locator('.toast', { hasText: 'Nothing to undo.' })).toBeVisible();
  // D held expands every ghost.
  await page.locator('body').focus();
  await page.keyboard.down('d');
  await page.waitForTimeout(350);
  expect((await state(page)).ghostState).toBe('expanded');
  await page.keyboard.up('d');
});

test('[E7] reduced motion: the lens switch is instant (no lerp), ghosts sit expanded (F4 reduced)', async ({ page, shot }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const t0 = await pause(page);
  await page.keyboard.press('2');
  await setClock(page, t0 + 100);
  const s = await state(page);
  expect(s.lens).toBe('physicist');
  expect(s.morphT).toBeNull();
  expect(s.ghostState).toBe('expanded');
  expect(s.visibleEdges).toBe(102);
  await shot('F4-reduced-motion-1440');
});

test('[E5] import: a broken file shows the core\'s human error; a valid one opens', async ({ page }) => {
  await open(page);
  await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"schema":"constellation.memory","version":1}') });
  await expect(page.locator('.toast.err')).toContainText('That file isn\'t a Constellation memory (missing "nodes").');
  await page.locator('#import-file').setInputFiles({ name: 'newer.json', mimeType: 'application/json', buffer: Buffer.from('{"schema":"constellation.memory","version":3,"nodes":[]}') });
  await expect(page.locator('.toast.err').last()).toContainText('This memory is from a newer version (v3). Update the app to open it.');
  await page.locator('#import-file').setInputFiles({ name: 'my-memory.json', mimeType: 'application/json', buffer: readFileSync(new URL('../../src/seed/memory.json', import.meta.url)) });
  await expect(page.locator('.toast', { hasText: 'Opened "my-memory.json": 88 lights, 110 lines.' })).toBeVisible();
  await idle(page);
  await frames(page, 2);
  expect((await state(page)).visibleEdges).toBe(100);
});
