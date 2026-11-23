// tests/e2e/support/app.ts — helpers over window.__constellation (the frozen hook + WO-003's additions).
import type { Page } from '@playwright/test';
import { boot, expect } from './harness.ts';

export type State = NonNullable<ReturnType<NonNullable<NonNullable<Window['__constellation']>['state']>>>;

/** Fresh seed, intro finished. */
export async function open(page: Page, url = './?seed=1'): Promise<void> {
  await boot(page, url);
  await page.waitForFunction(() => window.__constellation?.state?.().introDone === true, undefined, { timeout: 20_000 });
  await page.waitForFunction(() => document.body.classList.contains('show-tools'));
}

export async function state(page: Page): Promise<State> {
  return page.evaluate(() => window.__constellation!.state!());
}

export async function idle(page: Page): Promise<void> {
  await page.evaluate(() => window.__constellation!.idle());
}

/** Wait a couple of rendered frames (overlay is placed every 2nd frame). */
export async function frames(page: Page, n = 4): Promise<void> {
  await page.evaluate(
    (k) =>
      new Promise<void>((resolve) => {
        let i = 0;
        const tick = () => (++i >= k ? resolve() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      }),
    n,
  );
}

export async function pause(page: Page): Promise<number> {
  return page.evaluate(() => {
    const c = window.__constellation!.clock!;
    c.pause();
    return c.now();
  });
}

export async function setClock(page: Page, ms: number): Promise<void> {
  await page.evaluate((t) => window.__constellation!.clock!.set(t), ms);
  await frames(page, 4);
}

export async function resume(page: Page): Promise<void> {
  await page.evaluate(() => window.__constellation!.clock!.resume());
}

export async function nodePoint(page: Page, label: string): Promise<{ x: number; y: number }> {
  const p = await page.evaluate((l) => {
    const h = window.__constellation!;
    const id = h.nodeIdByLabel(l);
    return id ? h.screenPosition(id) : null;
  }, label);
  expect(p, `${label} on screen`).not.toBeNull();
  return p!;
}

/** Labels never overlap (polish 3): pairwise rectangle test. */
export function overlaps(rects: State['labelRects']): string[] {
  const bad: string[] = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]!;
      const b = rects[j]!;
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) bad.push(`${a.id}×${b.id}`);
    }
  }
  return bad;
}

/** Every placed overlay item (labels, chips, badges…) pairwise clear of the others. */
export function overlayOverlaps(s: State): string[] {
  expect(s.overlayRects?.length ?? 0, 'overlay rects exposed').toBeGreaterThan(10);
  return overlaps((s.overlayRects ?? []).map((r) => ({ id: `${r.kind}:${r.id}`, x: r.x, y: r.y, w: r.w, h: r.h })));
}

/** Star footprints (core, or pathway / variable ring) that a rectangle of the given kind touches. */
export function coresUnder(s: State, kind: string): string[] {
  const hit: string[] = [];
  const items = (s.overlayRects ?? []).filter((o) => o.kind === kind);
  expect(items.length, `a placed ${kind}`).toBeGreaterThan(0);
  expect(s.coreCircles?.length ?? 0, 'star footprints exposed').toBeGreaterThan(10);
  for (const r of items) {
    for (const c of s.coreCircles ?? []) {
      const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
      const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
      if (Math.hypot(c.x - nx, c.y - ny) < c.r) hit.push(`${r.id}@${c.id}`);
    }
  }
  return hit;
}
