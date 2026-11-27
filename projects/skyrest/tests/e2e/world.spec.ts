// WO-002 world & look: screen-space framing (L-0006) at the reference, portrait and landscape aspects, the
// draw/triangle budgets on both tiers, ambient motion, and the Low tier's halo path (no composer).
import type { Page } from '@playwright/test';
import { boot, BUDGET, expect, test, writeEvidence } from './support/harness.ts';
import type { MomentId, Quality, RenderStats, ScreenBox } from '../../src/contracts.ts';

const LOW_BUDGET = { drawCalls: 150, triangles: 400_000 } as const;

async function moment(page: Page, id: MomentId, quality: Quality) {
  await boot(page);
  return page.evaluate(([m, q]) => {
    const h = window.__skyrest!;
    h.setQuality(q);
    const r = h.moment(m);
    return { r, stats: h.stats(), probe: h.probe() };
  }, [id, quality] as const) as Promise<{ r: { ok: boolean; note: string }; stats: RenderStats; probe: Record<string, ScreenBox> }>;
}

const inRange = (v: number, lo: number, hi: number) => v >= lo && v <= hi;

test('[W-F2] reference frame 802×917: temple upper-right, hero low-centre', async ({ page, consoleErrors }) => {
  void consoleErrors; // the harness fails the test on any console error
  await page.setViewportSize({ width: 802, height: 917 });
  const { r, probe, stats } = await moment(page, 'F2', 'high');
  writeEvidence('wo-002/probe-F2-reference.json', { stats, probe });
  expect(r.ok, r.note).toBe(true);
  const { temple, hero } = probe;
  expect(temple!.visible && inRange(temple!.cx, 0.77, 0.91), `temple sx ${temple!.cx}`).toBe(true);
  expect(inRange(temple!.cy, 0.07, 0.22), `temple sy ${temple!.cy}`).toBe(true);
  expect(hero!.visible && inRange(hero!.cx, 0.44, 0.56), `hero sx ${hero!.cx}`).toBe(true);
  expect(inRange(hero!.cy, 0.8, 0.92), `hero sy ${hero!.cy}`).toBe(true);
});

test('[W-F12] portrait 430×932: hero, golem and temple in their §4.3 bands', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  const { probe, stats } = await moment(page, 'F12', 'low');
  writeEvidence('wo-002/probe-F12-portrait.json', { stats, probe });
  const { temple, hero, golem } = probe;
  // The hero box includes the sword arc and cape (asymmetric), so sx gets ±0.08 around the spec's 0.50.
  expect(inRange(hero!.cx, 0.42, 0.58) && inRange(hero!.cy, 0.72, 0.81), `hero ${hero!.cx}, ${hero!.cy}`).toBe(true);
  expect(inRange(golem!.cx, 0.27, 0.79) && inRange(golem!.cy, 0.46, 0.66), `golem ${golem!.cx}, ${golem!.cy}`).toBe(true);
  expect(inRange(temple!.cx, 0.76, 0.95) && inRange(temple!.cy, 0.15, 0.27), `temple ${temple!.cx}, ${temple!.cy}`).toBe(true);
});

test('[W-F13] landscape 932×430: hero low, temple ≈ sx 0.67 near the top', async ({ page }) => {
  await page.setViewportSize({ width: 932, height: 430 });
  const { probe, stats } = await moment(page, 'F13', 'low');
  writeEvidence('wo-002/probe-F13-landscape.json', { stats, probe });
  const { temple, hero } = probe;
  expect(inRange(hero!.cy, 0.72, 0.87), `hero sy ${hero!.cy}`).toBe(true);
  expect(inRange(temple!.cx, 0.61, 0.73) && temple!.cy <= 0.2, `temple ${temple!.cx}, ${temple!.cy}`).toBe(true);
});

test('[W-BUDGET] draw calls and triangles within budget on High and Low', async ({ page, consoleErrors }) => {
  void consoleErrors;
  const out: Record<string, RenderStats> = {};
  for (const [size, label] of [[{ width: 1280, height: 720 }, 'desktop'], [{ width: 430, height: 932 }, 'portrait']] as const) {
    await page.setViewportSize(size);
    for (const q of ['high', 'low'] as const) {
      const { stats } = await moment(page, 'F2', q);
      out[`${label}-${q}`] = stats;
      const b = q === 'high' ? BUDGET : LOW_BUDGET;
      expect(stats.drawCalls, `${label} ${q} draws`).toBeLessThanOrEqual(b.drawCalls);
      expect(stats.triangles, `${label} ${q} tris`).toBeLessThanOrEqual(b.triangles);
    }
  }
  writeEvidence('wo-002/budget.json', out);
});

