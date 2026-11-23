# Review — polish-critic — rendered product — round 1 — M-0002

VERDICT: PASS WITH FINDINGS

## Scope reviewed
I reviewed the `projects/constellation` build (WO-003) against experience.md §7, §9, §17 and §19 and the brief's "Definition of exceptional".

## Method
I ran `npm run build` and `vite preview`, then captured with Playwright and SwiftShader at DPR 1, using `?seed=1` and the `__constellation` clock. 62 captures, including bursts, are in `evidence/critic/`. I read every frame behind a verdict. F4 midway is `M-burst-0480.jpg`.

## Per-frame verdicts (1440 unless noted)
| # | Verdict | Note |
|---|---|---|
| F1 | Pass w/ findings | Black (0,0,0), 40 labels, 0 overlaps. No ring letters. The hint covers A and B. Halos untinted. |
| F2 | Pass | Clean dim; the card answers at once. |
| F3 | Pass | Centred at x=532 (=1065/2); the facet table is exact. |
| F4 | Pass w/ findings | Directional; max step 7.3 px per 16 ms. Chips stack mid-flight. |
| F5 | Partial | 21 boxed chips, owners unclear; no ice in the sky. |
| F6 | Partial | The race works, but on unlabelled beads; the shortcut zig-zags along the bottom. |
| F7 | Partial / Fail@1024 | A→F→X→Z can't be mapped onto the ring. At 1024 the route plays off-screen. |
| F8 | Fail | The toast covers the A end of the learned line. |
| F9 | Pass w/ findings | Condition chip and ×1 readable. The read target sits under the search field. |
| F10 | Pass | The best frame. |
| F11 | Pass / Fail after zoom | Clear ripple, counts 2/4/12/11. No reframe when zoomed elsewhere. |
| F12 | Pass w/ findings | Tea overlaps Temperature's ring. |
| 375 | Partial | The F3 sheet is good. F1 is the wrong fit, labels are clipped, the hint uses desktop copy. |
| Reduced motion | Pass | Snaps to the new lens; no lerp. |

## Polish list: 19 pass · 3 fail · 3 not verified
- **Pass:** 1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19, 20, 23, 24.
- **Fail:** 11 at 1024 (F-022), 13 (F-018), 21 (F-024).
- **Not verified:** 4, 22, 25.

## CEO question: the missing ring letters
They hurt. The drawer says *A → F → X → Z*; the sky shows an unlabelled yellow Z on unlabelled beads, so the transit map loses its map. Letters do render up close (O, P, Q in F9), so the problem is label priority: §7 ranks letters above degree, and the code fills the cap of 40 by degree.

It compounds F-016 (A and Z are neighbours). Filed as S2 (F-015), ranked second.

## Findings filed
| ID | Sev | Title |
|---|---|---|
| F-014 | S1 | Route and search never reframe the camera |
| F-015 | S2 | No Long Road letters |
| F-016 | S2 | Shortcut doesn't cross the ring |
| F-017 | S2 | Toast and hint cover the line and ring |
| F-018 | S2 | Undo leaves the drawer stale; ~120 ms reverse draw |
| F-019 | S2 | No lens colour in the sky (chroma ≈4/255) |
| F-020 | S2 | 21 boxed chips at F5 |
| F-021 | S2 | Pathway glyphs collapse to discs |
| F-022 | S2 | Breaks split units and the route's Z |
| F-023 | S2 | Canvas runs under the top bar |
| F-024 | S2 | New node born on its target |
| F-025 | S2 | Drawer button hierarchy inverted; ✕ outside the panel |
| F-026 | S2 | 375: fit, clipping, touch copy |
| F-027 | S3 | Close-up cores render as flat discs |
| F-028 | S3 | Results summary duplicates the headings |
| F-029 | S3 | Store sheet spacing and title at 375 |

## Five tests
- **Flagship:** not yet. F2 and F10 are flagship; F5–F8, which carry the thesis, are not.
- **Second look:** fails at F8 and F5.
- **First impression (10 s):** pass. Black sky, clear wordmark, readable clusters.
- **Coherence:** mostly. The lens accent carries through the UI, but not the sky (F-019).
- **Craft details:** mixed. Focus rings, the 1 px press and disabled-state reasons are good; wraps, gaps and clipping are not.

## Top 10 changes
1. Reframe the camera on route and search (F-014).
2. Ring letters, forced on route waypoints (F-015).
3. Reshape the ring so A–Z crosses the centre (F-016).
4. Toasts and the default fit clear of the ring (F-017).
5. Lens-tinted halos at 55% (F-019).
6. Ration and declutter the chips (F-020).
7. Stable pathway glyphs (F-021).
8. Top scrim and inset-aware framing (F-023).
9. Undo state and its 300 ms reverse draw (F-018).
10. Swap the verdict and Learn styles (F-025).

## Strengths worth keeping
F10 result card, facet table, F11 hierarchy, ignition, morph, copy voice.

## Overall assessment
The instruments work, and F2 and F10 are at flagship level. The thesis moments, the Long Road and disagreement, are not yet composed. One S1. Fix the top 5, then re-shoot F1, F5–F8 and F11 at all three widths.
