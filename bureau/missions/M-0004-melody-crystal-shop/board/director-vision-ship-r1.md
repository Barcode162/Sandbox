# Board review — ship — director-vision — round 1 — M-0004

VERDICT: APPROVE
SCORE: 8.6 / 10

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 9.0 | All ten of her asks are met (table below). The one gap, real payments, is honestly labelled "Preview checkout" and documented in README §Payments. |
| 2 | Ambition & delight | 8.0 | It reads as a boutique, not a template: the tilted specimen hero, the "What you get" pouch inset, the price count-up, and "Thank you, Ada! … With love, Melody". It is warm and finished but not unforgettable. |
| 3 | Craft & polish | 8.5 | The photo set is consistent, type and rhythm are clean, and 375 px has no overflow (scrollWidth 375). Some residual photo edges remain (F-029, resolved, with a re-source deferred). |
| 4 | Correctness & robustness | 9.0 | My own flow: Luhn, expiry, CVC, ZIP and email errors in human copy. The pickup + pay-in-person + 4-payment copy is coherent ("one at pickup"). Zero console errors. |
| 5 | Engineering quality | 8.5 | Static ES modules and one data file for prices. The code-reviewer r2 found no money, data or security regressions, and its checks held. |
| 6 | Performance | 8.5 | CLS 0.0061 (polish-critic r2). The only third-party hosts are fonts.googleapis.com and fonts.gstatic.com (my request log). |
| 7 | Accessibility & comfort | 8.5 | The axe e2e suite is green, the Undo focus trap is fixed (F-026), and the radios have visible selected states. Dark and reduced motion: reviewers' evidence only. |
| 8 | Evidence | 8.0 | `npm run verify` gives 50 passed, and the reviews cite frames. The README is stale: it says "43 Playwright tests" while 50 run. |

## Her ask, point by point (verified myself)
1. **Title and meanings screen.** The hero is "Melody's Crystals" with its promise. The meanings section lists all 12 stones (d-meanings.jpg).
2. **Clickable pictures and names.** The home page has 12 unique `product.html?c=` targets (picture and name).
3. **Scroll to crystals and prices.** The grid shows a "From $12" price, intention tags and "View options" (d-shop.jpg).
4. **Amazon-like page for every crystal.** All 12 PDPs load with 3 format radios and a 1200 px photo (probe: `amethyst:3:1200` … `fluorite:3:1200`).
5. **Bag, big crystal and jar.** Amethyst is $16 / $42 / $95, and the button reprices live.
6. **Pay button asks for card info.** The card fields (number, name, expiry, CVC, ZIP) appear when card is chosen. Gift card asks for a code and PIN.
7. **Card, gift, debit, credit, in person.** All five are present. Pay in person is disabled with shipping (probe: `disabled: true`).
8. **Delivery, shipping, in person.** All three are present with fees and free-over thresholds.
9. **Pay over time or on the site.** "Pay in full" or "4 × $23.75". The confirmation shows "4 payments of $17.00 · $17.00 today".
10. **"Lots of high-quality full webpage".** Four pages plus bag drawer, FAQ and how-it-works; finished at 1440 and 375.

## What I verified myself
- `npm run verify`: `50 passed (33.1s)`. Open findings: F-028..F-031 all resolved.
- Playwright walk at 1440 and 375 (home, meanings, shop, PDP, Buy now, checkout errors, confirmation): no console errors; Google Fonts is the only external host.
- `serve.mjs` was killed (exit 144) partway through my run, as it was for the polish-critic. It looks like the sandbox; the site is static, so I used `python3 -m http.server`.

## Why not a 9
It has no signature moment, such as her own voice or photo, or a "find your stone" guide. That belongs in v2, once she supplies her own photos and a processor account.

## Conditions (non-blocking; fix before handing over the link)
1. Fix the README test count: "43 Playwright tests" should be 50. Also re-check the photo count and the "(one cropped)" note against the current crops.
2. In the delivery note to the Owner, state plainly that checkout is a preview and takes no money until Stripe/Square is connected (README §Going live).
