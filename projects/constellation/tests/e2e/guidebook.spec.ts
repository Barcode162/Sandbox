// [E8] The Guidebook example (M-0003): opened from the ••• menu through the same confirm path as
// Import, it lands on "Start here" with its notes, and its lenses, search and route answer as the
// notes promise. Screenshots go to the evidence dir (G1–G4).
import { expect, test } from './support/harness.ts';
import { frames, idle, open, state } from './support/app.ts';

test.describe.configure({ timeout: 90_000 });

test('[E8] Guidebook: open from the menu, read Start here, look from Last year, ask "tax", race Idea → Launch', async ({ page, scan, shot }) => {
  await open(page);
  await page.locator('#menu-open').click();
  await page.getByRole('menuitem', { name: 'Open the Guidebook example' }).click();
  await expect(page.locator('dialog.confirm')).toContainText('Replace your memory with "the Guidebook"?');
  await page.locator('dialog.confirm').getByRole('button', { name: 'Replace' }).click();
  await expect(page.locator('.toast', { hasText: /Opened "the Guidebook": 1\d\d lights, 2\d\d lines\./ })).toBeVisible();
  await expect(page.locator('#stats')).toHaveText(/^1\d\d lights · \d+ lines$/);
  // It lands on Start here, with the guide's own words in the inspector.
  await expect(page.locator('#inspector')).toContainText('Start here');
  await expect(page.locator('#inspector')).toContainText('This is the Guidebook');
  await idle(page);
  await frames(page, 3);
  let s = await state(page);
  expect(s.lens).toBe('today');
  expect(s.nanPositions).toBe(0);
  await scan();
  await shot('G1-guidebook-start-1440');

  // Close the inspector and look at the whole memory from Last year.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Home');
  await page.keyboard.press('2');
  await idle(page);
  await page.waitForTimeout(3600);
  await frames(page, 3);
  s = await state(page);
  expect(s.lens).toBe('last-year');
  await shot('G2-guidebook-last-year-1440');

  // Ask by a word: "tax" lights matches and their neighbourhood by depth.
  await page.keyboard.press('1');
  await idle(page);
  await page.keyboard.press('/');
  await page.keyboard.type('tax');
  await page.waitForTimeout(900);
  await frames(page, 3);
  s = await state(page);
  expect(s.activationCounts?.[0]).toBeGreaterThanOrEqual(2);
  expect(s.activationCounts?.[1]).toBeGreaterThan(0);
  await shot('G3-guidebook-search-tax-1440');
  await page.keyboard.press('Escape');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  // The featured route: Idea → Launch, 13 declared hops vs a 3-hop shortcut through the client.
  await page.keyboard.press('r');
  await page.getByRole('button', { name: /Try the featured route: Idea → Launch/ }).click();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).route?.shortest).toBe(3);
  expect((await state(page)).route?.declared).toBe(13);
  await idle(page);
  await page.waitForTimeout(2600);
  await shot('G4-guidebook-route-1440');
});

test('[E8b] Guidebook at 375: Home frames every island, so no cluster starts off-screen (M-0003 F-001)', async ({ page, shot }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await page.locator('#menu-open').click();
  await page.getByRole('menuitem', { name: 'Open the Guidebook example' }).click();
  await page.locator('dialog.confirm').getByRole('button', { name: 'Replace' }).click();
  await idle(page);
  await page.keyboard.press('Escape');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Home');
  await idle(page);
  await page.waitForTimeout(1200);
  await frames(page, 3);
  await shot('G5-guidebook-375');
  // Every island hub is on screen.
  for (const label of ['Health', 'Day job', 'checkout.js', 'Learning', 'Home', 'Money', 'Garden app', 'Launch']) {
    const p = await page.evaluate((l) => {
      const h = window.__constellation!;
      return h.screenPosition(h.nodeIdByLabel(l)!);
    }, label);
    expect(p, label).not.toBeNull();
    expect(p!.x, label).toBeGreaterThanOrEqual(0);
    expect(p!.x, label).toBeLessThanOrEqual(375);
    expect(p!.y, label).toBeGreaterThanOrEqual(0);
    expect(p!.y, label).toBeLessThanOrEqual(812);
  }
  await shot('G5-guidebook-375');
});
