# Review: polish-critic, verification of F-006..F-030, round 2, M-0002

VERDICT: PASS WITH FINDINGS

## Scope reviewed
HEAD 73bbb61. dist/ is newer than every file in src/. I checked 25 resolved findings: F-006..F-012 (code-reviewer) and F-013..F-030 (polish-critic r1). The brief said "20"; the real range has 25. I built none of these fixes.

## Method
- `npx vitest run`: 182/182. `-t "F-0"`: 20 named tests pass (F-005/007/008/014/017/022/023/024/026/027/028/029).
- `node scripts/e2e/perf.mjs` ×3: R18 median p95 **6.2 / 5.0 / 5.2 ms** (budget 8). Worst single pass 7.1 ms.
- My own Playwright captures at 1280×720, DSF 1, JPEG q80. They use stage hooks plus manual-clock bursts of 17–100 ms, with real `page.mouse` input for place, buy, press and Play. Scripts: scratch `cap.mjs` / `cap2.mjs`. Raw frames: `evidence/verify-r2/raw/` (zero console errors). I read every zoomed sheet in `evidence/verify-r2/`.

## Verification table
| ID | Verdict | Evidence (evidence/verify-r2/…) |
|---|---|---|
| F-006 | verified | perf ×3 green, all medians ≤ 6.2 ms |
| F-007 | verified | sim/index.ts:415-421, :511; peel test |
| F-008 | verified | game.ts:596-597; game.test F-008 |
| F-009 | verified | garden.ts:113-160 (bands + tile pattern); vignette/grain intact in raw/sweep-r18-8s-s.jpg |
| F-010 | verified | blots.ts:333-334 |
| F-011 | verified | blots.ts:501-504; F-025-toplay-0-500ms.jpg |
| F-012 | verified | perf.mjs:22,54, header :4-5; architecture.md:102 |
| F-013 | verified | F-013-idle-burst-1280.jpg, F-013-idle-1920-900.jpg (pops at x 620-700) |
| F-014 | verified | F-014-arrival-zoom-x2.jpg, raw/f014-arrive-stage.jpg (~85% of the disc visible, heave) |
| F-015 | verified | F-015-F-016-fold-cards-a/b-x2.jpg (10 cards, no collisions) |
| F-016 | verified | F-016-go-and-fold-badges-x4.jpg, F-016-fold-badges-top-x4.jpg |
| F-017 | verified | F-017-place-flecks-0-396ms-x2.jpg |
| F-018 | verified | F-018-hover-star-x3.jpg |
| F-019 | verified (blink gone; residual → F-032) | F-019-morph-0-320ms-x3.jpg |
| F-020 | verified | F-020-F-027-spend-chip-x3.jpg |
| F-021 | verified | F-023-F-021-death-0150-0900.jpg (banner arrives at ~500 ms, after the bar is gone) |
| F-022 | verified (launch only; regression → F-031) | F-022-shed-burst-x2.jpg |
| F-023 | verified | F-023-death-zoom-x2.jpg (burst r≈100, scraps, separate Knots) |
| F-024 | verified | F-024-title0-title800-shed50.jpg |
| F-025 | verified | F-025-toplay-0-500ms.jpg (pills clear at 150 ms, hint at ~350 ms) |
| F-026 | verified | F-026-resume-states-x3.jpg, F-026-title-play-pressed-x3.jpg, F-026-after-release-inside.jpg |
| F-027 | verified | F-020-F-027-spend-chip-x3.jpg (650→597→543→490→450, linear, ~130 ms) |
| F-028 | verified (by code and test; not listened) | mix.ts:56,59; audio.test F-028 |
| F-029 | verified | F-029-victory-0-2700ms.jpg (quiet 0-1100 ms, cranes from 1300 ms) |
| F-030 | verified | garden.ts:366; raw/f030-gameover-s.jpg |

25 verified, 0 reopened.

## Findings filed
| ID | Sev | Title | Where |
|---|---|---|---|
| F-031 | S2 | Shed Splashes march across the Inkmaw's face for ~1 s after every shed | §10.6 shed +500..1450 ms |
| F-032 | S3 | Upgrade morph: the coaster swells ~12% at 100-167 ms | §10.4 Buy |
| F-033 | S3 | Boss-death bar tear falls across the field as two drained dark girders | §10.6 Death +150..450 ms |

**F-031 is a regression introduced by the F-022 fix.** The Splashes now spawn behind the boss. They move at 160 px/s and the boss at 28 px/s, so they overtake it and are drawn over the maw. That recreates the original "caterpillar on the face" for about 1 s, three times per fight (F-022-shed-overtake-600-2100ms-x1.5.jpg). Fix: sort the blots pass by radius so the boss draws above smaller blots while they overlap.

## Checks that passed
No new overlaps in the r2 frames (fold cards, chips, banners, badges, title wash). Press and release behave correctly. Every stage hook landed on its moment, with zero console errors.

## Overall assessment
All 25 fixes hold in the pixels. What remains is one S2 regression in the boss fight (F-031) and two S3 refinements. F-031 blocks the Flagship Test at the 50% shed beat. Perf margin is adequate but thin on the worst pass (7.1 / 8 ms).

## Round 3: verification of F-031, F-032, F-033
Working tree on top of 848d4d1; dist/ was rebuilt after the src changes. vitest 182/182. I recaptured the same frames with the same scripts.

| ID | Verdict | Evidence (evidence/verify-r2/…) |
|---|---|---|
| F-031 | verified | r3-F-031-shed-overtake-600-2100ms-x1.5.jpg: the Splashes pass under the maw from 600 to 1400 ms and come out ahead. r3-F-031-shed-launch-x1.5.jpg: the spray behind the boss still reads at 130–280 ms. |
| F-032 | verified | r3-F-032-morph-0-320ms-x3.jpg: the coaster edge sits at x 319 in all six sampled frames (pixel scan at y 510). Only the figure morphs. |
| F-033 | verified | r3-F-033-death-0150-0900.jpg: the halves are pale, stay near the bar (y ≈ 60–100), are faint at 250 ms and gone by 300 ms. The empty track reads as a light paper tear, not as girders. |

Regression scan:
- **Over-inkwell pass (s < 175).** At arrival +0 to +2.5 s the boss stays above both the inkwell and the Knots, and the heave is intact (r3-F-031-arrival-overinkwell-x2.jpg).
- **R20 death.** The burst radius, the Knots and the "The Inkmaw tears!" timing at ~500 ms are unchanged from r2.
- **Victory.** Quiet from 0 to 1100 ms; cranes from 1300 ms (re-run, victory reached 6.85 s after death).
- **Console.** Zero errors.

Note: the r3 run overwrote raw/f023-death-d0300.jpg, so that file now shows the fixed tear. The r2 "before" state survives in F-023-F-021-death-0150-0900.jpg.

All three are verified, with no new findings.
