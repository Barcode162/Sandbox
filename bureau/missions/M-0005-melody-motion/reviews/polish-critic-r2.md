# Review — polish-critic — motion — round 2 (verification) — M-0005

VERDICT: PASS WITH FINDINGS (0 S1; F-009 S2 and F-013 S3 reopened)

## Method
I checked dcab0bf from a clean `git archive` export on port 4197, using frame bursts at 1440 and 375 plus probes (reveal and stagger, page end, flight track, badge text, shakes, glint stamps, odometer, CLS). Six sheets, labelled in ms, are in `evidence/polish-r2/`.

## Verification
| ID | Result | Evidence |
|---|---|---|
| F-007 | VERIFIED. Nothing is auto-revealed (61 still pending at 6.4 s); the grid rises on entry; from the CTA, row 1 staggers 0/60/120/180 | 06 |
| F-008 | VERIFIED. The footer line reaches opacity 1 at page end, on every page, at both widths | 05 |
| F-009 | **REOPENED** | 01, 02 |
| F-010 | VERIFIED. Flies from the Add button with a visible arc | 03 |
| F-011 | VERIFIED. The per-piece line holds x 935 through $22→$150 | probe |
| F-012 | VERIFIED. In-view fields only, 60 ms apart, one shake on blur, none while typing | probe |
| F-013 | **REOPENED** for (b) only | 04 |
| F-014 | VERIFIED. 4.7 KB gzip is under the brief's 10 KB | wc |

**F-009.** It is one pass now, about 350 ms, but two problems remain:
- The leavers vanish with no 120 ms fade, so Amethyst sits alone for about 50 ms.
- Newcomers fade into column 2 while Amethyst is still sliding through it. Smoky Quartz overlaps it at 234 ms at 1440, and at 375 the names and prices print over each other at 114 ms.

Fix: delay newcomers about 200 ms, give movers z-index 1, and restore the leaver fade.

**F-013.** (a) cooldown, (c) ring, (d) undo slide and (e) feathered veil are fixed. (b) is not: the badge reads "1" at 4 ms and only the bump waits for landing at 625 ms, because `bag:change` repaints the count before `flying` is set.

## New (S3)
- **F-016.** An instant jump to the grid batches the head, chips and cards together. Because the 8-item cap is global, the cards get no stagger and all 8 glint at once. Count the cap per `[data-stagger]` parent.
- **F-017.** At 375, only 4 of 11 chips are revealed; the off-screen ones stay hidden until swiped, then fade in late. Reveal the row as one unit.

## Polish list: 14/15
#5 and #7 now pass. All round-1 passes held: CLS on home 0.006 and product 0. The one failure is #15: a single 61 ms long task during home load.

## Judgement
Motion now plays where it should, and it feels premium and calm. What remains: the Sleep collision (worth fixing before the Board), the early badge number, and the instant-jump flash.
