# Melody’s Crystals

A small online shop for Melody’s hand-picked crystals. Twelve stones, what each has traditionally stood for, and a product page for every stone where buyers choose a **tumbled bag**, **one big crystal**, or a **jar of big crystals**. They add it to a bag and check out with:

- **How it reaches them:** local delivery, shipping, or in-person pickup
- **How they pay:** credit card, debit card, gift card, or pay in person (not offered for shipped orders)
- **When they pay:** in full, or over time in 4 payments (today, then every 2 weeks)

Built by the Bureau as mission M-0004 (`bureau/missions/M-0004-melody-crystal-shop/`).

## Run it

It's a static site with no build step. Any static host works (GitHub Pages, Netlify, Cloudflare Pages), or locally:

```bash
npm run dev          # http://127.0.0.1:4173/
```

Node 22+ is only needed for the dev server and tests. The site itself is plain HTML, CSS and JavaScript modules in `site/`.

## Verify it

```bash
npm install
npm run verify       # catalogue check + unit tests + 43 Playwright tests (flows, axe a11y, 375–1920 px)
```

## Pages

| Page | What it does |
|---|---|
| `index.html` | Title and promise, what each stone means (every picture and name is clickable), the shop grid with prices and an intention filter (Calm, Sleep, Love…), how buying works, FAQ |
| `product.html?c=<stone>` | Marketplace-style listing: gallery, the three formats with prices, quantity, Add to bag / Buy now, meaning, how it can help, care |
| `checkout.html` | Contact, fulfilment, payment, plan, live order summary, confirmation with an order number |
| `credits.html` | Photographer and licence for every photo |

The bag slides out from every page and is saved in the browser. Light and dark themes, keyboard support, and reduced motion are all handled.

## Changing prices, stones and copy

Everything lives in **`site/data/crystals.js`**. Prices are in **cents** (`1600` = $16.00) for `bag`, `big` and `jar`. Delivery fees and free-delivery thresholds are in `site/js/money.js` (`FULFILMENT`). After editing, `npm run test:static` checks that every stone still has three prices and credited photos.

## ⚠️ Payments are a preview

The checkout validates card details like a real one (card number checksum, brand, expiry, CVC), but **it does not charge anyone and sends nothing anywhere**. Card numbers are never stored. The page says so to buyers. Placing an order shows a confirmation and clears the bag; Melody receives nothing yet.

**Going live** needs a payment processor account in Melody's name. The simplest route for a static site:

1. Create a [Stripe](https://stripe.com) (or Square) account and turn on cards plus a pay-later option such as Klarna or Afterpay for "pay over time".
2. Replace `place()` in `site/js/checkout.js` with a redirect to Stripe Checkout or a Payment Link. Never collect raw card numbers on your own page once live; the processor's hosted form handles that.
3. For "pay in person" orders, send the order to Melody by email (Formspree or Netlify Forms work without a server).
4. Add sales tax if your state requires it.

## Photos

The 23 crystal photos come from Wikimedia Commons under CC BY, CC BY-SA or public-domain licences, resized (one cropped) for the web. Credits are in `site/data/credits.js` and shown on `credits.html`. CC BY-SA photos stay under that licence. Melody can swap in photos of her own stones by replacing the files in `site/img/crystals/` (`<id>-480.jpg` and `<id>-1200.jpg`) and updating `credits.js`.

The bag and jar pictures on product pages are drawn in SVG and filled with the stone's own photo.

## Wellness copy

Meanings are presented as tradition and folklore, never as medical claims. The static check fails if "heals", "cures" or "treats" appear in a stone's copy.
