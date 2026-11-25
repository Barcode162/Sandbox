// Wave-0 smoke (WO-001): boots with zero console errors, renders within budget, probes the layout,
// drives the sim through the hooks. Slices add their own specs; keep this one green.
import { boot, bootFight, BUDGET, expect, REQUIRED_PROBES, test, writeEvidence } from './support/harness.ts';

test('[S0] boots to the title with a canvas and no console errors', async ({ page, consoleErrors, shot }) => {
  await boot(page);
  await expect(page.locator('canvas.stage')).toBeVisible();
  await expect(page.getByTestId('title')).toBeVisible();
  await shot('S0-title');
  expect(consoleErrors).toEqual([]);
});

test('[S1] opening fight frame: in budget, required objects on screen, probe written', async ({ page, shot }) => {
  const g = await bootFight(page);
  const s = await g.snapshot();
  expect(s.phase).toBe('fight');
  const stats = await g.stats();
  expect(stats.drawCalls).toBeGreaterThan(0);
  expect(stats.drawCalls).toBeLessThanOrEqual(BUDGET.drawCalls);
  expect(stats.triangles).toBeLessThanOrEqual(BUDGET.triangles);
  const probe = await g.probe();
  for (const name of REQUIRED_PROBES) expect(probe[name]?.visible, `${name} visible`).toBe(true);
  writeEvidence('probe-desktop.json', { viewport: page.viewportSize(), stats, probe });
  await shot('S1-opening-desktop');
});

test('[S2] hooks drive the sim: scripted move + attack fire events and sfx', async ({ page }) => {
  const g = await bootFight(page);
  const before = await g.snapshot();
  await g.inject({ moveX: 1 }, 40);
  await g.step(40);
  const after = await g.snapshot();
  expect(after.hero.pos.x - before.hero.pos.x).toBeGreaterThan(2);
  await g.inject({ attack: true }, 1);
  await g.step(20);
  const ev = await g.events();
  expect(ev.some((e) => e.type === 'swing')).toBe(true);
  expect(await g.sfx()).toContain('swing1');
});
