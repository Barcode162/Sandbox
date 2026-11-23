# Review — polish-critic — whole site — round 1 — M-0004

VERDICT: FAIL (3 × S1)

## Scope reviewed
Every page and §16 moment, against §5/§14/§16, at 375×812, 768×1024 and 1440×900, in light and dark.

## Method
Playwright capture of the §16 list at 6 viewport/scheme combinations (~115 frames), plus probes for CLS, focus, caret, expiry, per-frame price, sticky state and scroll after confirm. I read every frame cited; 20 are kept in `evidence/polish-r1/`. The `serve.mjs` server on 4180 was killed twice mid-run by something outside this review, so I served `site/` with `python3 -m http.server 4187`.

## Polish-list scorecard: 23 / 25 pass
| # | | Evidence |
|---|---|---|
| 1 prices share baseline | PASS | d-light-03-shop |
| 2 same mat, no photo edge touching card | **FAIL**: black/grey fields run edge to edge (F-012) | d-light-00-homefull |
| 3 Shop crystals unscrolled | PASS | m-light-01-home, d-light-01-home |
| 4 press 1px/90ms, hover | PASS (styles.css:112-118) | |
| 5 focus ring | PASS | states-focus-undo-broken |
| 6 chip counts, hash restore | PASS (active chip offscreen, F-021) | t-dark-04-sleep |
| 7 format change in one frame | **FAIL**: "−$2" frame (F-018) | probe log |
| 8 Added ✓, bump, drawer | PASS; hover also good (d-light-card-hover) | d-light-08-drawer-full |
| 9 badge stable | PASS (min-width 20, tabular) | |
| 10 focus returns to opener | PASS (`data-add` refocused) | |
| 11 Undo 5 s | PASS | states-focus-undo-broken |
| 12 Pay in person reason visible | PASS | d-light-10-ship-person |
| 13 caret stable | PASS (insert at 7, caret 8) | |
| 14 brand badge early | PASS (Amex at "34") | d-light-11b |
| 15 expiry " / " and backspace | PASS ("12 / " → "1" → "") | |
| 16 real dates, exact sum | PASS (Today/Dec 7/Dec 21/Jan 4 × $29.25 = $117) | d-light-12-schedule |
| 17 waived fee struck, moss Free | PASS | d-light-09/11 |
| 18 error links focus field | PASS (link → #email) | |
| 19 order-number alphabet | PASS (MC-RNN3ME) | |
| 20 dark keeps mats, never black | PASS | d-dark-06-pdp-jar |
| 21 size-adjust, CLS ≤ .05 | PASS (0.0033 / 0.0000) | |
| 22 broken image → named mat | PASS | states-focus-undo-broken |
| 23 whole dollars vs cents | PASS | |
| 24 specific titles | PASS ("Amethyst · Melody's Crystals") | |
| 25 preview notice at top and on confirmation | PASS | d-light-09, d-light-13 |

## The questions the CEO asked
- **One photo set?** No. Six stones on black, three on grey/white, one olive, one beige: the 4-up grid reads as a checkerboard (F-012).
- **Hero, first 5 s.** Strong at 1440, but an animation bug cancels the "real table" tilt (F-013) and the H1 is a five-line tower (F-015). At 375 no photo shows above the fold (F-014).
- **PDP vs marketplace.** The structure is right. Tile wrapping and a faint check (F-022), generic thumb labels (F-023) and a broken mobile gutter (F-010) let it down.
- **SVG bag/jar scenes.** They cheapen it. At 560 px, beside real photos, a jar of 12 stamped ellipses reads as a mock-up and contradicts "About 6 pieces". That is the peak moment (F-009). Make it a small inset; keep the photo.
- **Checkout.** Copy, rules and math are excellent. The summary never sticks (F-017); paired fields drift when errors show (F-016).
- **Confirmation.** The best screen, but on mobile it opens scrolled past its heading (F-011), the totals split into three columns (F-019), and a resize throws (F-020).

## Five tests
- **Flagship:** FAIL. The format scenes and the uneven photo set read as "good for generated".
- **Stranger:** PASS. Paths are obvious and the copy is clear.
- **Second-Look:** FAIL. Dead tilt, 7–8 px field drift, a negative price frame, and a summary that never sticks.
- **Abuse:** PASS WITH FINDINGS. Rapid switching flickers prices.
- **No-Excuses:** FAIL. Console TypeError (F-020).

## Top 10 changes that would most raise the experience
1. Photo stays the main image for every format; the scene becomes a ≤140 px "What you get" inset (F-009).
2. One photo field: 12/12 on dark, or crops with the stone ≥ 85% of the frame (F-012).
3. Confirmation: instant `scrollTo` + `focus({preventScroll:true})` (F-011).
4. Mobile PDP gutter: `min-width:0` and scrolling thumbs (F-010).
5. Trio tilt and hover back via `rotate(var(--rot))` in the keyframes (F-013).
6. Sticky `.summary-col` (F-017).
7. `align-items:start` on `.row-2`/`.row-3` (F-016).
8. Clamp count-up `k` to [0,1]; cancel stale rAFs (F-018).
9. 112 px photo strip above the fold at 375; 3-line H1 at 1440 (F-014, F-015).
10. Stack the confirmation totals; drop "about" (F-019).

## Findings filed
S1: F-009, F-010, F-011. S2: F-012 to F-022. S3: F-023, F-024, F-025.

## Strengths worth keeping
The Fraunces/Figtree-on-cream palette feels authored, and dark mode is warm. The meanings drawer scans in 10 s. Checkout copy is honest. The empty bag and the confirmation are designed, not defaults.

## Overall assessment
Flagship bones and unusually complete behaviour. What holds it below the bar is visual: the format scenes, the uneven photo set, and layout bugs a second look catches at once. Fix the S1s and items 4–8, then re-capture.
