import { test, expect } from '@playwright/test';
import { CRYSTALS, FORMATS } from '../../site/data/crystals.js';
import { guard, seedBag } from './helpers.js';

const usd = (c) => `$${(c / 100).toLocaleString('en-US')}`;

test('home: title, meanings, and every crystal in the grid with its from-price', async ({ page }) => {
  const g = guard(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crystals, chosen by hand and explained simply.');
  await expect(page.locator('.meaning-row')).toHaveCount(CRYSTALS.length);
  await expect(page.locator('[data-grid] > li')).toHaveCount(CRYSTALS.length);
  for (const c of CRYSTALS) {
    const card = page.locator(`[data-grid] > li[data-slug="${c.slug}"]`);
    await expect(card.getByRole('heading')).toHaveText(c.name);
    await expect(card.locator('.price')).toHaveText(`From ${usd(Math.min(...Object.values(c.prices)))}`);
    await expect(card.locator('img')).toHaveJSProperty('complete', true);
  }
  // Every photo actually loaded (no broken fallbacks).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
  expect(await page.locator('.frame.is-broken').count()).toBe(0);
  g.check();
});

test('home: both the picture and the name open the product page', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-grid] li[data-slug="labradorite"] .frame').click({ force: true });
  await expect(page).toHaveURL(/product\.html\?c=labradorite$/);
  await page.goBack();
  await page.locator('[data-grid] li[data-slug="carnelian"]').getByRole('link', { name: 'Carnelian' }).click();
  await expect(page).toHaveURL(/c=carnelian$/);
  await page.goto('/');
  await page.locator('.meaning-row', { hasText: 'Lapis Lazuli' }).click();
  await expect(page).toHaveURL(/c=lapis-lazuli$/);
});

test('home: intention filter narrows the grid and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Sleep/ }).click();
  const sleepy = CRYSTALS.filter((c) => c.tags.includes('Sleep'));
  await expect(page.locator('[data-grid] > li:not([hidden])')).toHaveCount(sleepy.length);
  await expect(page.locator('[data-status]')).toHaveText(`${sleepy.length} crystals for Sleep`);
  await expect(page).toHaveURL(/#shop\?i=sleep$/);
  await page.reload();
  await expect(page.locator('[data-grid] > li:not([hidden])')).toHaveCount(sleepy.length);
  await page.getByRole('button', { name: /^All/ }).click();
  await expect(page.locator('[data-grid] > li:not([hidden])')).toHaveCount(CRYSTALS.length);
});

