import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { guard, seedBag, fillGoodCard, fillContact, fillAddress } from './helpers.js';

const BAG = [{ slug: 'amethyst', format: 'jar', qty: 1 }, { slug: 'citrine', format: 'bag', qty: 2 }]; // $95 + $44 = $139

test.beforeEach(async ({ page }) => {
  await seedBag(page, BAG);
  await page.goto('/checkout.html');
});

test('shows the preview notice and every fulfilment and payment option', async ({ page }) => {
  await expect(page.getByRole('note')).toContainText('No card will be charged');
  for (const v of ['delivery', 'shipping', 'pickup']) await expect(page.locator(`input[name=ful][value=${v}]`)).toHaveCount(1);
  for (const v of ['credit', 'debit', 'gift', 'person']) await expect(page.locator(`input[name=pay][value=${v}]`)).toHaveCount(1);
  for (const v of ['full', 'over-time']) await expect(page.locator(`input[name=plan][value=${v}]`)).toHaveCount(1);
});

test('pay in person is disabled for shipping, with the reason shown, and cleared if chosen first', async ({ page }) => {
  await page.check('input[name=ful][value=pickup]');
  await page.check('input[name=pay][value=person]');
  await expect(page.locator('[data-person-info]')).toContainText('when you collect');
  await page.check('input[name=ful][value=shipping]');
  await expect(page.locator('input[name=pay][value=person]')).toBeDisabled();
  await expect(page.locator('input[name=pay][value=person]')).not.toBeChecked();
  await expect(page.getByText('Not available for shipped orders')).toBeVisible();
  await expect(page.locator('#pay-err')).toContainText('isn’t available for shipping');
  await page.check('input[name=ful][value=delivery]');
  await expect(page.locator('input[name=pay][value=person]')).toBeEnabled();
});

test('fees, free thresholds, and the over-time schedule reconcile', async ({ page }) => {
  // $139 subtotal: delivery and shipping are both waived.
  await page.check('input[name=ful][value=shipping]');
  await expect(page.locator('#order-summary .sum-rows')).toContainText('$8.00Free');
  await expect(page.locator('#order-summary .total dd')).toHaveText('$139.00');
  await page.check('input[name=plan][value=over-time]');
  const parts = await page.locator('[data-schedule-list] dd').allTextContents();
  expect(parts).toEqual(['$34.75', '$34.75', '$34.75', '$34.75']);
  await expect(page.locator('[data-place]')).toHaveText('Place order · $34.75 today');
  // A small bag pays the delivery fee, and 4 payments still sum exactly.
  await seedBag(page, [{ slug: 'selenite', format: 'bag', qty: 1 }]); // $12
  await page.goto('/checkout.html');
  await page.check('input[name=ful][value=delivery]');
  await page.check('input[name=plan][value=over-time]');
  await expect(page.locator('#order-summary .total dd')).toHaveText('$17.00');
  const p2 = (await page.locator('[data-schedule-list] dd').allTextContents()).map((s) => Math.round(Number(s.slice(1)) * 100));
  expect(p2.reduce((a, b) => a + b, 0)).toBe(1700);
});

test('submitting empty lists every problem, links focus the field', async ({ page }) => {
  await page.locator('[data-place]').click();
  const summary = page.locator('.error-summary');
  await expect(summary).toBeVisible();
  await expect(summary.getByRole('heading')).toHaveText(/Please fix 4 things/);
  await expect(page.locator('[data-errors]')).toBeFocused();
  await summary.getByRole('link', { name: /Email/ }).click();
  await expect(page.locator('#email')).toBeFocused();
});

