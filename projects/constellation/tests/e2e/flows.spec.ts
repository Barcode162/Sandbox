// The five flows (plan.md WO-003 [E1]–[E5]) at 1440×900, with the experience-spec frames F1–F12.
import { expect, test } from './support/harness.ts';
import seed from '../../src/seed/memory.json' with { type: 'json' };
import { frames, idle, nodePoint, open, overlaps, pause, resume, setClock, state } from './support/app.ts';

test.describe.configure({ timeout: 120_000 });

const seedLabels: string[] = (seed as { nodes: Array<{ label: string }> }).nodes.map((n) => n.label);

test('[E1] explore: the first frame breathes, hover lights a neighbourhood, select flies and inspects (F1–F3)', async ({ page, scan, shot }) => {
  await open(page);
  // F1: idle open at t = 6000 ms, no input.
  await page.waitForFunction(() => window.__constellation!.clock!.now() >= 6000);
  let s = await state(page);
  expect(s.lens).toBe('cook');
  expect(s.visibleEdges).toBe(100);
  expect(s.statsText).toBe('88 lights · 100 lines');
  expect(s.labelsShown).toBeGreaterThan(15);
  expect(s.labelsShown).toBeLessThanOrEqual(40);
  expect(s.ghostState).toBe('rest');
  expect(s.nanPositions).toBe(0);
  expect(overlaps(s.labelRects)).toEqual([]);
  // The hub every later frame is about carries its name at the overview (F-031).
  await expect(page.locator('.lbl.on', { hasText: /^Temperature$/ })).toHaveCount(1);
  await expect(page.locator('#stats')).toHaveText('88 lights · 100 lines');
  await expect(page.locator('#stage')).toHaveAttribute('aria-label', 'Constellation memory, Cook lens, 88 lights, 100 lines.');
  await shot('F1-idle-1440');
  // It breathes before any input: two frames 1.6 s apart differ.
  const a = await page.locator('#stage canvas').screenshot();
  await page.waitForTimeout(1600);
  const b = await page.locator('#stage canvas').screenshot();
  expect(Buffer.compare(a, b)).not.toBe(0);

  // F2: hover Temperature.
  const t = await nodePoint(page, 'Temperature');
  await page.mouse.move(t.x, t.y);
  await page.waitForTimeout(260);
  s = await state(page);
  expect(s.hovered).toBe('temperature');
  expect(s.dimOthers).toBeCloseTo(0.55, 2);
  const card = page.locator('#hovercard');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Temperature');
  await expect(card).toContainText('20 °C');
  await expect(card).toContainText('+2 other views');
  await shot('F2-hover-1440');

  // F3: click → fly to distance 70, inspector with the facet table.
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(1000);
  await idle(page);
  s = await state(page);
  expect(s.selected).toBe('temperature');
  expect(Math.abs(s.cameraDistance - 70)).toBeLessThan(2);
  const insp = page.locator('#inspector');
  await expect(insp).toBeVisible();
  await expect(insp.locator('h2')).toHaveText('Temperature');
  await expect(insp.locator('.disagree')).toHaveText('3 views disagree');
  await expect(insp.locator('table.facets tbody tr')).toHaveCount(3);
  await expect(insp.locator('tr.active')).toContainText('Cook');
  await expect(insp.locator('tr.active')).toContainText('20 °C');
  await expect(insp).toContainText('Hidden in this lens: 2 lines (Physicist)');
  await expect(insp.locator('.relgroups')).toHaveText('relates 8 · read by 2');
  // The selection sits in the free area left of the inspector (polish 7).
  const p = await nodePoint(page, 'Temperature');
  const box = (await insp.boundingBox())!;
  expect(Math.abs(p.x - box.x / 2)).toBeLessThan(30);
  await page.mouse.move(10, 880);
  await shot('F3-inspect-1440');
  await scan();
});

