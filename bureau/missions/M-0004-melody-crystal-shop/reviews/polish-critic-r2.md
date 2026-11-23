# Review — polish-critic — verification — round 2 — M-0004

VERDICT: PASS WITH FINDINGS (0 S0 · 0 S1 open)

## Scope reviewed
Commit 691180f, checked against my round-1 findings F-009..F-025, plus visual regression checks of the code-review fixes F-001..F-008. Every §16 moment at 375×812, 768×1024 and 1440×900, in light and dark.

## Method
I re-ran the round-1 capture script against the new build (95 frames, served via `python3 -m http.server 4191` from `site/`; `serve.mjs` was killed twice in round 1), plus the round-1 probes: gutters/scrollWidth, the count-up frame by frame, scroll and focus after confirm, resize after confirm, chip restore, CLS, caret and expiry. I read every frame I cite. The 12 kept frames are in `evidence/polish-r2/`. No console errors or page errors anywhere in the run.

## Verification (round-1 findings)
| ID | Result | Before → after |
|---|---|---|
| F-009 format scenes | VERIFIED. The gallery is photos only; a 96 px inset now reads as a diagram | r1 d-light-06 → d-light-06-pdp-jar, whatyouget-inset-x2 |
| F-010 mobile gutter | VERIFIED. 20/20 gutters | m-light-05-pdp |
| F-011 confirm scroll | VERIFIED. scrollY 0 at 375 and 1440 | m-light-13-confirm |
| F-012 photo set | VERIFIED. The crops close the "checkerboard" gap; residual edges filed as F-029 | d-light-grid-rows23 |
| F-013 trio tilt | VERIFIED. −2°/+1.5°, with overlap | d-light-01-home |
| F-014 mobile photo | VERIFIED. The 3-up strip sits above the CTA | m-light-01-home |
| F-015 H1 tower | VERIFIED. 3 lines | d-light-01-home |
| F-016 field drift | VERIFIED. Inputs share a top edge (611; 743) | d-light-11-errors, 11b |
| F-017 sticky summary | VERIFIED | d-light-11b-card-errors |
| F-018 count-up | VERIFIED. No negative frame under rapid switching | probe log |
| F-019 confirm totals | VERIFIED. Stacked, "about" dropped | d-light-13-confirm |
| F-020 resize error | VERIFIED. No pageerror | probe |
| F-021 chip restore | VERIFIED. Sleep scrolled into view, right-edge fade | m-light-sleep-chip |
| F-022 tiles | VERIFIED. Filled check; "2–3 cm" no longer breaks | d-light-06-pdp-jar |
| F-023 thumb labels | VERIFIED | d-light-06-pdp-jar |
| F-024 alignment slips | VERIFIED | d-light-11b |
| F-025 double hairline | VERIFIED | (captures s3 shop) |

**F-001..F-008, regression look:**
- A malformed bag entry still renders all 12 cards with badge 2.
- Undo now sits inside the drawer and reads cleanly.
- The drawer is fine full and empty, in light and dark.
- Pay in person + over time correctly shows "Due at pickup", but its option copy contradicts it (new F-028).
- I found no visual regressions.

## Polish-list scorecard: 24 / 25 pass
Items 1, 3–25 pass: re-checked by capture or probe, or unchanged since round 1 (CLS 0.0061; focus return, caret, expiry, Undo, fallback, titles and alphabet as before). Item 7 now passes.
**Item 2 is a partial FAIL.** The mat, radius and vignette are uniform, but white or black photo edges still touch the frame on Carnelian, Lapis and Rose Quartz (F-029, S3).

## Did the crops close F-012?
Mostly, yes. Before, the grid alternated black, grey, olive and beige fields. Now 9 of 12 frames are filled edge to edge with the stone's own texture, and the eye reads a consistent macro "specimen" set. The residue is small corners and bands, plus Black Tourmaline, which crops to grey matrix. That is S3 polish, not an Owner-visible break. A re-source should still happen once Commons stops returning 429.

## New findings
| ID | Sev | Title |
|---|---|---|
| F-028 | S2 | Pay in person: plan copy says "One payment today" / "one today" while totals say "at pickup" |
| F-029 | S3 | Residual photo-edge slips after the crops (with per-crystal focus targets) |
| F-030 | S3 | Two illustration styles for the formats (#how vs product inset); #how card titles float |
| F-031 | S3 | Chip row has no left fade; confirmation total labels sit 6–8 px above their values |

## Five tests
- **Flagship:** PASS, narrowly. The PDP now reads like a boutique listing, and the photo set reads as one.
- **Stranger:** PASS.
- **Second-Look:** PASS WITH FINDINGS (F-028..F-031).
- **Abuse:** PASS. Rapid switching, malformed storage and resize after the order all hold.
- **No-Excuses:** PASS. No console errors.

## Top changes still worth making
1. Fix the F-028 copy: "One payment at pickup", and "one at pickup, then every 2 weeks".
2. Apply the F-029 per-crystal focus and scale, and re-source the dark-field photos when Commons allows.
3. Reuse the product inset art in #how (F-030).
4. Two-edge chip mask, and baseline-aligned totals (F-031).

## Strengths worth keeping
The tilted hero now feels like a real table. The mobile first screen shows stones, promise and CTA together. The "What you get" inset is honest and quiet. The sticky summary keeps money in view throughout checkout.

## Overall assessment
Every round-1 finding is fixed and verified, and no S0/S1 remains. Ship-quality, with one S2 copy fix advised before the Board.
