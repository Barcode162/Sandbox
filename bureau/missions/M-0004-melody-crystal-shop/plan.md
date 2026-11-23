# Plan — M-0004 Melody's Crystals

## Architecture (contracts)
Static site, no build step. `projects/melody-crystal-shop/site/`:
- `index.html`, `product.html?c=<slug>`, `checkout.html`, `credits.html`
- `css/styles.css` — tokens (light/dark), components, pages
- `data/crystals.js` — **the one file Melody edits**: crystals (slug, name, meaning, help, tags, chakra, photo, focus, alt, credit) and prices in whole cents per format
- `js/money.js` — `fmt(cents, {whole})`, `installments(total, n=4)` (remainder on payment 1), `fees(subtotal, method)`
- `js/payment.js` — `luhn`, `cardBrand`, `formatCardNumber`, `validExpiry`, `cvcLength`, order-number generator
- `js/bag.js` — `mc.bag.v1` store with in-memory fallback; events `bag:change`
- `js/ui.js` — header, theme (`mc.theme`), drawer (focus trap, undo), image fallback
- `js/home.js`, `js/product.js`, `js/checkout.js` — page controllers

Verify: `npm run verify` = static checks (every crystal has 3 prices, photo file exists, credit present) + unit tests (`node --test`) + Playwright e2e (flows, every payment × fulfilment rule, axe serious/critical = 0, no console errors, screenshots at 375/768/1440 light + dark).

## Work orders
- **WO-1 Assets** (CEO): 12 Commons photos → 1200 px + 480 px JPEG, credits recorded in data.
- **WO-2 Site** (CEO, per M-0001 precedent of the CEO building a single site on frozen contracts): all pages per `design/experience.md`.
- **WO-3 Verification** (CEO): unit + e2e + axe + screenshots.
- **Review wave**: code-reviewer, polish-critic (fresh, independent). **Ship**: director-vision.

## Budget
designer 1 + code-reviewer 1 + polish-critic 1 + director-vision 1 = 4 of 8; headroom for one remediation engineer if needed.

## Board conditions
(none at tier 2)
