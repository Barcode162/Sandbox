// motion.spec.js — M-0005: every component moves, nothing hides content, reduced motion is respected.
import { test, expect } from '@playwright/test';
import { seedBag } from './helpers.js';

// Inventory ids (design/experience.md §5) by the page they live on.
const INVENTORY = {
  '/': ['skip', 'header', 'nav', 'theme', 'bag', 'badge', 'menu', 'icon', 'frame', 'scrim', 'drawer', 'toast', 'footer',
    'hero-copy', 'trust', 'trio', 'section-head', 'meaning-row', 'chips', 'grid-status', 'card', 'filter', 'steps', 'formats', 'faq'],
  '/product.html?c=amethyst': ['crumbs', 'gallery', 'thumbs', 'buybox', 'price', 'per', 'tile', 'wyg', 'stepper', 'qty-note', 'add', 'buynow', 'details', 'mobile-bar'],
  '/product.html?c=nope': ['not-found'],
  '/checkout.html': ['notice', 'co-step', 'choice'],
  '/credits.html': ['credits'],
};

/** True if el or a descendant has a CSS animation or a transition on transform/opacity/all. */
const moves = (el) => [el, ...el.querySelectorAll('*')].slice(0, 80).some((n) => [null, '::before', '::after'].some((pseudo) => {
  const cs = getComputedStyle(n, pseudo);
  const anim = cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0;
  const tr = parseFloat(cs.transitionDuration) > 0 && /transform|opacity|all/.test(cs.transitionProperty);
  return anim || tr || (!pseudo && (n.dataset.reveal !== undefined || n.parentElement?.dataset.stagger !== undefined));
}));

for (const [url, ids] of Object.entries(INVENTORY)) {
  test(`coverage: every component on ${url} carries motion`, async ({ page }) => {
    if (url === '/checkout.html') await seedBag(page, [{ slug: 'citrine', format: 'bag', qty: 1 }]);
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    for (const id of ids) {
      const found = await page.evaluate(([id, fn]) => {
        const els = [...document.querySelectorAll(`[data-motion="${id}"]`)];
        // eslint-disable-next-line no-new-func
        const m = new Function(`return (${fn})`)();
        return { n: els.length, moving: els.some(m) };
      }, [id, moves.toString()]);
      expect(found.n, `${id} missing on ${url}`).toBeGreaterThan(0);
      expect(found.moving, `${id} has no motion on ${url}`).toBe(true);
    }
  });
}

test('reveal: content below the fold rises in once and never re-hides', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/motion-ready/);
  const card = page.locator('[data-grid] > li').first();
  await expect(card).not.toHaveClass(/is-in/);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/is-in/);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(200);
  await expect(card).toHaveClass(/is-in/);
});

test('reveal failsafe: if the observer never fires, everything shows within 3 s', async ({ page }) => {
  await page.addInitScript(() => { window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }; });
  await page.goto('/');
  await page.waitForTimeout(3300);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal], [data-stagger] > *')].filter((el) => getComputedStyle(el).opacity === '0').length);
  expect(hidden).toBe(0);
});

test('F-001: sections further down still animate in after the first 3 s', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3500);
  const footerKid = page.locator('.footer-grid > *').first();
  await expect(footerKid).not.toHaveClass(/is-in/);
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(footerKid).toHaveClass(/is-in/);
});

