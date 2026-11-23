import { expect } from '@playwright/test';

/** Fail the test on any console error, page error, or request to a host other than ours / Google Fonts. */
export function guard(page) {
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname) && u.protocol !== 'data:') problems.push(`external request: ${r.url()}`);
  });
  return { check: () => expect(problems, problems.join('\n')).toEqual([]) };
}

export async function seedBag(page, items) {
  await page.goto('/credits.html');
  await page.evaluate((v) => localStorage.setItem('mc.bag.v1', JSON.stringify(v)), items);
}

/** Fill a card form that passes every check. */
export async function fillGoodCard(page) {
  await page.fill('#cc-number', '4242424242424242');
  await page.fill('#cc-name', 'Ava Stone');
  await page.fill('#cc-exp', '1230');
  await page.fill('#cc-csc', '123');
  await page.fill('#cc-zip', '90210');
}

export async function fillContact(page) {
  await page.fill('#name', 'Ava Stone');
  await page.fill('#email', 'ava@example.com');
}

export async function fillAddress(page) {
  await page.fill('#street', '12 Garden Lane');
  await page.fill('#city', 'Fresno');
  await page.fill('#state', 'ca');
  await page.fill('#zip', '93701');
}
