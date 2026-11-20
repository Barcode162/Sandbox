# Board review — plan gate — director-vision — round 1 — M-0001

VERDICT: CONDITIONAL
SCORE: 8.4 / 10

The plan is unusually faithful to the spec. All 45 polish items map to both a builder WO and a test WO (plan.md:68-116). Every brief success criterion maps to a WO (plan.md:47-66). Every bake-off order F1–F17 and D1–D10 survives into the spec (experience.md:17-47) and from there into WOs. The weakness is on my side of the table. The plan *verifies* beauty very thoroughly, but nobody is assigned to *judge and tune* it before Gate 2. It also captures no motion, even though motion is the whole subject of the Owner's ask. Four checkable conditions fix that.

## Rubric
| # | Dimension | Score | Why (evidence) |
|---|---|---|---|
| 1 | Fidelity | 8.5 | **Scroll-scrubbed.** `state(p)` is pure (§3.2, WO-012 `purity.test.js`).<br>**Stop and admire.** Hold bands are in every scene WO, and admire, placard and breathing are covered (WO-016/017).<br>**Tests for that.** WO-012/013/019/020/021 carry E-/U- ids in the spec's own words.<br>**Gap.** Brief exceptional #2 (20 random stops worth screenshotting) is captured (WO-014 S1–5, WO-020) but only judged by the integrator. No designer judges it (condition 1). |
| 2 | Ambition & delight | 8.5 | All nine grin moments (§14:819-828) have a builder:<br>- hook: WO-007, E-K1;<br>- fan stands up: #44;<br>- dispersion you can count: WO-009 #6, D3 numbers;<br>- shimmer: WO-010 breathing;<br>- click: WO-011 overshoot;<br>- placard: WO-016/017;<br>- rewind: WO-018;<br>- chorus and white point: seams, #41.<br>The plan keeps the ambition intact. It adds no moment of its own, and none is needed. |
| 3 | Craft & polish | 8.0 | The polish list is real and numeric, e.g. #2 R/G/B ≤ 3, #10 exact `#FFFFFF`, #40 +68 px at 40 px. That is excellent.<br>What is missing is an art-direction loop. WO-014's fix rights cover only "defects the spec suites expose" (plan.md:389), not taste. Mosaic colour (the Scene 4 LUT), dispersion legibility and wall warmth can all pass every test and still look merely competent. |
| 4 | Correctness & robustness | 8.5 | Determinism, reversibility, endpoints, seams (state gate first, F5), resize (F8), error ledger (F9), context loss (WO-022), and 3× green runs (WO-023/024). |
| 5 | Engineering quality | 8.0 | Frozen contracts, exhaustive ownership, test-engineer suites written from the spec.<br>WO-014's ownership is very wide (plan.md:383-388), and it is a single integrator on the critical path. That is engineering's call, but flagged. |
| 6 | Performance | 8.0 | The Scene 4 spike is first (WO-005), with the D2 order and a decision rule. Scene 3 has a cost criterion (WO-009). There is a perf project with guards, and frame timing is treated as evidence, not a gate (§16.2:933), as I asked at the bake-off. |
| 7 | Accessibility & comfort | 9.0 | The flash audit is a real gate in verify step 5 (architecture.md:502, 525), including the tick-05 fling (D6).<br>Also covered: reduced-motion second cut with stills and contact sheet, pause control (WCAG 2.2.2), F6 exit semantics, 44 × 44 ticks, axe at 4 widths, 200% zoom, 7:1 chips. |
| 8 | Evidence | 8.0 | The §19 still pack, seam diffs, flash plots and perf.json are all planned.<br>There is **no motion evidence** for a piece whose subject is motion.<br>The WO-020 pack enumeration omits the §19 font-mode side-by-side. |

## What I verified myself
- **Plan text read in full.** plan.md:1-602. The coverage tables at :47-116 map every SC1–9 and polish item #1–#45; none are orphaned. I cross-checked them against experience.md §17:937-983.
- **Fold-ins carried through spec → plan.** I spot-checked each:
  - F1/F2: WO-003 `placardPhrase`, WO-016 3,000 ms, WO-017 hand-off.
  - F3: hold bands in `geometry.js` (WO-002), U-4 (WO-012).
  - F5: WO-012 `seams.test.js`, WO-013 E-S.
  - F6: WO-016 exit list.
  - F8: WO-006, E-R2.
  - F10: WO-007 at 40 px.
  - F11: WO-001 swap plus fallback faces, WO-021 E-P2.
  - F12: WO-017 `font-claim.js`.
  - F13: WO-016 blocks.
  - F14: WO-019 E-M1.
  - F16: #41 across WO-004/007–010/017.
  - F17: WO-022.
  - D1: WO-014 one fix round.
  - D2: WO-005.
  - D3: WO-009 scales 1.25/1.40/1.55 with a ≥ 6 px peak test.
  - D4: Scene 2 is 300 svh (experience.md:81, WO-002 tracks).
  - D5: §16.1.
  - D6: WO-020.
  - D7: #42.
  - D8: #32.
  - D9: WO-003.
  - D10: WO-001 font sha256.
