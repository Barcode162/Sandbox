// WO-004 budget (plan.md Performance budgets): heap flat ±10 % over a 60 s scripted fight (hot loops allocate nothing
// that survives a GC). Its own file: precise memory info + an exposed gc need their own browser flags.
import { boot, expect, test, writeEvidence } from './support/harness.ts';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] } });

test('[LP4] heap stays flat (±10 %) over a 60 s scripted fight', async ({ page }) => {
  test.setTimeout(240_000);
  await boot(page);
  const heap = await page.evaluate(() => {
    const h = window.__skyrest!;
    const gc = (globalThis as unknown as { gc?: () => void }).gc;
    const mem = () => {
      gc?.();
      return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
    };
    h.setManual(true);
    h.skipTitle();
    h.setFlags({ heroInvulnerable: true });
    const fight = (seconds: number) => {
      for (let s = 0; s < seconds; s++) {
        // Strike, roll, move: a busy second of play, one render per second of sim.
        h.inject({ attack: true }, 20);
        h.inject({ moveX: 1 }, 10);
        h.inject({ dodge: true, moveY: -1 }, 2);
        h.inject({ attack: true }, 28);
        h.step(60);
        const g = h.snapshot().golem;
        if (g.action === 'dying' || g.action === 'dead') h.setSeed(20261125), h.skipTitle(), h.setFlags({ heroInvulnerable: true });
      }
    };
    fight(10); // warm caches, compile shaders
    const before = mem();
    fight(60);
    const after = mem();
    return { before, after, ratio: after / before };
  });
  writeEvidence('loop/heap.json', heap);
  expect(heap.ratio).toBeGreaterThan(0.9);
  expect(heap.ratio).toBeLessThan(1.1);
});
