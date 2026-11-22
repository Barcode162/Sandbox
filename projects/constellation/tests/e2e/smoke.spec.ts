// Wave-0 smoke: the page boots, WebGL renders, no console errors, axe clean. WO-003 adds the five flows.
import { boot, expect, test } from './support/harness.ts';

test('[E0] boots to the void with a canvas, no console errors, axe clean', async ({ page, consoleErrors, scan, shot }) => {
  await boot(page);
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.waitForFunction(() => (window.__constellation?.stats().drawCalls ?? 0) > 0);
  await scan();
  await shot('E0-boot');
  expect(consoleErrors).toEqual([]);
});
