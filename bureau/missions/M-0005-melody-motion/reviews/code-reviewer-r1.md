# Review — code-reviewer — motion (whole diff) — round 1 — M-0005

VERDICT: FAIL

## Scope reviewed
- `git diff 63c5ddc..a8af578 -- projects/melody-crystal-shop`, which covers:
  - `site/js/motion.js` (new)
  - wiring in `ui.js`, `home.js`, `product.js`, `checkout.js`, `credits.js`
  - the CSS "Motion (M-0005)" section and its reduced-motion block
  - the `data-motion` and `data-stagger` markup in the HTML
  - `tests/e2e/motion.spec.js`
- HEAD is be93863, which changes no site files.
- I judged it against the brief (Definition of exceptional #1–6) and experience.md §3 (guardrails) and §5 (inventory).

## Method
- `PORT=4196 npm run verify`, then `motion.spec.js` run twice on its own.
- Playwright probes (`/tmp/claude-0/-home-user-Sandbox/612469a2-3761-5800-b39d-b7a5d00ca12c/scratchpad/m5probe.mjs`) against my own server on 4196, which I stopped by PID afterwards. They covered:
  - the reveal state over time
  - MutationObserver counts on live regions
  - three Adds 150 ms apart
  - remove, then Enter twice, then undo
  - 13 chip clicks 40 ms apart
  - a reduced-motion confirmation
  - JS disabled
  - a stubbed IntersectionObserver that never fires
  - Name typing cost
  - rapid thumbnail clicks

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-006 | S1 | `npm run verify` is red: two coverage tests fail every run (nav, qty-note) | motion.spec.js:36 |
| F-001 | S2 | The 3 s failsafe reveals everything, so the scroll choreography is lost | motion.js:57 |
| F-002 | S2 | Price count-up inside `aria-live`: 17 mutations per format change | product.js:56 |
| F-003 | S3 | Reduced motion still holds content invisible for up to ~350 ms (animation delays) | styles.css:698 |
| F-004 | S3 | Name/Email keystrokes rebuild the whole summary | checkout.js:325 |
| F-005 | S3 | Badge roll is a no-op; the flight can start off-screen; order number split into letter spans | ui.js:373 |

Key evidence:
- **F-006:** `62 passed`, 2 failed. The failures are `nav has no motion on /` and `qty-note has no motion on /product.html?c=amethyst`, and they repeat 2 of 2 runs with a clean tree. The motion exists, on `a::after` and on `:not(:empty)`, but the detector can't see it. The coordinator reported "green with 62"; my count is 62 passed plus 2 failed.
- **F-001:** below-fold elements read `[60, 0 in]` at 0.3 s and `[59, 59 in]` at 3.5 s. Anyone who lingers on the hero never sees a section reveal.
- **F-002:** one Bag → Jar change produces 17 mutations in `.buy-price[aria-live]`.

## Checks that held
- **M-0004 flows.** Three rapid Adds give badge 3, bag qty 3, no stray `.flyer`, the drawer open with focus on "Close bag", and no page errors.
- **Remove and undo.** Pressing Enter twice on Remove removes once (the `data-leaving` guard), and focus lands on Undo. Undo restores both lines at opacity 1. Increasing quantity rolls to 2 and the subtotal reads $182.00.
- **Filter spam.** After 13 clicks the state is consistent: pressed `calm`, 6 visible and all matching, status "6 crystals for Calm", no stuck `.is-leaving`, nothing invisible in view. The `clearTimeout(applyFilter.t)` makes this safe.
- **Checkout maths.** The checkout maths is unchanged. Rolls only animate text that `fmt` has already computed, so totals still reconcile. The step-badge logic reads RULES without side effects.
- **Content without JS.** With JS disabled, nothing is hidden on home or credits. Pre-reveal CSS is gated on `html.motion-ready`.
- **Dead observer.** With an IntersectionObserver that never fires, 10 elements are hidden at 0.5 s and 0 at 3.5 s, so the failsafe works for its intended case.
- **Reduced motion.** No WAAPI animations, glints, bursts or flights run. JS checks `reduced()` at every entry point.
- **Leaks.** Burst hosts and flight clones remove themselves, glint spans are reused, and the shimmer is one timer gated on visibility.
- **Inputs at z-index 2.** Focus rings still drawn (styles.css:355, 481); axe passes.
- **Performance.** `flip()` batches reads; hot loops write text only.

## Strengths worth keeping
A single dependency-free `motion.js` where every helper returns early under reduced motion, and consistent cancel-on-new-input.

## Overall assessment
The motion layer is well built and does not regress M-0004 money, focus or bag behaviour. It fails this round for two reasons:
- **The gate is red (F-006).** Success criterion 1 requires `npm run verify` to pass, and the inventory test is the brief's own proof of "every component moves".
- **The signature scroll choreography switches itself off after 3 s (F-001).**

F-002 should land in the same pass; the S3s can ride along.

## Round 2 (6b79b8f)
VERDICT: PASS WITH FINDINGS. `PORT=4196 npm run verify` exits 0 with 68 passed.

| ID | Result | Evidence |
|---|---|---|
| F-001 | verified | At 3.5 s: 60 below-fold, 0 in. A dead IO still reveals everything |
| F-002 | verified | 1 live mutation for jar, +, + |
| F-003 | verified | 0 hidden elements 30 ms after a reduced-motion confirmation |
| F-004 | verified | 0 summary mutations while typing |
| F-005 | verified | Badge roll fires; no off-screen flyer; order number has an aria-label |
| F-006 | verified | Gate green. The new qty-note, grid-status and bag-count transitions mostly satisfy the detector (taste) |

New: F-015 (S2). With the failsafe gone, the footer disclaimer can sit in the −8% rootMargin dead zone at maximum scroll. Seen once in 9 runs. Fix: reveal everything still hidden when the page reaches the end.