for (const [w, h] of [[1440, 900], [375, 812]]) {
  test(`F-008: at the end of every page, everything has revealed (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const url of ['/', '/product.html?c=amethyst', '/credits.html']) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(1200);
      const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal], [data-stagger] > *')].filter((el) => getComputedStyle(el).opacity !== '1').map((el) => el.className || el.tagName));
      expect(hidden, `${url} still hidden: ${hidden.join(', ')}`).toEqual([]);
      await expect(page.locator('.footer-small')).toBeVisible();
    }
  });
}

test('F-002: one screen-reader announcement per format change', async ({ page }) => {
  await page.goto('/product.html?c=amethyst');
  await page.waitForTimeout(600);
  const n = await page.evaluate(async () => {
    let count = 0;
    const live = [...document.querySelectorAll('[aria-live]')].filter((el) => el.closest('.buybox'));
    const mo = new MutationObserver((m) => { count += m.length; });
    live.forEach((el) => mo.observe(el, { childList: true, characterData: true, subtree: true }));
    const r = document.querySelector('input[name=format][value=jar]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((f) => setTimeout(f, 900));
    mo.disconnect();
    return count;
  });
  expect(n).toBeLessThanOrEqual(2);
  await expect(page.locator('[data-announce]')).toHaveText('Jar of big crystals, $95.');
});

test('reduced motion: nothing is hidden, no glint, no flight, no burst', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/motion-ready/);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal], [data-stagger] > *')].filter((el) => getComputedStyle(el).opacity === '0').length);
  expect(hidden).toBe(0);
  await page.goto('/product.html?c=amethyst');
  await page.locator('[data-add]').click();
  await expect(page.locator('.flyer')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('glint')).length)).toBe(0);
  await expect(page.locator('.bag-count')).toHaveText('1');
});

test('signature: light catches the crystal on hover, with a cooldown', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-grid] li[data-slug="citrine"] .card');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2600); // past the entrance glint and its 1200 ms cooldown
  await page.mouse.move(0, 0);
  await card.hover();
  const n = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('[data-slug="citrine"]') && a.effect.target.classList.contains('glint') && a.playState === 'running').length);
  expect(n).toBe(1);
  await page.mouse.move(0, 0);
  await card.hover(); // within the cooldown: no second sweep
  const again = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('glint') && a.effect.target.closest('[data-slug="citrine"]')).length);
  expect(again).toBe(1);
});

test('add to bag: a thumbnail flies to the bag, then the badge bumps', async ({ page }) => {
  await page.goto('/product.html?c=amethyst');
  await page.waitForTimeout(600);
  await page.locator('[data-add]').click();
  await expect(page.locator('.flyer')).toHaveCount(1);
  await expect(page.locator('.flyer')).toHaveCount(0, { timeout: 2000 });
  await expect(page.locator('.bag-count')).toHaveText('1');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('checkout: errors shake the fields once, the confirmation sparkles', async ({ page }) => {
  await seedBag(page, [{ slug: 'citrine', format: 'bag', qty: 1 }]);
  await page.goto('/checkout.html');
  await page.locator('[data-place]').click();
  await page.waitForTimeout(60);
  const shaking = await page.evaluate(() => document.getAnimations().filter((a) => a.id === 'shake').length);
  expect(shaking).toBeGreaterThan(0);
  await page.fill('#name', 'Ava Stone');
  await page.fill('#email', 'ava@example.com');
  await expect(page.locator('.co-step').first().locator('.step-num')).toHaveClass(/done/);
  await page.check('input[name=ful][value=pickup]');
  await page.check('input[name=pay][value=person]');
  await page.locator('[data-place]').click();
  await expect(page.locator('.burst svg')).toHaveCount(14);
  await expect(page.locator('.burst')).toHaveCount(0, { timeout: 2500 });
});

test('price and totals roll instead of jumping', async ({ page }) => {
  await page.goto('/product.html?c=citrine');
  await page.waitForTimeout(600);
  await page.check('input[name=format][value=jar]');
  const rolling = await page.evaluate(() => document.getAnimations().some((a) => a.effect?.target?.matches?.('[data-per], [data-qty]')));
  expect(rolling).toBe(true);
  await expect(page.locator('[data-price]')).toHaveText('$150');
});

for (const url of ['/', '/product.html?c=amethyst']) {
  test(`layout stays still while things move (CLS ≤ 0.05): ${url}`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__cls)).toBeLessThanOrEqual(0.05);
  });
}
