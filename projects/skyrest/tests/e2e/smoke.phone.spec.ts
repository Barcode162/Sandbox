// Wave-0 phone smoke (WO-001): emulated iPhone (touch), portrait + landscape boot, tap Start.
import { boot, bootFight, expect, REQUIRED_PROBES, test, writeEvidence } from './support/harness.ts';

test('[SP0] portrait: boots, tap Start enters the fight', async ({ page, game, shot }) => {
  await boot(page);
  await shot('SP0-title-portrait');
  await page.getByTestId('start').tap();
  await page.waitForFunction(() => window.__skyrest!.snapshot().phase !== 'title');
  expect((await game.snapshot()).phase).not.toBe('title');
});

test('[SP1] portrait + landscape opening frames are probed', async ({ page, shot }) => {
  for (const [label, size] of [['portrait', { width: 430, height: 932 }], ['landscape', { width: 932, height: 430 }]] as const) {
    await page.setViewportSize(size);
    const g = await bootFight(page);
    const probe = await g.probe();
    for (const name of REQUIRED_PROBES) expect(probe[name]?.visible, `${label} ${name}`).toBe(true);
    writeEvidence(`probe-${label}.json`, { viewport: size, stats: await g.stats(), probe });
    await shot(`SP1-opening-${label}`);
  }
});
