# Board review — ship — director-vision — round 1 — M-0005

VERDICT: APPROVE
SCORE: 8.5 / 10

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 9.0 | "A lot of animations for all the components": the inventory test asserts motion per component on all four pages, and my frames show the hero, grid, tiles, button, flight, drawer, checkout and confirmation all moving. |
| 2 | Ambition & delight | 8.5 | It now has the signature moment M-0004 lacked: the quiet sparkle burst and the order number typing in on "Thank you" (sheetD), plus the thumbnail flight to the bag. |
| 3 | Craft & polish | 8.5 | It is calm, not noisy: the grid staggers, "Added ✓" lands, and the drawer slides in. Polish-critic r2 round 3 closed F-009/013/016/017. The hover glint is barely visible on light stones (see below). |
| 4 | Correctness & robustness | 8.5 | Zero console errors in my runs. Reveal never re-hides, and the end-of-page sweep fixes F-015 (code-reviewer r3, 18 runs). |
| 5 | Engineering quality | 8.5 | It is dependency-free (WAAPI + IO); `motion.js` is 4,783 B gzip, under the 10 KB cap; the glint has a cooldown and the burst is seeded. |
| 6 | Performance | 8.0 | CLS on home is 0.0059 by my own measurement. One 61 ms long task on home load remains (polish-critic r2 item #15). |
| 7 | Accessibility & comfort | 8.5 | With reduced motion, 0 in-view elements sit below opacity 1 (my probe). The price live region gets 1 mutation per change (F-002). |
| 8 | Evidence | 8.0 | `npm run verify` passed. The count is **69, not 70** (`playwright test --list`: "Total: 69 tests"), so the coordinator's figure is off by one. |

## What I verified myself
- `npm run verify` at the working tree (HEAD c8155aa, site at ac7df20): `69 passed (48.7s)`.
- `serve.mjs` is killed in this sandbox (exit 144, as on M-0004), so I served `site/` with `python3 -m http.server 4198`.
- Frame captures at 1440×900 (in the scratchpad `m5/`):
  - hero at 80/400/1200 ms: the trio and trust icons assemble, sheetA;
  - "Shop crystals" grid at 100/300/700 ms: heading, chips and card stagger, sheetA;
  - Jar pick and Add to bag at 120/150/350/650/1100 ms: price rolls to $95, thumbnail flies over the head, "Added ✓", drawer, sheetB;
  - checkout: "Placing your order…" spinner, then the confirmation;
  - burst at 80/250/500 ms: stars, order-number type-in, sparkle on the check, sheetD.
- Reduced-motion probe: 0 hidden elements in view right after scrolling to #shop.
- `bureau finding list M-0005 --open`: no findings open.

## Observations (non-blocking)
- **The glint is shy.** I hovered Rose Quartz and caught frames at 120 and 300 ms, and I could not see the sweep. Polish-critic stamped it by probe, so it fires, but at the brief's "signature" billing it should read at a glance on pale stones.
- **No-JS:** the shop grid is rendered by JS, so with JS off "Shop crystals" has no cards and no `<noscript>` line. This predates M-0005 (the reveal itself hides nothing), but a one-line `<noscript>` fallback is cheap.

## Why APPROVE
The Owner asked for life everywhere. Every component moves, the motion serves the sale, and reduced motion, CLS and the no-hidden-content rules hold under my own probes. The confirmation burst is a real moment of delight.

## Conditions (non-blocking; fold into the next pass)
1. Raise the hover glint's visibility on pale stones (Rose Quartz, Clear Quartz, Selenite) so it is visible in a 300 ms frame capture.
2. Add a `<noscript>` line in #shop on index.html pointing to the product pages (or a static list).
3. Correct the test count to 69 in the ship notes and README.
