// Frame-table captures (WO-001 harness; experience.md §11). Each moment's SCRIPT is owned by a slice
// (src/moments/{world,hero,loop}.ts); this spec only runs them and saves moments/<id>-<viewport>.jpg.
// F2 is also captured at the reference aspect (802×917) for the side-by-side with evidence/reference.jpg.
import { boot, expect, test } from './support/harness.ts';
import { MOMENT_IDS, MOMENT_VIEWPORTS } from '../../src/moments/index.ts';
import type { MomentId } from '../../src/contracts.ts';

const SIZES: Record<string, { width: number; height: number }> = {
  portrait: MOMENT_VIEWPORTS.portrait,
  desktop: MOMENT_VIEWPORTS.desktop,
};
const EXTRA: [MomentId, keyof typeof MOMENT_VIEWPORTS][] = [['F2', 'reference'], ['F13', 'landscape']];

for (const [label, size] of Object.entries(SIZES)) {
  for (const id of MOMENT_IDS) {
    // One test per moment: SwiftShader is slow, so 13 captures in one test overran any sane timeout.
    test(`[M-${label}] moment ${id} at ${size.width}×${size.height}`, async ({ page, shot }) => {
      test.setTimeout(180_000);
      await page.setViewportSize(size);
      await boot(page);
      const r = await page.evaluate((m) => window.__skyrest!.moment(m), id);
      expect(r.ok, `${id}: ${r.note}`).toBe(true);
      await shot(`moments/${id}-${label}`);
    });
  }
}

test('[M-extra] reference-aspect F2 and landscape F13', async ({ page, shot }) => {
  test.setTimeout(240_000);
  for (const [id, vp] of EXTRA) {
    await page.setViewportSize(MOMENT_VIEWPORTS[vp]);
    await boot(page);
    const r = await page.evaluate((m) => window.__skyrest!.moment(m), id);
    expect(r.ok, `${id}: ${r.note}`).toBe(true);
    await shot(`moments/${id}-${vp}`);
  }
});