- **Cut order.** §16.1:903-921 cuts the least visible items first (double refraction, breathing variety, label crossfade). It protects the hook, chorus, seams, placard, flash audit, rewind, portrait swap, hold bands and white point. The order is correct. The plan itself, though, has no slip policy: it says only that "WO-010 is the item that slips" (plan.md:33).
- **Flash audit is gating.** It runs in verify step 5 (architecture.md:502).
- **Video capture works here, so condition 2 is cheap.** I ran a Playwright `recordVideo` probe with the global playwright and bundled Chromium, and it produced a webm:
  - script: `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/gv/v.cjs`
  - output: `/tmp/claude-0/-home-user-Sandbox/38f4e0e3-50ba-5c77-a74b-041e9ff5000a/scratchpad/gv/vid/page@7634aa441124096ad78fc31309124165.webm` (16,412 B, "ok")
  - `/usr/bin/ffmpeg` is also present for stitching.
- **No open findings.** `bureau finding list M-0001 --open` returned "no findings match".

## Conditions
1. **Add an art-direction review WO** (experience-designer, the C designer). It is a reviewer, not a builder.
   - **When:** after WO-014 and WO-015, before WO-022/023 close.
   - **Review set:**
     - the 20 seeded random stops across **all six scenes** at 1440×900 and 375×812;
     - the three 1920 heroes;
     - the hold-band triplets;
     - the Scene 4 admire shimmer pair;
     - Scene 3 dispersion legibility at a glance (D3);
     - the Scene 1 frames against the album-cover guard (§2:70).
   - **Output:** a per-frame verdict (composed / not composed, with a reason) in `reports/WO-0NN-art-review.md`.
   - **Fixes:** every "not composed" or "competent, not beautiful" item becomes a tuning request with a named fix owner. It is resolved, or explicitly declined by the CEO with a reason, before WO-024 closes.
   - **Wiring:** WO-024's dependencies must include this WO.
2. **Motion evidence.** WO-020 records Playwright `recordVideo` webm files to `evidence/motion/`, indexed in `evidence/README.md`:
   - (a) a scripted wheel scroll-through and back over the full piece at 1440×900 and 375×812;
   - (b) an admire session at Scene 4 p .5 of ≥ 8 s real time: chrome recedes, placard appears, the shimmer moves, then a wheel exit;
   - (c) the 8 s rewind.

   Recording runs in a non-gating step, so it adds no flake risk to `verify`.
3. **§19 traceability in the pack.** `evidence/screens/index.md` maps **every** §19 bullet (experience.md:1000-1013) to at least one file. This explicitly includes:
   - the font-mode side-by-side (Mode G against the fallback face);
   - the noscript page;
   - the scene-error chip;
   - the placard on both chip themes.

   `pack.spec.js` fails if any bullet has no file.
4. **Slip policy written into plan.md.** Add a short section stating three rules:
   - Schedule pressure is absorbed **only** through the §16.1 order and the §16.2 perf fallbacks, each recorded with numbers in the WO report.
   - No WO may drop or flatten a §4 frame-table row, a hold band, a grin moment or a §16 non-negotiable.
   - If WO-005 or WO-010 runs late, Scene 4 (the peak) **extends the schedule**. It is not shipped below the WO-005-chosen configuration.

   Fill the plan's "Board conditions" section (plan.md:599-601) with each Gate 1 condition and where it now lives.

## Concerns (non-blocking)
- **Scene 1 gallery spot.** The radial "gallery spot" on the wall (experience.md:151) is not named in WO-007's acceptance criteria, and it carries most of the opening frame's warmth. Name it, or trust E-P1 and the art review to catch it.
- **Creep perceptibility.** It is proven only as a rate (U-4, #43). Perceptibility is judged by eye under condition 1.
- **Real-device feel.** Trackpad momentum, the iOS toolbar and real-GPU timing cannot be verified here. The README lists this (WO-024). I recommend the Owner gets a 60-second hand-scroll on a real laptop as part of delivery.
- **WO-014 breadth.** WO-014 is a very wide single-owner integration. If it overruns, the art review (condition 1) must not be squeezed out.

## Commendations
- The coverage tables are the best I could ask for. Every polish item has a builder and an independent test.
- Test-engineer suites are written from the spec, not the code, and "the spec wins" (plan.md:14). That is exactly the legible suite exceptional #7 asks for.
- Shipping WO-005 before WO-010 turns my bake-off probe into a real decision rule with numbers.
- Seam gates exist from wave 1 (WO-012), so the identity-seam promise gets tested early, not discovered late.
