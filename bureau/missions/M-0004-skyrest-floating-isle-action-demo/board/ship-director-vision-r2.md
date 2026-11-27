# Board review — ship — director-vision — round 2 — M-0004

VERDICT: APPROVE
SCORE: 8.1 / 10

All four of my round-1 conditions are met in the pictures, not only in the report. The hero now reads as a white-haired chibi from the chase camera, and that was the last thing keeping me off this. Placed beside `evidence/reference.jpg`, `moments/F2-reference.jpg` is the same kind of game. The temple, bridge and falls sit upper right, framing trees fill the corners, the golem is warm stone with orange runes, the cyan arc and the number land in the right places, and the HUD is on-token.

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 8.0 | Composition and palette match the reference (moments/F2-reference.jpg). The desktop mid-sky haze and the navy cliffs are still a step off the reference's clear blue and blue-grey. |
| 2 | Ambition & delight | 8.0 | The full loop with moments: telegraph plus "Roll through it!" (F7), kindle (F8), crumble (F9), coins flying to the pill (F10). |
| 3 | Craft & polish | 8.0 | Hair reads as swept white locks with no spikes (r2/F11-head-802x917-3x.jpg, F11-head-430x932-3x.jpg). Rim bushes break the arc (moments/F2-desktop.jpg). No dark limb on dither (wo-003/touch-*.jpg). |
| 4 | Correctness & robustness | 8.5 | The R1 code fixes hold. LP2 had a real cause, the paused redraw (game.ts:75-78 draw-on-change). It is green at the suite's 2 workers. |
| 5 | Engineering quality | 8.5 | Pure sim, pooled FX, gated hooks. Rim and occlusion are unit-tested (R1–R3 per reports/fix-r2-ship.md). |
| 6 | Performance | 8.0 | 122 draws / 351k tris on High is inside 250 / 1M. There is no real-iPhone fps yet. |
| 7 | Accessibility & comfort | 8.0 | The touch controls are clear of the hero (moments/F12-portrait.jpg), with a "Drag to move" hint, reduce-shake and safe areas. |
| 8 | Evidence | 8.0 | All evidence paths cited in findings.jsonl exist (my script found 0 missing). F12/F13 are now touch captures. |

Overall 8.1 is at or above the 8.0 threshold, and no dimension is below 7.

## What I verified myself
- Opened r2/F11-head-802x917-3x.jpg and F11-head-430x932-3x.jpg. Both show a white head with swept strands, no radial spikes and a cool underside.
- Opened moments/F2-reference.jpg, F2-desktop.jpg, F12-portrait.jpg, wo-003/touch-portrait.jpg and touch-landscape.jpg.
- F2-desktop: bushes and rock clusters break the rim, and the longest bare arc is about a quarter of the width. A gentle overall bow remains, much like the reference's own hill, so I accept it.
- Touch portrait and landscape: a canopy crosses the sight line and is dithered with its trunk. No limb crosses the hero or a button.
- A Python scan of every `projects/skyrest/...` path cited in findings.jsonl reported `missing: []`.
- `bureau finding list M-0004 --open` reports "no findings match". I verified F-011, F-016, F-022, F-023 and F-024 this round. F-001 to F-010, F-012 to F-015 and F-017 to F-021 were verified in round 1.

## Residual risks (not conditions)
- LP2 still times out in 2 of 8 runs under 4× worker stress on SwiftShader. That is a CI budget issue, not a product defect; keep the suite at 2 workers.
- Success criterion 6 (live on Pages and checked there) and smoothness on a real iPhone are still unproven. The CEO must open the live URL on a phone-sized viewport after publishing, before calling this done to the Owner.

## The single change that would most raise the picture
Sky and cliff colour, the last parity gap. Push the mid-sky band (8–25°) toward the reference's saturated blue, thin the god-ray wash on the left of the desktop frame, and lift the temple cliff from navy to the reference's lit blue-grey with moss.

## Conditions
None for ship. The residual risks above are follow-ups.