test('[E2] perspective: Cook → Physicist morphs in ≤ 1.2 s and the ghosts show the other truths (F4, F5)', async ({ page, scan, shot }) => {
  await open(page);
  const t0 = await pause(page);
  await page.keyboard.press('2');
  await setClock(page, t0 + 500);
  let s = await state(page);
  expect(s.morphT).toBeCloseTo(0.5, 1);
  expect(s.ghostState).toBe('expanded');
  await shot('F4-morph-midway-1440');
  await setClock(page, t0 + 1400);
  s = await state(page);
  expect(s.lens).toBe('physicist');
  expect(s.morphT).toBeNull();
  expect(s.visibleEdges).toBe(102);
  expect(s.ghostState).toBe('expanded');
  await expect(page.locator('#stats')).toHaveText('88 lights · 102 lines');
  await expect(page.locator('.lens-pill[aria-pressed="true"]')).toContainText('Physicist');
  // Ghost chips around Temperature read the other lenses, with units.
  const chips = (await page.locator('#stage .chip.on').allTextContents()).map((t) => t.replace(/\u00a0/g, ' '));
  expect(chips).toContain('20 °C');
  expect(chips).toContain('293 K');
  await shot('F5-morph-settled-1440');
  // Retracts after the held window.
  await setClock(page, t0 + 4000);
  expect((await state(page)).ghostState).toBe('rest');
  await resume(page);
  // Timed morph back to Cook on the real clock.
  const ms = await page.evaluate(async () => {
    const t = performance.now();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    await window.__constellation!.idle();
    return performance.now() - t;
  });
  expect(ms).toBeLessThanOrEqual(1200 + 150);
  expect((await state(page)).visibleEdges).toBe(100);
  await scan();
});

test('[E3] route + learn: A → Z races 25 hops against 3, learning draws a line that survives reload (F6–F8)', async ({ page, scan, shot }) => {
  await open(page);
  await page.keyboard.press('r');
  await expect(page.locator('#drawer')).toBeVisible();
  const t0 = await pause(page);
  await page.getByRole('button', { name: 'Try the featured route: A → Z' }).click();
  await setClock(page, t0 + 600);
  let s = await state(page);
  expect(s.route).toEqual({ declared: 25, shortest: 3, chip: '25 hops → 3 hops · 88% shorter' });
  const heads = Object.fromEntries(s.trailHeads.map((h) => [h.role, h]));
  expect(heads.shortest).toEqual({ role: 'shortest', hops: 3, head: 3 });
  expect(heads.declared).toEqual({ role: 'declared', hops: 25, head: 3 });
  await expect(page.locator('#stage .trailchip.on', { hasText: 'Shortest · 3 hops' })).toHaveCount(1);
  await shot('F6-route-race-1440');
  await setClock(page, t0 + 4400);
  s = await state(page);
  expect(s.trailHeads.find((h) => h.role === 'declared')?.head).toBe(25);
  await expect(page.locator('#route-verdict')).toHaveText('25 hops → 3 hops · 88% shorter');
  await expect(page.locator('.route-row').first()).toContainText('3 hops');
  await expect(page.locator('.route-row').first()).toContainText('A → F → X → Z');
  await expect(page.locator('.route-row').nth(1)).toContainText('A → B → C → … → X → Y → Z');
  const learn = page.getByRole('button', { name: 'Learn shortcut A → Z' });
  await expect(learn).toBeVisible();
  // Waypoints are named on the ring (F-015), and the whole race is in view (F-014).
  const named = (await state(page)).labelRects.map((r) => r.id);
  for (const id of ['road-a', 'road-f', 'road-x', 'road-z']) expect(named).toContain(id);
  await shot('F7-route-complete-1440');
  await scan();

  const t1 = await page.evaluate(() => window.__constellation!.clock!.now());
  await learn.click();
  await setClock(page, t1 + 1000);
  s = await state(page);
  expect(s.visibleEdges).toBe(101);
  await expect(page.locator('#stats')).toHaveText('88 lights · 101 lines');
  await expect(page.locator('.toast', { hasText: "Learned: A ↔ Z. Next time it's one hop." })).toBeVisible();
  await expect(page.locator('#route-verdict')).toHaveText('25 hops → 1 hop · 96% shorter');
  await expect(page.getByRole('button', { name: 'Learn shortcut A → Z' })).toHaveAttribute('aria-disabled', 'true');
  // The toast sits under the top bar, clear of the learned line (F-017).
  const toastBox = (await page.locator('.toast', { hasText: 'Learned' }).boundingBox())!;
  const a = await nodePoint(page, 'A');
  const z = await nodePoint(page, 'Z');
  for (const p of [a, z]) expect(p.y < toastBox.y || p.y > toastBox.y + toastBox.height || p.x < toastBox.x || p.x > toastBox.x + toastBox.width).toBe(true);
  await shot('F8-shortcut-learned-1440');
  await resume(page);

  // Undo forgets the line and the drawer goes back to the 3-hop truth (F-018).
  await page.locator('.toast', { hasText: 'Learned' }).getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.toast', { hasText: 'Forgot the shortcut A ↔ Z.' })).toBeVisible();
  await expect(page.locator('#route-verdict')).toHaveText('25 hops → 3 hops · 88% shorter');
  await expect(page.getByRole('button', { name: 'Learn shortcut A → Z' })).not.toHaveAttribute('aria-disabled', 'true');
  await idle(page);
  expect((await state(page)).visibleEdges).toBe(100);
  await page.getByRole('button', { name: 'Learn shortcut A → Z' }).click();
  await expect(page.locator('#route-verdict')).toHaveText('25 hops → 1 hop · 96% shorter');

  // Persisted: reload without ?seed and the line is still there.
  await page.waitForTimeout(700);
  await page.goto('./');
  await page.waitForFunction(() => window.__constellation?.state?.().introDone === true, undefined, { timeout: 20_000 });
  expect((await state(page)).visibleEdges).toBe(101);
  await expect(page.locator('.toast', { hasText: 'Welcome back. 88 lights' })).toBeVisible({ timeout: 6000 });
});