test('card validation: bad number, expired date, Amex CVC length', async ({ page }) => {
  await page.check('input[name=pay][value=credit]');
  await expect(page.locator('[data-card-legend]')).toHaveText('Credit card details');
  await page.fill('#cc-number', '4242424242424241');
  await page.locator('#cc-number').blur();
  await expect(page.locator('#cc-number-err')).toHaveText('That card number doesn’t look right. Check the digits.');
  await page.fill('#cc-number', '378282246310005');
  await expect(page.locator('#cc-number')).toHaveValue('3782 822463 10005');
  await expect(page.locator('.brand-badge')).toHaveText('Amex');
  await expect(page.locator('#cc-number-err')).toBeHidden();
  await page.fill('#cc-exp', '0120');
  await page.locator('#cc-exp').blur();
  await expect(page.locator('#cc-exp-err')).toHaveText('That card has expired.');
  await page.fill('#cc-csc', '123');
  await page.locator('#cc-csc').blur();
  await expect(page.locator('#cc-csc-err')).toHaveText('Enter the 4-digit code on the front.');
  await page.check('input[name=pay][value=debit]');
  await expect(page.locator('[data-card-legend]')).toHaveText('Debit card details');
});

const COMBOS = [
  ['shipping', 'credit', 'full'],
  ['delivery', 'debit', 'over-time'],
  ['pickup', 'gift', 'full'],
  ['pickup', 'person', 'over-time'],
  ['delivery', 'person', 'full'],
];
for (const [ful, pay, plan] of COMBOS) {
  test(`places an order: ${ful} · ${pay} · ${plan}`, async ({ page }) => {
    const g = guard(page);
    await fillContact(page);
    await page.check(`input[name=ful][value=${ful}]`);
    if (ful !== 'pickup') await fillAddress(page);
    await page.check(`input[name=pay][value=${pay}]`);
    if (pay === 'credit' || pay === 'debit') await fillGoodCard(page);
    if (pay === 'gift') { await page.fill('#gift-code', '1234567890123456'); await page.fill('#gift-pin', '4321'); }
    await page.check(`input[name=plan][value=${plan}]`);
    await page.locator('[data-place]').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thank you, Ava!');
    await expect(page.locator('.order-no')).toHaveText(/^Order MC-[2-9A-HJ-NP-Z]{6}$/);
    await expect(page.locator('.confirm')).toContainText('nothing was charged');
    if (pay === 'credit') await expect(page.locator('.recap')).toContainText('Credit card · Visa ending 4242');
    if (plan === 'over-time') await expect(page.locator('.recap')).toContainText('4 payments of about $34.75 · $34.75 today');
    expect(await page.evaluate(() => localStorage.getItem('mc.bag.v1'))).toBe('[]');
    // Card details never persist anywhere in the browser.
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    expect(stored).not.toContain('4242');
    g.check();
  });
}

test('empty bag shows a way back to the shop', async ({ page }) => {
  await seedBag(page, []);
  await page.goto('/checkout.html');
  await expect(page.getByText('Your bag is empty.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shop crystals' }).last()).toBeVisible();
});

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const [name, url, theme] of [
    ['home', '/', 'light'], ['home dark', '/', 'dark'], ['product', '/product.html?c=rose-quartz', 'light'],
    ['product dark', '/product.html?c=black-tourmaline', 'dark'], ['checkout', '/checkout.html', 'light'],
    ['checkout dark', '/checkout.html', 'dark'], ['credits', '/credits.html', 'light'],
  ]) {
    test(name, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(url);
      if (url === '/checkout.html') {
        await page.check('input[name=ful][value=shipping]');
        await page.check('input[name=pay][value=credit]');
        await page.check('input[name=plan][value=over-time]');
        await page.locator('[data-place]').click();
      }
      await page.waitForLoadState('networkidle');
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});

test('keyboard only: open bag drawer, trap focus, close back to opener', async ({ page }) => {
  await page.goto('/');
  await page.locator('.bag-btn').focus();
  await page.keyboard.press('Enter');
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#bag-drawer'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.bag-btn')).toBeFocused();
});

test.describe('responsive: no horizontal scroll, CTA above the fold', () => {
  for (const w of [375, 768, 1024, 1440, 1920]) {
    test(`${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: w < 768 ? 812 : 900 });
      for (const url of ['/', '/product.html?c=fluorite', '/checkout.html']) {
        await page.goto(url);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over, `${url} overflows by ${over}px`).toBeLessThanOrEqual(0);
      }
      await page.goto('/');
      const box = await page.getByRole('link', { name: 'Shop crystals' }).first().boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(w < 768 ? 812 : 900);
    });
  }
});
