# Review — code-reviewer — whole product — round 1 — M-0004

VERDICT: PASS WITH FINDINGS

## Scope reviewed
Commit 5cce69a: `projects/melody-crystal-shop/site/js/{bag,checkout,money,payment,product,home,ui,credits}.js`, `site/data/crystals.js`, the HTML shells, `css/styles.css` (overlay layers), `tests/`. Read against brief.md (Definition of exceptional, Success criteria) and experience.md §7–§9.

## Method
- `npm install && npm run verify`: static and unit checks pass, then `43 passed (27.3s)` for e2e.
- Ran two Playwright probes from the scratchpad against `scripts/serve.mjs` on port 4199. They covered corrupt storage, a `setItem` that throws, the toast hit-test at 375 px, Tab order while the toast is up, network and storage capture through a full card order, pay-in-person combined with over-time, a close-then-reopen race on the drawer, and a bag change in a second tab during checkout.
- Grepped for network APIs, storage use and stub markers.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-001 | S1 | One malformed bag entry crashes every page | bag.js:41 |
| F-002 | S2 | Bag does nothing when `setItem` throws; a parse error leaves the storage note stuck on | bag.js:11 |
| F-003 | S2 | Faded toast still blocks taps on Keep shopping at 375 px | ui.js:288 |
| F-004 | S2 | Keyboard and screen-reader users can't reach Undo while the drawer is open | ui.js:307 |
| F-005 | S2 | Pay in person + over time shows money "due today" | checkout.js:180 |
| F-006 | S2 | A bag change in another tab leaves the checkout total stale; the order uses the new amount | ui.js:376 |
| F-007 | S3 | Catalogue strings interpolated without `esc()` | product.js:57 |
| F-008 | S3 | Card-check edges: 2220 read as Mastercard, YY 99 accepted, debit copy | payment.js:30 |

Key evidence:
- **F-001:** with `mc.bag.v1='[null,…]'` the page throws `Cannot read properties of null (reading 'slug')`. The home grid shows 0 of 12 cards and checkout shows no form. This persists for the visitor, which makes it a broken flow (S1). It is not S0: no data is exposed and no money is computed wrongly.
- **F-003:** `elementFromPoint` at the centre of Keep shopping returns `<span>Removed Amethyst</span>` 5.6 s after the toast faded to opacity 0.
- **F-004:** with the toast up, the only Tab stops are `Shop crystals` and `Close bag`.
- **F-006:** tab A's button reads "Place order · $16.00". Tab B adds a Citrine jar. Submitting in tab A confirms a $166.00 order. The cause is that `bag:external` is dispatched but nothing listens for it.

## Checks that passed
- **Money in whole cents.** `fmt` rounds once and `installments` puts the remainder on payment 1, so the parts always add up to the total. Fees match the spec: delivery $5 free over $75, shipping $8 free over $100, pickup free. The drawer subtotal, summary, button, schedule and confirmation agree. Probe: $95 jar + pickup + over time gives $23.75 × 4 everywhere.
- **Pay in person with shipping.** The option is disabled, `aria-describedby` points at the visible reason, and choosing shipping clears an existing selection with a live message plus an inline error. Probe: `checked false, disabled true` and the spec copy.
- **Card and gift card validation.** Luhn, brand detection with Amex 4-6-5 grouping and a 4-digit CVC, expiry that runs to the end of its month, 5-digit ZIP, 16-digit gift code with a 4-digit PIN. The error copy matches §9.
- **Card data never leaves the browser.** During a full credit-card order the probe saw zero requests apart from fonts, no `4242` or `1230` in local or session storage, and the URL never changed. Card inputs are blanked in `place()`, and the order object keeps only the brand and last 4 digits. The site has no `fetch`, XHR or `sendBeacon` anywhere.
- **XSS.** URL inputs never reach HTML unvalidated. `?c=` only resolves through `bySlug`, and the `#shop?i=` hash is checked by regex and against a whitelist. All user text on the confirmation (name, email, address) goes through `esc()`. Credit URLs are restricted to `https://`.
- **Unknown slugs and formats** in the bag are dropped, and quantities are clamped to 1–10. A bad product slug shows the not-found page.
- **Drawer.** It is an `aria-modal` dialog, Tab is trapped inside it, Esc and the scrim close it, and focus returns to the opener. Probe 7 found no close/reopen race.
-

## Strengths worth keeping
- `money.js` and `payment.js` are small pure modules with unit tests.
- Prices are read fresh from the data file, so Melody's price edits apply to bags that are already saved.

## Overall assessment
The core is solid. The money maths reconciles, validation behaves like a real checkout, and the preview promise ("your details stay in this browser") holds up under capture. Nothing is S0. Fix F-001 before Melody sends the link to anyone: one bad storage write should not be able to brick the shop. The other S2s are what a careful customer would trip over:
- the invisible toast (F-003)
- Undo unreachable from the keyboard (F-004)
- "due today" on in-person orders (F-005)
- a total that changes at submit after a second tab edits the bag (F-006)

Each finding has a 1–10 line fix; add e2e regressions for each.