test('[E4] run pathway: Simmer loops twice under Cook and four times under Physicist (F9, F10)', async ({ page, scan, shot }) => {
  await open(page);
  await page.keyboard.press('p');
  const card = page.locator('.pcard', { hasText: 'Simmer until done' });
  await expect(card).toContainText('while loop');
  await card.getByRole('button', { name: /^Run/ }).click();
  // F9: freeze the clock at trace visit 7 (the 2nd check of the while).
  await page.waitForFunction(
    () => {
      const h = window.__constellation!;
      if (h.state!().traceIndex >= 6) {
        h.clock!.pause();
        return true;
      }
      return false;
    },
    undefined,
    { polling: 'raf', timeout: 30_000 },
  );
  await frames(page, 6);
  let s = await state(page);
  expect(s.traceIndex).toBe(6);
  expect(s.loopBadge).toBe(1);
  await expect(page.locator('#stage .condchip.on')).toHaveText('60 °C < 100 °C → true');
  await expect(page.locator('#stage .badge.on')).toHaveText('×1');
  await expect(card.locator('li.cur')).toContainText('while heat < Boiling Point · 60 °C < 100 °C → true');
  await shot('F9-pulse-mid-loop-1440');
  await resume(page);
  await page.waitForFunction(() => Object.keys(window.__constellation!.state!().runs).length === 1, undefined, { timeout: 30_000 });
  s = await state(page);
  expect(s.runs).toEqual({ cook: 'Done after 2 stirs · heat 100 °C' });
  await expect(card.locator('.result .out')).toHaveText('Done after 2 stirs · heat 100 °C');
  await expect(card.locator('.result .why')).toHaveText('Cook reads Temperature as 20 °C, Boiling Point as 100 °C and Flame Step as 40 °C, so the loop ran twice.');

  // Switch lens, re-run: a different, explained result.
  await page.keyboard.press('2');
  await idle(page);
  await card.getByRole('button', { name: /^Run/ }).click();
  await page.waitForFunction(() => Object.keys(window.__constellation!.state!().runs).length === 2, undefined, { timeout: 40_000 });
  await idle(page);
  s = await state(page);
  expect(s.runs.physicist).toBe('Done after 4 stirs · heat 373 K');
  expect(s.loopBadge).toBe(4);
  await expect(card.locator('.result .out')).toHaveText('Done after 4 stirs · heat 373 K');
  await expect(card.locator('.result .compare')).toHaveText('Cook: 2 stirs · Physicist: 4 stirs. Same pathway, different truths.');
  await expect(page.locator('#stage .badge.on')).toHaveText('×4');
  await shot('F10-pathway-result-1440');
  await scan();

  // The if/else pathway decides differently per lens too.
  const serve = page.locator('.pcard', { hasText: 'What should I do with it?' });
  await serve.getByRole('button', { name: /^Run/ }).click();
  await expect(serve.locator('.result .out')).toHaveText('Warm it up.', { timeout: 20_000 });
});

