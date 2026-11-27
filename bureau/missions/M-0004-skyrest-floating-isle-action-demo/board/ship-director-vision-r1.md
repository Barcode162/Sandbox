# Board review — ship — director-vision — round 1 — M-0004

VERDICT: REJECT
SCORE: 7.5 / 10

Remediation moved the picture a long way. Next to `evidence/polish/F2-ref-high.jpg` (before), the temple is now the reference's white-and-blue hall, the golem reads as warm grey stone, the blossom has a trunk, the trail is cyan and the numbers stack cleanly. It is now the same kind of game as the reference. What still fails is the hero, and the hero is on screen in every frame. His head still reads as a spiked mace. I won't put my name on a flagship demo whose protagonist reads as a weapon from the chase camera. The rest of the gap is small and listed below.

## Rubric
| # | Dimension | Score | Why (one line, with evidence) |
|---|---|---|---|
| 1 | Fidelity | 7.5 | Layout, palette, temple, golem, bridge and falls match (moments/F2-reference.jpg vs evidence/reference.jpg). The hero head and the mid-sky haze still miss. |
| 2 | Ambition & delight | 8.0 | The whole loop is there: title, telegraphed slam with the "Roll through it!" hint (F7), kindle (F8), crumble (F9), coins flying to the pill (F10). |
| 3 | Craft & polish | 6.5 | Mace head (F-011), tiny-planet rim on desktop (F-016), and a skeletal trunk over the hero and the Attack button when a canopy dithers (F-022). |
| 4 | Correctness & robustness | 8.5 | All 7 code findings hold in code (game.ts:85-102,200-206; sim.ts:104-118; renderer.ts:116-121; ui/index.ts:253). LP2 flake filed as S3 (F-024). |
| 5 | Engineering quality | 8.5 | Pure deterministic sim, pooled FX, test hooks gated (game.ts:270-273). |
| 6 | Performance | 8.0 | 117 draws / 309k tris High, 110 / 228k Low (evidence/wo-002/budget.json). There is no real-iPhone fps yet. |
| 7 | Accessibility & comfort | 8.0 | Reduce-shake, clear touch controls (wo-003/touch-*.jpg), readable hints, safe areas. |
| 8 | Evidence | 6.0 | 12 resolutions cite images that don't exist (wo-002/*.jpg, wo-003/r1/), F-023. The moments F12/F13 are not touch captures. |

Overall 7.5 is below the 8.0 threshold, and Craft and Evidence are below the floor of 7.

## What I verified myself
- Opened reference.jpg and the fresh moments F1, F2 (desktop/portrait/reference), F3, F4, F6, F7, F8, F9, F10, F12-portrait and F13-landscape, plus wo-003/touch-portrait and touch-landscape, and compared them with the pre-fix polish/F2-ref-high.jpg.
- Made a 3× crop of the hero (F2-reference 320,680–480,870). It shows a grey sphere with radial spikes and a cape. No hair shape reads.
- `ls projects/skyrest/evidence/wo-002`: JSON files only. `wo-003/r1` is missing.
- Read the fix lines for F-001 to F-007, the touch-portrait.json button rects and the hero box (bottom sy 0.867 with the hero moved; F12 moment ≈0.82).
- Findings: I verified 19. I reopened 2: F-011 (S1) and F-016 (S2). I filed 3 new ones: F-022 (S2), F-023 (S3) and F-024 (S3).

## Per finding (non-obvious calls)
- F-008 verified. The top 40% is saturated blue and the white mass in the mid sky matches the reference's clouds. The haze on the left of the desktop frame is still heavier than the reference.
- F-017 verified. The falls and moss lip read. The cliffs are darker navy than the reference's blue-grey; that is noted, not reopened.
- F-018 verified. The isles have a cap, a tree and vines. The cone silhouette remains, but in the far plane that is acceptable.
- F-020 verified. The hero clears the buttons in F12 and in touch-portrait.
- LP2 (F-024) does not block: it passes alone, and the failure is a test race, not a product defect.

## Conditions
1. **F-011:** in the F2-reference capture, the hero's head reads as white anime hair swept back and down. No spikes break the skull outline at the top or sides. Proof: a 3× crop at 802×917 and at 430×932.
2. **F-016:** in F2-desktop (1280×720), no unbroken arena-rim arc spans more than 50% of the frame width. Break it with rim rocks or bushes and a cliff lip, or flatten the outer dome.
3. **F-022:** when a near canopy dithers, its trunk and branches fade with it. Recapture touch-portrait and touch-landscape with no dark limb over the hero or a button.
4. **F-023:** every resolved finding's evidence path exists on disk. Regenerate F12 and F13 as `hasTouch` captures in moments/.
5. After 1–4, rerun `moments.spec.ts` and resume me for round 2. I will judge only these four items, against the frames above.
