# Review — polish-critic — rendered product — round 1 — M-0002

VERDICT: PASS WITH FINDINGS

## Scope reviewed
I reviewed the `projects/constellation` build (WO-003) against experience.md §7, §9, §17 and §19 and the brief's "Definition of exceptional".

## Method
I captured `vite preview` with Playwright at DPR 1 (`?seed=1`, `__constellation` clock). 62 captures, including bursts, are in `evidence/critic/`. I read every frame behind a verdict. F4 midway is `M-burst-0480.jpg`.

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
They hurt: the drawer reads *A → F → X → Z* over unlabelled beads. The cause is label priority, where §7 ranks letters above degree.

It compounds F-016 (A and Z are neighbours). Filed as S2 (F-015), ranked second.

## Findings filed
- **S1:** F-014 (route and search never reframe the camera).
- **S2:** F-015 (no ring letters), F-016 (shortcut doesn't cross the ring), F-017 (toast covers the line), F-018 (Undo leaves a stale drawer), F-019 (no lens colour in the sky), F-020 (chips), F-021 (glyphs collapse to discs), F-022 (breaks), F-023 (top bar), F-024 (birth position), F-025 (drawer), F-026 (375).
- **S3:** F-027, F-028, F-029.

## Five tests
- **Flagship:** not yet. F2 and F10 are flagship; F5–F8, which carry the thesis, are not.
- **First impression (10 s):** pass.
- **Coherence:** mostly. The lens accent carries through the UI, but not the sky (F-019).
- **Craft details:** mixed. The states are good; wraps and clipping are not.

## Top 10 changes
In order: F-014, F-015, F-016, F-017, F-019, F-020, F-021, F-023, F-018, F-025.

## Overall assessment
The instruments work, and F2 and F10 are at flagship level. The thesis moments, the Long Road and disagreement, are not yet composed. One S1. Fix the top 5, then re-shoot F1, F5–F8 and F11 at all three widths.

## r1 verification (HEAD 6937c71)
I re-rendered the same moments into `evidence/critic/r1v/`.

**Verified (11):**
- **F-014:** the route and search now reframe the camera (`F7-1024`, `F11-1440`).
- **F-015 and F-016:** all 26 letters show, and the A–Z chord of about 560 px crosses the empty centre.
- **F-017:** the toast moved to the top.
- **F-018:** Undo resets the drawer.
- **F-021, F-023, F-026 to F-029:** fixed.

**Reopened (5):**
- **F-019:** the tint reads up close, but overview chroma is only about 12–14/255. The skies read cream against blue-white, not amber against ice.
- **F-020:** chips still sit on cores and labels in the Heat knot.
- **F-022:** the Z still wraps at 1024.
- **F-024:** Tea still touches its neighbour.
- **F-025:** at 1024 the ✕ overlaps the "Results" tab.

**New (F-030, S2):** the regenerated layout knots the Heat cluster, so labels sit on cores. The spiral ring also runs through the Simmer loop at F9.

F6–F8 are now the strongest sequence. Verdict: **PASS WITH FINDINGS**, with no open S1.

## r2 verification (HEAD 014699d)
I re-rendered the frames into `evidence/critic/r2v/`.

**Verified (5):**
- **F-019:** halo chroma is now about 25/255; F1 reads amber and F5 reads ice.
- **F-020, F-022, F-025:** fixed.
- **F-030:** the Heat cores are spaced and the ring clears the flowcharts.

**Reopened: F-024.** Tea is born on top of Flame Step.

**New:**
- **F-031 (S2):** Temperature has no label at the F1 overview.
- **F-032 (S3):** the Physicist chips crowd, though the values stay readable.
- **F-033 (S3):** an icon crosses the stats text.

**r3 (7b9841d):**
- **F-024:** verified.
- **F-031:** reopened. Temperature is now labelled, but the forced hub labels overlap cores ("Boiling Point" over Heat, "Memory" under Route).
- **F-032 and F-033:** I would waive both for this milestone.

Verdict: **PASS WITH FINDINGS**. No S1 is open.