test('[E5] store + find: store Tea, link it to Temperature, reload, search finds it (F12)', async ({ page, scan, shot }) => {
  await open(page);
  await page.keyboard.press('n');
  const sheet = page.locator('dialog.sheet');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Store it' }).click();
  await expect(sheet.locator('#store-name-err')).toHaveText('Give it a name, even one word.');
  await scan();
  await sheet.getByLabel('Name').fill('Tea');
  await sheet.getByLabel('Value under Cook').fill('hot');
  await sheet.getByLabel('Same in every lens').uncheck();
  await sheet.getByLabel('Link to').fill('Temperature');
  const t0 = await pause(page);
  await sheet.getByRole('button', { name: 'Store it' }).click();
  await expect(sheet).toHaveCount(0);
  await setClock(page, t0 + 900);
  const s = await state(page);
  expect(s.statsText).toBe('89 lights · 101 lines');
  await expect(page.locator('.toast', { hasText: 'Stored "Tea" · linked to Temperature.' })).toBeVisible();
  // Born clear of its link target (F-024).
  const tea = await nodePoint(page, 'Tea');
  const temp = await nodePoint(page, 'Temperature');
  expect(Math.hypot(tea.x - temp.x, tea.y - temp.y)).toBeGreaterThan(24);
  // …and clear of every other light on screen, not only its link target (F-024 r2).
  const nearest = await page.evaluate((labels: string[]) => {
    const h = window.__constellation!;
    const teaId = h.nodeIdByLabel('Tea')!;
    const p = h.screenPosition(teaId)!;
    let best = { d: Infinity, label: '' };
    for (const label of labels) {
      const id = h.nodeIdByLabel(label);
      if (!id || id === teaId) continue;
      const q = h.screenPosition(id);
      if (!q) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < best.d) best = { d, label };
    }
    return best;
  }, seedLabels);
  expect(nearest.d, `Tea is ${nearest.d.toFixed(1)} px from ${nearest.label}`).toBeGreaterThan(12);
  await shot('F12-stored-1440');
  await resume(page);
  // "Saved" appears only after the browser accepted the write (F-001).
  await expect(page.locator('#saved')).toHaveClass(/on/, { timeout: 3000 });
  await expect(page.locator('#saved')).toHaveText('Saved');
  const teaPos = await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 700));
    const doc = JSON.parse(localStorage.getItem('constellation.memory.v1') ?? '{}');
    const id = window.__constellation!.nodeIdByLabel('Tea');
    return doc.perspectives.find((p: { id: string }) => p.id === 'cook').positions[id!];
  });
  expect(teaPos).toBeTruthy();

  await page.goto('./');
  await page.waitForFunction(() => window.__constellation?.state?.().introDone === true, undefined, { timeout: 20_000 });
  const after = await page.evaluate(() => {
    const doc = JSON.parse(localStorage.getItem('constellation.memory.v1') ?? '{}');
    const id = window.__constellation!.nodeIdByLabel('Tea');
    return { id, pos: doc.perspectives.find((p: { id: string }) => p.id === 'cook').positions[id!] };
  });
  expect(after.id).not.toBeNull();
  expect(Math.abs(after.pos.x - teaPos.x)).toBeLessThan(0.01);
  await expect(page.locator('.toast', { hasText: 'Welcome back. 89 lights. The 1 you stored is where you left it.' })).toBeVisible({ timeout: 6000 });
  await page.keyboard.press('/');
  await page.keyboard.type('tea');
  // "tea" is also inside "Steam" (substring match), so Tea is one of the depth-0 matches.
  await page.waitForFunction(() => (window.__constellation!.state!().activationCounts?.[0] ?? 0) >= 1);
  await expect(page.locator('#drawer .rlist button', { hasText: /^Tea$/ })).toBeVisible();
  await page.locator('#drawer .rlist button', { hasText: /^Tea$/ }).click();
  await expect(page.locator('#inspector h2')).toHaveText('Tea');
  await expect(page.locator('#inspector tr.active td')).toContainText('hot');
});
