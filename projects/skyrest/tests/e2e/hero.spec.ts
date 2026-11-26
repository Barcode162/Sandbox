// WO-003 hero + combat feel in the browser: the SFX log covers swing, hit, crit, dodge, golemSlam and coin; and the
// frame-table moments F3/F4/F6 reach their instants (captured into evidence/wo-003 at portrait + desktop).
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { boot, driver, evidenceDir, expect, test } from './support/harness.ts';

test('[HE1] sfx() logs swing, hit, crit, dodge, golemSlam and coin', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);
  const g = driver(page);
  await g.setManual(true);
  await g.setSeed(20261125);
  await g.skipTitle();
  await g.setFlags({ heroInvulnerable: true, forceCrit: 0 });
  await page.evaluate(() => window.__skyrest!.moment('F6')); // golem slams (and the hero rolls)
  await g.setSeed(20261125);
  await g.skipTitle();
  await g.setFlags({ golemPassive: true, forceCrit: 0 });
  await g.step(120);
  await g.inject({ attack: true });
  await g.step(30);
  await g.setFlags({ forceCrit: 1 });
  await g.inject({ attack: true });
  await g.step(40);
  await g.inject({ dodge: true });
  await g.step(30);
  // Kill from the spawn staging (the roll above left the hero out of reach): the coin burst follows.
  await g.setSeed(20261125);
  await g.skipTitle();
  await g.setFlags({ golemPassive: true, forceDamage: 999_999 });
  await g.step(120);
  await g.inject({ attack: true });
  // The coin burst follows the crumble: step until the sim has emitted it.
  for (let i = 0; i < 20 && !(await g.events()).some((e) => e.type === 'coins'); i++) await g.step(30);
  const ids = await g.sfx();
  for (const id of ['swing1', 'hit', 'crit', 'dodge', 'golemSlam', 'coin']) expect(ids, id).toContain(id);
});

for (const [label, size] of [['portrait', { width: 430, height: 932 }], ['desktop', { width: 1280, height: 720 }]] as const) {
  test(`[HE2-${label}] F3 / F4 / F6 reach their instants`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(size);
    const dir = path.join(evidenceDir(), 'wo-003');
    mkdirSync(dir, { recursive: true });
    for (const id of ['F3', 'F4', 'F6'] as const) {
      await boot(page);
      const r = await page.evaluate((m) => window.__skyrest!.moment(m), id);
      const s = await driver(page).snapshot();
      if (id === 'F3') {
        expect(r.note).toBe('combo hits 2/2');
        expect(s.hitstop, 'F3 is inside the hit-stop').toBeGreaterThan(0);
        expect(s.hero.action).toBe('attack2');
      } else if (id === 'F4') {
        expect(r.note).toContain('combo hits 3/3');
        expect(s.hero.action).toBe('attack3');
        const last = (await driver(page).events()).filter((e) => e.type === 'hit').at(-1);
        expect(last && last.type === 'hit' && last.crit).toBe(true);
      } else {
        expect(r.note).toContain('slam impact');
      }
      await page.screenshot({ path: path.join(dir, `${id}-${label}.jpg`), type: 'jpeg', quality: 80 });
    }
  });
}