for (const c of CRYSTALS) {
  test(`product: ${c.name} offers all three formats with their prices`, async ({ page }) => {
    const g = guard(page);
    await page.goto(`/product.html?c=${c.slug}`);
    await expect(page).toHaveTitle(`${c.name} · Melody’s Crystals`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(c.name);
    for (const f of FORMATS) {
      await page.check(`input[name=format][value=${f.id}]`);
      await expect(page.locator('[data-price]')).toHaveText(usd(c.prices[f.id]));
      await expect(page.locator('[data-add]')).toHaveText(`Add to bag · ${usd(c.prices[f.id])}`);
      await expect(page.locator('.tile', { has: page.locator(`input[value=${f.id}]`) }).locator('.price')).toHaveText(usd(c.prices[f.id]));
    }
    g.check();
  });
}

test('product: quantity, add to bag, drawer and badge', async ({ page }) => {
  const g = guard(page);
  await page.goto('/product.html?c=amethyst');
  await page.check('input[name=format][value=jar]');
  await expect(page.locator('.gallery .badge')).toHaveText('Jar of big crystals');
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(page.locator('[data-add]')).toHaveText('Add to bag · $285');
  await page.locator('[data-add]').click();
  const drawer = page.getByRole('dialog', { name: /Your bag/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('heading', { level: 2 })).toHaveText('Your bag (3)');
  await expect(drawer.locator('.line .lt')).toHaveText('$285.00');
  await expect(page.locator('.bag-count')).toHaveText('3');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(page.locator('[data-add]')).toBeFocused();
  // Quantity caps at 10 with a note.
  for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Increase quantity' }).click({ force: true });
  await expect(page.locator('[data-qty]')).toHaveText('10');
  await expect(page.locator('[data-qty-note]')).toHaveText('Need more? Message Melody.');
  g.check();
});

test('product: unknown crystal shows a way back', async ({ page }) => {
  await page.goto('/product.html?c=unobtainium');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We couldn’t find that crystal.');
  await page.getByRole('link', { name: 'Back to the shop' }).click();
  await expect(page).toHaveURL(/index\.html#shop$/);
});

test('drawer: remove with undo, and empty state', async ({ page }) => {
  await seedBag(page, [{ slug: 'citrine', format: 'bag', qty: 2 }]);
  await page.goto('/');
  await page.locator('.bag-btn').click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('button', { name: /Remove/ }).click();
  await expect(drawer.getByText('Your bag is empty.')).toBeVisible();
  await drawer.getByRole('button', { name: 'Undo' }).click();
  await expect(drawer.locator('.line')).toHaveCount(1);
  await expect(drawer.locator('.line .val')).toHaveText('2');
});

test('buy now goes straight to checkout with the item', async ({ page }) => {
  await page.goto('/product.html?c=selenite');
  await page.check('input[name=format][value=big]');
  await page.getByRole('button', { name: 'Buy now' }).click();
  await expect(page).toHaveURL(/checkout\.html$/);
  await expect(page.locator('#order-summary .line')).toHaveCount(1);
});

test('F-001: a corrupt saved bag never breaks the shop', async ({ page }) => {
  const g = guard(page);
  for (const bad of ['[null]', '[1,"x",{"slug":"nope"}]', '{not json', '{"a":1}']) {
    await page.goto('/credits.html');
    await page.evaluate((v) => localStorage.setItem('mc.bag.v1', v), bad);
    await page.goto('/');
    await expect(page.locator('[data-grid] > li')).toHaveCount(CRYSTALS.length);
    await page.goto('/product.html?c=amethyst');
    await page.locator('[data-add]').click();
    await expect(page.locator('.bag-count')).toHaveText('1');
  }
  g.check();
});

test('F-002: when storage writes fail, the bag still works for the session and says so', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.goto('/product.html?c=citrine');
  await page.locator('[data-add]').click();
  await expect(page.locator('.bag-count')).toHaveText('1');
  await expect(page.getByRole('dialog').locator('.line')).toHaveCount(1);
  await expect(page.getByText('Your bag won’t be saved after you close this tab.')).toBeVisible();
});

test('F-003/F-004: undo lives in the drawer, keyboard-reachable; Keep shopping is never blocked', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await seedBag(page, [{ slug: 'citrine', format: 'bag', qty: 1 }, { slug: 'amethyst', format: 'big', qty: 1 }]);
  await page.goto('/');
  await page.locator('.bag-btn').click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('button', { name: /Remove Citrine/ }).click();
  await expect(drawer.getByRole('button', { name: 'Undo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(drawer.locator('.line')).toHaveCount(2);
  await drawer.getByRole('button', { name: /Remove Citrine/ }).click();
  await page.waitForTimeout(5300);
  await expect(drawer.getByRole('button', { name: 'Undo' })).toHaveCount(0);
  await drawer.getByRole('button', { name: 'Keep shopping' }).click();
  await expect(drawer).toBeHidden();
});

test('F-006: checkout updates when the bag changes in another tab', async ({ page, context }) => {
  await seedBag(page, [{ slug: 'selenite', format: 'bag', qty: 1 }]);
  await page.goto('/checkout.html');
  await expect(page.locator('[data-place]')).toHaveText('Place order · $12.00');
  const other = await context.newPage();
  await other.goto('/product.html?c=citrine');
  await other.check('input[name=format][value=jar]');
  await other.locator('[data-add]').click();
  await expect(page.locator('[data-place]')).toHaveText('Place order · $162.00');
  await expect(page.locator('#order-summary .line')).toHaveCount(2);
});