test('[W-LOW] Low has no composer and draws halos; High blooms', async ({ page }) => {
  await page.setViewportSize({ width: 802, height: 917 });
  await moment(page, 'F12', 'low');
  const canvas = page.locator('canvas.stage');
  await expect(canvas).toHaveAttribute('data-post', 'halos');
  await expect(canvas).toHaveAttribute('data-tier', 'low');
  await page.evaluate(() => window.__skyrest!.setQuality('high'));
  await page.evaluate(() => window.__skyrest!.render());
  await expect(canvas).toHaveAttribute('data-post', 'bloom');
});

test('[W-AMBIENT] grass, petals and clouds move: two F12 frames 500 ms apart differ', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await moment(page, 'F12', 'low');
  const diffs = await page.evaluate(async () => {
    const h = window.__skyrest!;
    const canvas = document.querySelector('canvas.stage') as HTMLCanvasElement;
    const grab = () => {
      h.render();
      return canvas.toDataURL('image/png'); // same task as the render: the drawing buffer is still valid
    };
    const a = grab();
    h.step(30); // 500 ms of ambient time
    const b = grab();
    const load = (src: string) => new Promise<ImageData>((res) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const g = c.getContext('2d')!;
        g.drawImage(img, 0, 0);
        res(g.getImageData(0, 0, c.width, c.height));
      };
      img.src = src;
    });
    const [A, B] = [await load(a), await load(b)];
    // Regions (fractions of the frame): meadow lower-right, blossom/petals lower-left, sky + clouds upper band.
    const region = (x0: number, y0: number, x1: number, y1: number) => {
      let sum = 0, n = 0;
      for (let y = Math.floor(y0 * A.height); y < y1 * A.height; y += 2)
        for (let x = Math.floor(x0 * A.width); x < x1 * A.width; x += 2) {
          const i = (y * A.width + x) * 4;
          sum += Math.abs(A.data[i]! - B.data[i]!) + Math.abs(A.data[i + 1]! - B.data[i + 1]!) + Math.abs(A.data[i + 2]! - B.data[i + 2]!);
          n++;
        }
      return sum / n;
    };
    return { grass: region(0.6, 0.85, 1, 1), petals: region(0, 0.6, 0.45, 0.95), clouds: region(0, 0.2, 0.6, 0.42) };
  });
  writeEvidence('wo-002/ambient-diff.json', diffs);
  expect(diffs.grass, 'grass sways').toBeGreaterThan(1);
  expect(diffs.petals, 'petals drift').toBeGreaterThan(0.5);
  expect(diffs.clouds, 'clouds drift').toBeGreaterThan(0.3);
});

test('[W-CTX] WebGL context loss: drawing stops, restore rebuilds the post chain, no errors, non-blank frame', async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.setViewportSize({ width: 802, height: 917 });
  await moment(page, 'F12', 'high');
  const canvas = page.locator('canvas.stage');
  await page.evaluate(() => {
    const gl = (document.querySelector('canvas.stage') as HTMLCanvasElement).getContext('webgl2')!;
    (window as unknown as { __lc: WEBGL_lose_context }).__lc = gl.getExtension('WEBGL_lose_context')!;
    (window as unknown as { __lc: WEBGL_lose_context }).__lc.loseContext();
  });
  await expect(canvas).toHaveAttribute('data-context', 'lost');
  await page.evaluate(() => window.__skyrest!.render()); // must not throw while lost
  await page.evaluate(() => (window as unknown as { __lc: WEBGL_lose_context }).__lc.restoreContext());
  await expect(canvas).toHaveAttribute('data-context', 'ok');
  const lit = await page.evaluate(() => {
    const h = window.__skyrest!;
    h.render();
    const c = document.querySelector('canvas.stage') as HTMLCanvasElement;
    const img = new Image();
    return new Promise<number>((res) => {
      img.onload = () => {
        const k = document.createElement('canvas');
        k.width = 64;
        k.height = 64;
        const g = k.getContext('2d')!;
        g.drawImage(img, 0, 0, 64, 64);
        const d = g.getImageData(0, 0, 64, 64).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) sum += d[i]! + d[i + 1]! + d[i + 2]!;
        res(sum / (64 * 64 * 3));
      };
      img.src = c.toDataURL('image/png');
    });
  });
  expect(lit, 'frame after restore is drawn (mean channel value)').toBeGreaterThan(40);
  await expect(canvas).toHaveAttribute('data-post', 'bloom');
});
