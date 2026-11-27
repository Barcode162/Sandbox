// Remediation evidence, regenerated from the live build (F-023): every screenshot a resolution in the mission's
// findings.jsonl cites is re-shot here at its cited path, so no resolution points at a file that isn't on disk.
// Also writes the round-2 proofs: 3× crops of the hero's head from behind (F-011) at the reference aspect and
// on a portrait phone, and the desktop F2 whose arena rim must read as a broken island edge (F-016).
// Run: xvfb-run -a npx playwright test tests/e2e/evidence.spec.ts
import { devices, type Page } from '@playwright/test';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { boot, evidenceDir, expect, test } from './support/harness.ts';
import type { MomentId, Quality, ScreenBox } from '../../src/contracts.ts';

const REFERENCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..',
  'bureau', 'missions', 'M-0004-skyrest-floating-isle-action-demo', 'evidence', 'reference.jpg');

interface Shot { file: string; size: { width: number; height: number }; id: MomentId; quality: Quality; touch?: boolean; crop?: 'hero' | 'head' }

/** Cited by F-008…F-020 (rounds 1) and the round-2 proofs. Paths are relative to the evidence dir. */
const SHOTS: Shot[] = [
  { file: 'wo-002/F2ref-high.jpg', size: { width: 802, height: 917 }, id: 'F2', quality: 'high' },
  { file: 'wo-002/F2desk-high.jpg', size: { width: 1280, height: 720 }, id: 'F2', quality: 'high' },
  { file: 'wo-002/F13-high.jpg', size: { width: 932, height: 430 }, id: 'F13', quality: 'high', touch: true },
  { file: 'wo-003/r1/F2-802x917.jpg', size: { width: 802, height: 917 }, id: 'F2', quality: 'high' },
  { file: 'wo-003/r1/F2-430x932.jpg', size: { width: 430, height: 932 }, id: 'F2', quality: 'low', touch: true },
  { file: 'wo-003/r1/F4-1280x720.jpg', size: { width: 1280, height: 720 }, id: 'F4', quality: 'high' },
  { file: 'wo-003/r1/F7-1280x720.jpg', size: { width: 1280, height: 720 }, id: 'F7', quality: 'high' },
  { file: 'wo-003/r1/F6-1280x720-crop.jpg', size: { width: 1280, height: 720 }, id: 'F6', quality: 'high', crop: 'hero' },
  { file: 'wo-003/r1/F12-430x932.jpg', size: { width: 430, height: 932 }, id: 'F12', quality: 'low', touch: true },
  { file: 'r2/F11-head-802x917-3x.jpg', size: { width: 802, height: 917 }, id: 'F2', quality: 'high', crop: 'head' },
  { file: 'r2/F11-head-430x932-3x.jpg', size: { width: 430, height: 932 }, id: 'F2', quality: 'low', touch: true, crop: 'head' },
  { file: 'r2/F16-F2-desktop-1280x720.jpg', size: { width: 1280, height: 720 }, id: 'F2', quality: 'high' },
];

function save(rel: string, buf: Buffer): string {
  const file = path.join(evidenceDir(), rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, buf);
  return file;
}

/** Crop (x, y, w, h) out of a JPEG and scale it by `k` in the page's 2D canvas (no image library needed). */
async function cropScale(page: Page, jpeg: Buffer, box: { x: number; y: number; w: number; h: number }, k: number): Promise<Buffer> {
  const url = await page.evaluate(async ([src, b, s]) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = Math.round(b.w * s);
    c.height = Math.round(b.h * s);
    const g = c.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, b.x, b.y, b.w, b.h, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  }, [`data:image/jpeg;base64,${jpeg.toString('base64')}`, box, k] as const);
  return Buffer.from(url.split(',')[1]!, 'base64');
}

for (const s of SHOTS) {
  test(`[EV] ${s.file}`, async ({ page: deskPage, browser }) => {
    test.setTimeout(180_000);
    const ctx = s.touch ? await browser.newContext({ ...devices['iPhone 15 Pro Max'], viewport: s.size, deviceScaleFactor: 1 }) : null;
    const page = ctx ? await ctx.newPage() : deskPage;
    const errors: string[] = [];
    if (ctx) page.on('pageerror', (e) => errors.push(String(e)));
    if (!ctx) await page.setViewportSize(s.size);
    await boot(page);
    const { r, hero } = await page.evaluate(([m, q]) => {
      const h = window.__skyrest!;
      h.setQuality(q);
      const res = h.moment(m);
      return { r: res, hero: h.probe().hero };
    }, [s.id, s.quality] as const) as { r: { ok: boolean; note: string }; hero: ScreenBox };
    expect(r.ok, r.note).toBe(true);
    const shot = await page.screenshot({ type: 'jpeg', quality: 80 });
    if (!s.crop) save(s.file, shot);
    else {
      // Head = the top half of the hero's box, at the box's full width (the box includes the sword arc and the head
      // may sit off-centre in it), padded.
      const pad = s.crop === 'head' ? 0.12 : 0.25;
      const H = s.crop === 'head' ? hero.h * 0.5 : hero.h;
      const W = Math.max(H, hero.w);
      const cx = hero.x + hero.w / 2;
      const box = {
        x: Math.max(0, Math.round(cx - (W * (1 + pad)) / 2)), y: Math.max(0, Math.round(hero.y - H * pad * 0.5)),
        w: Math.round(W * (1 + pad)), h: Math.round(H * (1 + pad)),
      };
      box.w = Math.min(box.w, s.size.width - box.x);
      box.h = Math.min(box.h, s.size.height - box.y);
      save(s.file, await cropScale(page, shot, box, s.crop === 'head' ? 3 : 2));
    }
    expect(errors).toEqual([]);
    await ctx?.close();
  });
}

test('[EV] wo-002/F2-side-by-side.jpg (reference | our F2 at 802×917)', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 802, height: 917 });
  await boot(page);
  await page.evaluate(() => {
    window.__skyrest!.setQuality('high');
    window.__skyrest!.moment('F2');
  });
  const ours = await page.screenshot({ type: 'jpeg', quality: 85 });
  expect(existsSync(REFERENCE), REFERENCE).toBe(true);
  const ref = readFileSync(REFERENCE);
  const url = await page.evaluate(async ([a, b]) => {
    const load = async (src: string) => {
      const i = new Image();
      i.src = src;
      await i.decode();
      return i;
    };
    const [ia, ib] = [await load(a), await load(b)];
    const H = 917;
    const wa = Math.round((ia.width * H) / ia.height), wb = Math.round((ib.width * H) / ib.height);
    const c = document.createElement('canvas');
    c.width = wa + 8 + wb;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, H);
    g.drawImage(ia, 0, 0, wa, H);
    g.drawImage(ib, wa + 8, 0, wb, H);
    return c.toDataURL('image/jpeg', 0.82);
  }, [`data:image/jpeg;base64,${ref.toString('base64')}`, `data:image/jpeg;base64,${ours.toString('base64')}`] as const);
  save('wo-002/F2-side-by-side.jpg', Buffer.from(url.split(',')[1]!, 'base64'));
});
