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
- **Leaks.** The burst host removes itself, the flight clone is removed on finish and on cancel, glint spans are reused per frame, and the shimmer is a single timer chain gated on visibility and `document.hidden`. Nothing grows without bound.
- **Rapid thumbnails.** `aria-current` and the shown photo agree, there is one `.frame`, and opacity is 1.
- **Inputs at z-index 2.** Focus rings are still drawn through `input:focus-visible + .tile-body/.choice-body` (styles.css:355, 481). The axe scans pass.
- **Performance.** `flip()` batches all reads before the mutation, the hover glint uses `closest()` only, and hot loops write text only.

## Strengths worth keeping
- A single dependency-free `motion.js` (about 8 KB, no deps), where every helper returns early under reduced motion.
- Cancel-on-new-input is applied consistently: the flight, shake, roll and count-up raf.
- The seeded burst means each order number has a stable look.

## Overall assessment
The motion layer is well built and does not regress M-0004 money, focus or bag behaviour. It fails this round for two reasons:
- **The gate is red (F-006).** Success criterion 1 requires `npm run verify` to pass, and the inventory test is the brief's own proof of "every component moves".
- **The signature scroll choreography switches itself off after 3 s (F-001).** It needs a one-line fix.

F-002 should land in the same pass, because a screen-reader customer hears every frame of the price count-up. The S3s can ride along.
